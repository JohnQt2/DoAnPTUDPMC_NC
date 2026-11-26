import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, RefreshCcw, Eye, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { practiceAdminApi } from './practice-admin.api';
import {
  PracticeAdminVersionDetail,
  PracticeAdminVersionSummary,
  PracticeValidationResult,
} from './practice-admin.types';
import { PublishValidationPanel } from '../../../components/practice-admin/PublishValidationPanel';
import { PracticeStatusBadge } from '../../../components/practice-admin/PracticeStatusBadge';
import { GlassCard, ShimmerButton } from '../../../components/ui';
import { formatDateTime, extractErrorMessage } from './practice-admin.utils';
import { appConfirm, appNotice } from '../../../lib/dialog';

export const PracticeReviewPage: React.FC<{ versionId: number }> = ({ versionId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [version, setVersion] = useState<PracticeAdminVersionDetail | null>(null);
  const [validation, setValidation] = useState<PracticeValidationResult | null>(null);
  const [previousVersion, setPreviousVersion] = useState<PracticeAdminVersionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Review modal
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesNote, setChangesNote] = useState('');

  useEffect(() => {
    if (!showChangesModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowChangesModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChangesModal]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const [vData, valData] = await Promise.all([
        practiceAdminApi.getVersion(versionId),
        practiceAdminApi.validateVersion(versionId),
      ]);
      const history = await practiceAdminApi.listVersions(vData.collectionId);
      setVersion(vData);
      setValidation(valData);
      const prior = history
        .filter((entry: PracticeAdminVersionSummary) => entry.versionNumber < vData.versionNumber)
        .sort((a: PracticeAdminVersionSummary, b: PracticeAdminVersionSummary) => b.versionNumber - a.versionNumber)[0];
      setPreviousVersion(prior ? await practiceAdminApi.getVersion(prior.id) : null);
    } catch (err: any) {
      const error = extractErrorMessage(err);
      setLoadError(error.message);
      appNotice(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestChanges = async () => {
    if (!changesNote.trim() || changesNote.trim().length < 5) {
      appNotice('Lý do yêu cầu chỉnh sửa phải từ 5 ký tự trở lên.', 'warning');
      return;
    }
    try {
      setIsSubmitting(true);
      await practiceAdminApi.requestChanges(versionId, { reviewNote: changesNote.trim() });
      appNotice('Đã gửi yêu cầu chỉnh sửa cho Biên tập viên!', 'success');
      window.location.hash = `#/admin/practice/${version?.collectionId}`;
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!isAdmin || version?.status !== 'IN_REVIEW' || !validation?.valid) {
      appNotice('Chỉ Admin mới có thể xuất bản phiên bản đang chờ duyệt và đã vượt qua validation.', 'error');
      return;
    }
    const confirmed = await appConfirm({
      title: 'Phê duyệt & Xuất bản phiên bản',
      message:
        'Bạn có chắc chắn muốn xuất bản phiên bản này không? Nội dung sẽ được hiển thị ngay cho học viên trên hệ thống.',
      confirmLabel: 'Xuất bản ngay',
    });
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await practiceAdminApi.publishVersion(versionId);
      appNotice('Đã phê duyệt và xuất bản thành công!', 'success');
      window.location.hash = `#/admin/practice/${version?.collectionId}`;
    } catch (err: any) {
      const error = extractErrorMessage(err);
      appNotice(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Đang tải trang phê duyệt...
      </div>
    );
  }

  if (!version) {
    return (
      <GlassCard className="mx-auto my-12 max-w-2xl p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{loadError ? 'Không mở được nội dung kiểm duyệt' : 'Không tìm thấy phiên bản'}</h1>
        <p role="alert" className="mt-2 text-sm text-slate-600 dark:text-slate-300">{loadError || 'Phiên bản có thể đã bị xóa hoặc bạn không có quyền truy cập.'}</p>
        <button type="button" onClick={loadData} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Thử lại</button>
      </GlassCard>
    );
  }

  const allQuestions = version.exerciseSets.flatMap((set) => set.questions);
  const questionTypeCounts = allQuestions.reduce<Record<string, number>>((counts, question) => {
    counts[question.type] = (counts[question.type] || 0) + 1;
    return counts;
  }, {});
  const referencedAudio = new Set<string>();
  const referencedImages = new Set<string>();
  const collectMedia = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(collectMedia);
      return;
    }
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      if (typeof child === 'string' && /audio/i.test(key)) referencedAudio.add(child);
      if (typeof child === 'string' && /image/i.test(key)) referencedImages.add(child);
      if (child && typeof child === 'object') collectMedia(child);
    });
  };
  version.exerciseSets.forEach((set) => {
    if (set.audioUrl) referencedAudio.add(set.audioUrl);
    set.questions.forEach((question) => {
      if (question.sourceAudio) referencedAudio.add(question.sourceAudio);
      collectMedia(question.prompt);
    });
  });
  const currentQuestionCount = allQuestions.length;
  const previousQuestionCount = previousVersion?.exerciseSets.reduce((sum, set) => sum + set.questions.length, 0) ?? 0;
  const previousSetCount = previousVersion?.exerciseSets.length ?? 0;
  const currentPoints = allQuestions.reduce((sum, question) => sum + question.score, 0);
  const collectVersionSnapshot = (source: PracticeAdminVersionDetail | null) => {
    const snapshot = new Map<string, string>();
    source?.exerciseSets.forEach((set) => {
      snapshot.set(`Phần ${set.code}`, JSON.stringify({
        skill: set.skill,
        titleZh: set.titleZh,
        titleVi: set.titleVi,
        instructions: set.instructions,
        estimatedMinutes: set.estimatedMinutes,
        audioUrl: set.audioUrl,
      }));
      set.questions.forEach((question) => {
        snapshot.set(`Câu ${question.code}`, JSON.stringify({
          type: question.type,
          prompt: question.prompt,
          answer: question.answer,
          explanation: question.explanation,
          score: question.score,
        }));
      });
    });
    return snapshot;
  };
  const previousSnapshot = collectVersionSnapshot(previousVersion);
  const currentSnapshot = collectVersionSnapshot(version);
  const addedChanges = [...currentSnapshot.keys()].filter((code) => !previousSnapshot.has(code));
  const removedChanges = [...previousSnapshot.keys()].filter((code) => !currentSnapshot.has(code));
  const modifiedChanges = [...currentSnapshot.keys()].filter((code) =>
    previousSnapshot.has(code) && previousSnapshot.get(code) !== currentSnapshot.get(code)
  );
  const publishBlocked = !isAdmin || version.status !== 'IN_REVIEW' || validation?.valid !== true;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <a
          href={`#/admin/practice/${version.collectionId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về chi tiết bộ đề</span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href={`#/admin/practice/versions/${version.id}/preview`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Mở Preview</span>
          </a>
        </div>
      </div>

      {/* Main Review Card */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                {version.collectionCode}
              </span>
              <PracticeStatusBadge status={version.status} type="version" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              Kiểm duyệt Phiên bản {version.versionNumber}
            </h1>
            <p className="text-xs text-slate-400">
              Biên tập viên: {version.creatorName} • Tạo lúc: {formatDateTime(version.createdAt)}
            </p>
          </div>

          {isAdmin && version.status === 'IN_REVIEW' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowChangesModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Yêu cầu sửa</span>
              </button>

              <ShimmerButton
                disabled={publishBlocked || isSubmitting}
                title={publishBlocked ? 'Chỉ Admin được xuất bản phiên bản đang IN_REVIEW đã vượt validation.' : 'Phê duyệt và xuất bản'}
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Phê duyệt & Xuất bản</span>
              </ShimmerButton>
            </div>
          )}
        </div>

        {/* Validation Result */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Kết quả kiểm tra tính hợp lệ
          </h3>
          <PublishValidationPanel validation={validation} isValidating={false} />
        </div>

        <section aria-label="Tổng quan phiên bản" className="grid gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-xs text-slate-500">Phần bài tập</p><p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{version.exerciseSets.length}</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-xs text-slate-500">Câu hỏi · tổng điểm</p><p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{currentQuestionCount} · {currentPoints}</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-xs text-slate-500">Tài nguyên tham chiếu</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{referencedAudio.size} audio · {referencedImages.size} ảnh</p></div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60"><p className="text-xs text-slate-500">Câu theo dạng</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{Object.entries(questionTypeCounts).map(([type, count]) => `${type}: ${count}`).join(' · ') || 'Chưa có câu hỏi'}</p></div>
        </section>

        {previousVersion && (
          <section aria-labelledby="version-diff-title" className="space-y-2 border-t border-slate-200 pt-5 dark:border-slate-800">
            <h2 id="version-diff-title" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">So với phiên bản {previousVersion.versionNumber}</h2>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {version.exerciseSets.length - previousSetCount} phần, {currentQuestionCount - previousQuestionCount} câu chênh lệch.
              <span className="block mt-1">Thêm {addedChanges.length} · sửa {modifiedChanges.length} · bỏ {removedChanges.length} mục.</span>
            </p>
            <p className="break-words text-xs text-slate-500 dark:text-slate-400">
              {modifiedChanges.length > 0 && <>Đã sửa: {modifiedChanges.slice(0, 6).join(', ')}{modifiedChanges.length > 6 ? ` và ${modifiedChanges.length - 6} mục khác` : ''}. </>}
              {addedChanges.length > 0 && <>Mới: {addedChanges.slice(0, 6).join(', ')}{addedChanges.length > 6 ? ` và ${addedChanges.length - 6} mục khác` : ''}. </>}
              {removedChanges.length > 0 && <>Đã bỏ: {removedChanges.slice(0, 6).join(', ')}{removedChanges.length > 6 ? ` và ${removedChanges.length - 6} mục khác` : ''}.</>}
              {!addedChanges.length && !modifiedChanges.length && !removedChanges.length && 'Không phát hiện thay đổi nội dung.'}
            </p>
          </section>
        )}

        {version.reviewNotes && (
          <section aria-labelledby="review-feedback-title" className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <h2 id="review-feedback-title" className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Phản hồi / ghi chú kiểm duyệt</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950 dark:text-amber-100">{version.reviewNotes}</p>
          </section>
        )}

        {/* Exercise Sets Summary */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Cấu trúc phần thi & câu hỏi ({version.exerciseSets.length} phần thi)
          </h3>
          <div className="space-y-3">
            {version.exerciseSets.map((set, sIdx) => (
              <div
                key={set.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 font-chinese">
                    Phần {sIdx + 1}: {set.titleZh} {set.titleVi ? `(${set.titleVi})` : ''}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {set.code} • Kỹ năng: {set.skill} • {set.estimatedMinutes} phút
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-600 dark:text-slate-300">
                  {set.questions.length} câu hỏi (
                  {set.questions.reduce((sum, q) => sum + q.score, 0)} điểm)
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Modal Yêu cầu chỉnh sửa */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowChangesModal(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="request-changes-title" aria-describedby="request-changes-description" className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 id="request-changes-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
              Yêu cầu chỉnh sửa nội dung
            </h3>
            <p id="request-changes-description" className="text-xs text-slate-500 dark:text-slate-400">
              Nhập chi tiết các lỗi hoặc yêu cầu bổ sung cần Biên tập viên khắc phục:
            </p>
            <label htmlFor="request-changes-note" className="sr-only">Lý do yêu cầu sửa (tối thiểu 5 ký tự)</label>
            <textarea
              id="request-changes-note"
              rows={4}
              value={changesNote}
              onChange={(e) => setChangesNote(e.target.value)}
              aria-invalid={Boolean(changesNote.trim()) && changesNote.trim().length < 5}
              placeholder="Ví dụ: Cần kiểm tra lại câu số 4 phần Nghe hiểu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="text-right text-[11px] text-slate-500">{changesNote.trim().length}/2000 · tối thiểu 5 ký tự</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowChangesModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting || changesNote.trim().length < 5}
                onClick={handleRequestChanges}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
