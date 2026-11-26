import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Send,
  Layers,
  Sparkles,
  HelpCircle,
  Folder,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { practiceAdminApi } from './practice-admin.api';
import {
  PracticeAdminVersionDetail,
  PracticeAdminExerciseSet,
  PracticeAdminQuestion,
  PracticeValidationResult,
  PracticeValidationIssue,
} from './practice-admin.types';
import { ExerciseSetTree } from '../../../components/practice-admin/ExerciseSetTree';
import { ExerciseSetForm } from '../../../components/practice-admin/ExerciseSetForm';
import { QuestionEditor } from '../../../components/practice-admin/QuestionEditor';
import { PublishValidationPanel } from '../../../components/practice-admin/PublishValidationPanel';
import { ReviewActions } from '../../../components/practice-admin/ReviewActions';
import { AutosaveIndicator, AutosaveStatus } from '../../../components/practice-admin/AutosaveIndicator';
import { PracticeStatusBadge } from '../../../components/practice-admin/PracticeStatusBadge';
import { GlassCard } from '../../../components/ui';
import { extractErrorMessage } from './practice-admin.utils';
import { appConfirm, appNotice } from '../../../lib/dialog';

export const PracticeVersionEditorPage: React.FC<{ versionId: number }> = ({ versionId }) => {
  const { user } = useAuth();
  const [version, setVersion] = useState<PracticeAdminVersionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Selection state
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  // Validation state
  const [validation, setValidation] = useState<PracticeValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autosaveError, setAutosaveError] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'structure' | 'editor' | 'quality'>('structure');
  const [showFirstSetHint, setShowFirstSetHint] = useState(
    () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('start') === '1'
  );

  const fetchVersion = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const data = await practiceAdminApi.getVersion(versionId);
      setVersion(data);

      // Auto-select first set & question if none selected
      if (data.exerciseSets.length > 0) {
        setSelectedSetId((prev) => (prev ? prev : data.exerciseSets[0].id));
        if (data.exerciseSets[0].questions.length > 0) {
          setSelectedQuestionId((prev) => (prev ? prev : data.exerciseSets[0].questions[0].id));
        }
      }
    } catch (err: any) {
      const error = extractErrorMessage(err);
      setLoadError(error.message);
      appNotice(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [versionId]);

  const runValidation = useCallback(async () => {
    try {
      setIsValidating(true);
      const res = await practiceAdminApi.validateVersion(versionId);
      setValidation(res);
    } catch (err) {
      appNotice(extractErrorMessage(err).message, 'error');
    } finally {
      setIsValidating(false);
    }
  }, [versionId]);

  useEffect(() => {
    fetchVersion();
    runValidation();
  }, [fetchVersion, runValidation]);

  const isEditable = version?.status === 'DRAFT' || version?.status === 'REVISION_REQUIRED';

  // ─── Exercise Set Actions ──────────────────────────────────────────────────
  const handleAddSet = async () => {
    if (!version || !isEditable) return;
    const nextCode = `${version.collectionCode}-SET-${Date.now().toString().slice(-4)}`;
    try {
      const newSet = await practiceAdminApi.createExerciseSet(version.id, {
        code: nextCode,
        skill: 'LISTENING',
        titleZh: '新部分 Phần mới',
        titleVi: 'Phần bài tập mới',
        sortOrder: version.exerciseSets.length + 1,
      });
      appNotice('Đã thêm phần bài tập mới!', 'success');
      await fetchVersion();
      setSelectedSetId(newSet.id);
      setSelectedQuestionId(null);
      runValidation();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  const handleSaveSet = async (data: Partial<PracticeAdminExerciseSet>) => {
    if (!selectedSetId) return;
    try {
      setAutosaveStatus('saving');
      await practiceAdminApi.updateExerciseSet(selectedSetId, data);
      setAutosaveStatus('saved');
      setLastSavedAt(new Date());
      appNotice('Đã lưu phần bài tập thành công!', 'success');
      await fetchVersion();
      runValidation();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      setAutosaveStatus('error');
      setAutosaveError(error.message);
      appNotice(error.message, 'error');
    }
  };

  const handleDeleteSet = async () => {
    if (!selectedSetId) return;
    try {
      await practiceAdminApi.deleteExerciseSet(selectedSetId);
      appNotice('Đã xóa phần bài tập.', 'success');
      setSelectedSetId(null);
      setSelectedQuestionId(null);
      await fetchVersion();
      runValidation();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  const handleMoveSet = async (setId: number, direction: 'up' | 'down') => {
    if (!version || !isEditable) return;
    const sets = [...version.exerciseSets];
    const idx = sets.findIndex((s) => s.id === setId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sets.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = sets[idx];
    sets[idx] = sets[targetIdx];
    sets[targetIdx] = temp;

    const items = sets.map((s, i) => ({ id: s.id, sortOrder: i + 1 }));
    try {
      await practiceAdminApi.reorderExerciseSets(version.id, items);
      await fetchVersion();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  // ─── Question Actions ──────────────────────────────────────────────────────
  const handleAddQuestion = async (targetSetId?: number) => {
    const setId = targetSetId || selectedSetId;
    if (!setId || !version || !isEditable) return;

    const set = version.exerciseSets.find((s) => s.id === setId);
    const nextCode = `${set?.code || 'SET'}-Q${String((set?.questions.length || 0) + 1).padStart(2, '0')}-${Date.now().toString().slice(-3)}`;

    try {
      const newQ = await practiceAdminApi.createQuestion(setId, {
        code: nextCode,
        type: 'SINGLE_CHOICE',
        prompt: {
          text: 'Chọn câu trả lời đúng...',
          options: [
            { key: 'A', text: 'Lựa chọn A' },
            { key: 'B', text: 'Lựa chọn B' },
          ],
        },
        answer: { value: 'A' },
        explanation: 'Giải thích chi tiết...',
        score: 1,
        sortOrder: (set?.questions.length || 0) + 1,
      });
      appNotice('Đã tạo câu hỏi mới!', 'success');
      await fetchVersion();
      setSelectedSetId(setId);
      setSelectedQuestionId(newQ.id);
      runValidation();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  const handleSaveQuestion = async (data: Partial<PracticeAdminQuestion>) => {
    if (!selectedQuestionId) return;
    try {
      setAutosaveStatus('saving');
      await practiceAdminApi.updateQuestion(selectedQuestionId, data);
      setAutosaveStatus('saved');
      setLastSavedAt(new Date());
      appNotice('Đã lưu câu hỏi thành công!', 'success');
      await fetchVersion();
      runValidation();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      setAutosaveStatus('error');
      setAutosaveError(error.message);
      appNotice(error.message, 'error');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestionId) return;
    try {
      await practiceAdminApi.deleteQuestion(selectedQuestionId);
      appNotice('Đã xóa câu hỏi.', 'success');
      setSelectedQuestionId(null);
      await fetchVersion();
      runValidation();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  const handleDuplicateQuestion = async () => {
    if (!selectedQuestionId) return;
    try {
      const dup = await practiceAdminApi.duplicateQuestion(selectedQuestionId);
      appNotice('Đã nhân bản câu hỏi!', 'success');
      await fetchVersion();
      setSelectedQuestionId(dup.id);
      runValidation();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  const handleMoveQuestion = async (setId: number, questionId: number, direction: 'up' | 'down') => {
    if (!version || !isEditable) return;
    const set = version.exerciseSets.find((s) => s.id === setId);
    if (!set) return;

    const qs = [...set.questions];
    const idx = qs.findIndex((q) => q.id === questionId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === qs.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = qs[idx];
    qs[idx] = qs[targetIdx];
    qs[targetIdx] = temp;

    const items = qs.map((q, i) => ({ id: q.id, sortOrder: i + 1 }));
    try {
      await practiceAdminApi.reorderQuestions(setId, items);
      await fetchVersion();
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    }
  };

  // ─── Selected active entity ────────────────────────────────────────────────
  const activeSet = version?.exerciseSets.find((s) => s.id === selectedSetId);
  const activeQuestion = activeSet?.questions.find((q) => q.id === selectedQuestionId);
  const questionCount = version?.exerciseSets.reduce((sum, set) => sum + set.questions.length, 0) || 0;
  const validationErrors = validation?.errors || [];
  const validationWarnings = validation?.warnings || [];
  const validQuestionCount = validation ? version?.exerciseSets.reduce(
    (sum, set) => sum + set.questions.filter((question) =>
      !validationErrors.some((issue) => issue.entityType === 'QUESTION' && issue.entityId === question.id)
    ).length,
    0
  ) || 0 : 0;
  const mediaIssueCount = [...validationErrors, ...validationWarnings].filter((issue) =>
    /audio|image|media/i.test(`${issue.field} ${issue.code} ${issue.message}`)
  ).length;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Đang mở trình biên soạn phiên bản...
      </div>
    );
  }

  if (!version) {
    return (
      <GlassCard className="mx-auto my-12 max-w-2xl p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">Không mở được trình biên soạn</h1>
        <p role="alert" className="mt-2 text-sm text-slate-600 dark:text-slate-300">{loadError || 'Không tìm thấy phiên bản này.'}</p>
        <button type="button" onClick={fetchVersion} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Thử lại</button>
      </GlassCard>
    );
  }

  return (
    <div className="max-w-[1560px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Navbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <a
            href={`#/admin/practice/${version.collectionId}`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                {version.collectionCode}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Phiên bản {version.versionNumber}
              </span>
              <PracticeStatusBadge status={version.status} type="version" size="sm" />
            </div>
            {version.changeSummary && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{version.changeSummary}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AutosaveIndicator
            status={autosaveStatus}
            lastSavedAt={lastSavedAt}
            errorMessage={autosaveError}
          />

          <a
            href={`#/admin/practice/versions/${version.id}/preview`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem trước (Preview)</span>
          </a>

          {/* Workflow Transitions (Submit Review, Request Changes, Publish) */}
          <ReviewActions
            versionId={version.id}
            collectionId={version.collectionId}
            versionStatus={version.status}
            userRole={user?.role || 'STUDENT'}
            hasValidationErrors={Boolean(validation && !validation.valid)}
            onSubmitReview={async () => {
              await practiceAdminApi.submitReview(version.id);
              fetchVersion();
            }}
            onRequestChanges={async (note) => {
              await practiceAdminApi.requestChanges(version.id, { reviewNote: note });
              fetchVersion();
            }}
            onPublish={async () => {
              await practiceAdminApi.publishVersion(version.id);
              fetchVersion();
            }}
            onRetire={async () => {
              await practiceAdminApi.retireVersion(version.id);
              fetchVersion();
            }}
          />
        </div>
      </div>

      <nav aria-label="Đường dẫn biên soạn" className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <a href={`#/admin/practice/${version.collectionId}`} className="font-semibold hover:text-rose-600">Collection {version.collectionCode}</a>
        <span aria-hidden="true">/</span><span>Version {version.versionNumber}</span>
        {activeSet && <><span aria-hidden="true">/</span><span>{activeSet.titleVi || activeSet.titleZh}</span></>}
        {activeQuestion && <><span aria-hidden="true">/</span><span>{activeQuestion.code}</span></>}
      </nav>

      {showFirstSetHint && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
          <div><p className="font-bold">Bản nháp đã sẵn sàng</p><p className="mt-1">Thêm phần bài tập đầu tiên ở danh sách bên dưới, sau đó thêm câu hỏi và chạy kiểm tra hợp lệ.</p></div>
          <button type="button" onClick={() => setShowFirstSetHint(false)} aria-label="Đóng hướng dẫn" title="Đóng hướng dẫn" className="rounded-lg p-1 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600 dark:hover:bg-sky-900"><span aria-hidden="true">×</span></button>
        </div>
      )}

      <GlassCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Tiến độ nội dung</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{validQuestionCount} / {questionCount} câu không có lỗi validation cấp câu hỏi</p></div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{version.exerciseSets.length} phần</span>
            <span className="font-semibold text-rose-600 dark:text-rose-300">{validationErrors.length} lỗi</span>
            <span className="font-semibold text-amber-600 dark:text-amber-300">{validationWarnings.length} cảnh báo</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">{mediaIssueCount} vấn đề media</span>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Tỷ lệ câu hỏi hợp lệ" aria-valuemin={0} aria-valuemax={questionCount} aria-valuenow={validQuestionCount}>
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${questionCount ? (validQuestionCount / questionCount) * 100 : 0}%` }} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 lg:hidden" role="tablist" aria-label="Khu vực biên soạn">
        {([
          ['structure', 'Cấu trúc'],
          ['editor', 'Biên soạn'],
          ['quality', 'Kiểm tra'],
        ] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={mobileTab === key} onClick={() => setMobileTab(key)} className={`rounded-lg px-2 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 ${mobileTab === key ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'text-slate-500'}`}>{label}</button>)}
      </div>

      {/* Structure / editor / quality columns; tablet uses two columns, mobile uses tabs. */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-12 xl:gap-6">
        {/* Column 1: Exercise Sets & Questions Tree (3 cols ~ 280-320px) */}
        <div className={`${mobileTab === 'structure' ? 'block' : 'hidden'} min-w-0 lg:col-span-1 lg:block xl:col-span-3`}>
          <GlassCard className="p-4 h-[calc(100vh-180px)] min-h-[540px] flex flex-col">
            <ExerciseSetTree
              exerciseSets={version.exerciseSets}
              selectedSetId={selectedSetId}
              selectedQuestionId={selectedQuestionId}
              isEditable={isEditable}
              onSelectSet={(sId) => {
                setSelectedSetId(sId);
                setSelectedQuestionId(null);
                setMobileTab('editor');
              }}
              onSelectQuestion={(sId, qId) => {
                setSelectedSetId(sId);
                setSelectedQuestionId(qId);
                setMobileTab('editor');
              }}
              onAddSet={handleAddSet}
              onAddQuestion={handleAddQuestion}
              onMoveSet={handleMoveSet}
              onMoveQuestion={handleMoveQuestion}
            />
          </GlassCard>
        </div>

        {/* Column 2: Central Content Editor (6 cols) */}
        <div className={`${mobileTab === 'editor' ? 'block' : 'hidden'} min-w-0 space-y-6 lg:col-span-1 lg:block xl:col-span-6`}>
          <GlassCard className="p-6 min-h-[540px]">
            {selectedQuestionId && activeQuestion ? (
              <QuestionEditor
                key={activeQuestion.id}
                question={activeQuestion}
                isEditable={isEditable}
                onSave={handleSaveQuestion}
                onDelete={handleDeleteQuestion}
                onDuplicate={handleDuplicateQuestion}
              />
            ) : selectedSetId && activeSet ? (
              <ExerciseSetForm
                key={activeSet.id}
                exerciseSet={activeSet}
                isEditable={isEditable}
                onSave={handleSaveSet}
                onDelete={handleDeleteSet}
              />
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                Hãy chọn một phần bài tập hoặc một câu hỏi ở danh sách bên trái để chỉnh sửa
              </div>
            )}
          </GlassCard>
        </div>

        {/* Column 3: Validation, Metadata & Workflow Panel (3 cols) */}
        <div className={`${mobileTab === 'quality' ? 'block' : 'hidden'} min-w-0 space-y-4 lg:col-span-2 lg:block xl:col-span-3`}>
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Kiểm duyệt & Chất lượng
              </span>
              <button
                type="button"
                onClick={runValidation}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Kiểm tra lại
              </button>
            </div>

            <PublishValidationPanel
              validation={validation}
              isValidating={isValidating}
              onSelectIssue={(issue) => {
                if (issue.entityType === 'QUESTION') {
                  const set = version.exerciseSets.find((s) =>
                    s.questions.some((q) => q.id === issue.entityId)
                  );
                  if (set) {
                    setSelectedSetId(set.id);
                    setSelectedQuestionId(issue.entityId);
                  }
                } else if (issue.entityType === 'EXERCISE_SET') {
                  setSelectedSetId(issue.entityId);
                  setSelectedQuestionId(null);
                }
              }}
            />
          </GlassCard>

          <GlassCard className="p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-200">Thông tin phiên bản</h4>
            <div className="space-y-1.5 text-slate-500">
              <div className="flex justify-between">
                <span>Số phần thi:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {version.exerciseSets.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tổng số câu hỏi:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {version.exerciseSets.reduce((sum, s) => sum + s.questions.length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tổng điểm đề:</span>
                <span className="font-bold text-emerald-600">
                  {version.exerciseSets.reduce(
                    (sum, s) => sum + s.questions.reduce((qSum, q) => qSum + q.score, 0),
                    0
                  )}{' '}
                  điểm
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
