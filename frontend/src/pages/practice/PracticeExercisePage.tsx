import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { appConfirm, appNotice } from '../../lib/dialog';
import { GlassCard, ShimmerButton } from '../../components/ui';
import { AudioPlayer } from '../../components/practice/AudioPlayer';
import { QuestionRenderer } from '../../components/practice/QuestionRenderer';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface PracticeExercisePageProps {
  exerciseSetId: number;
}

export const PracticeExercisePage: React.FC<PracticeExercisePageProps> = ({ exerciseSetId }) => {
  const [exerciseSet, setExerciseSet] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Debounce refs cho autosave text
  const pendingSaveRef = useRef<{ qId: number; value: any } | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Load Exercise Set metadata & Questions (without answers) + initialize or resume attempt
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<any>(`/practice/exercise-sets/${exerciseSetId}`),
      api.post<any>('/practice/attempts', { exerciseSetId }),
    ])
      .then(async ([setRes, attemptRes]) => {
        const setData = setRes?.data !== undefined ? setRes.data : setRes;
        const attData = attemptRes?.data !== undefined ? attemptRes.data : attemptRes;

        console.log("Exercise:", setData);
        console.log("Questions:", setData?.questions);

        setExerciseSet(setData);
        setAttempt(attData);

        let initialAnswers = attData?.answers ?? {};
        let restoredDraft: Record<number, any> = {};
        try {
          const draft = window.sessionStorage.getItem(`practice-attempt-${attData.attemptId}`);
          if (draft) {
            const parsedDraft = JSON.parse(draft);
            if (parsedDraft && typeof parsedDraft === 'object' && !Array.isArray(parsedDraft)) {
              restoredDraft = parsedDraft;
              initialAnswers = { ...initialAnswers, ...restoredDraft };
            }
          }
        } catch {
          appNotice('Không thể khôi phục câu trả lời đã lưu tạm trong phiên này.', 'error');
        }
        setAnswers(initialAnswers);
        const unsyncedAnswers = Object.entries(restoredDraft).filter(
          ([qId, answer]) => JSON.stringify(attData?.answers?.[qId]) !== JSON.stringify(answer)
        );
        if (unsyncedAnswers.length > 0) {
          try {
            await Promise.all(
              unsyncedAnswers.map(([qId, answer]) =>
                api.put(`/practice/attempts/${attData.attemptId}/answers/${qId}`, { answer })
              )
            );
          } catch (err: any) {
            appNotice(err?.message || 'Không thể đồng bộ câu trả lời đã khôi phục.', 'error');
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load exercise set or attempt:", err);
        appNotice(err?.message || 'Không thể tải bộ bài tập.', 'error');
      })
      .finally(() => setLoading(false));
  }, [exerciseSetId]);

  const questions = exerciseSet?.questions ?? [];
  const currentQuestion = questions?.[currentIdx];
  const totalQuestions = questions?.length ?? 0;

  useEffect(() => {
    console.log("Current Question:", currentQuestion);
  }, [currentQuestion]);

  const saveAnswer = useCallback(
    (qId: number, value: any) => {
      if (!attempt) return Promise.resolve();

      setIsSaving(true);
      setSaveError(false);
      const save = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await api.put(`/practice/attempts/${attempt.attemptId}/answers/${qId}`, { answer: value });
        });
      saveQueueRef.current = save;

      return save
        .then(() => setSaveError(false))
        .catch((err) => {
          setSaveError(true);
          appNotice(err?.message || 'Không thể lưu câu trả lời. Vui lòng thử lại.', 'error');
          throw err;
        })
        .finally(() => {
          if (saveQueueRef.current === save) setIsSaving(false);
        });
    },
    [attempt]
  );

  // Flush pending save directly to the backend before leaving the question.
  const flushPendingSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (!pendingSaveRef.current || !attempt) return;
    const { qId, value } = pendingSaveRef.current;
    pendingSaveRef.current = null;

    try {
      await saveAnswer(qId, value);
    } catch (err) {
      pendingSaveRef.current = { qId, value };
      throw err;
    }

    await saveQueueRef.current;
  }, [saveAnswer]);

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleAnswerChange = async (val: any) => {
    if (!currentQuestion || !attempt) return;
    const qId = currentQuestion.id;
    const isText = currentQuestion.type === 'TEXT_INPUT';
    const nextAnswers = { ...answers, [qId]: val };

    setAnswers(nextAnswers);
    try {
      window.sessionStorage.setItem(`practice-attempt-${attempt.attemptId}`, JSON.stringify(nextAnswers));
    } catch {
      appNotice('Không thể lưu tạm câu trả lời trên thiết bị này.', 'error');
    }

    if (isText) {
      // Debounce autosave 500ms cho text
      pendingSaveRef.current = { qId, value: val };
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(async () => {
        try {
          await flushPendingSave();
        } catch {
          // The save error is already shown to the learner.
        }
      }, 500);
    } else {
      try {
        await saveAnswer(qId, val);
      } catch {
        // The save error is already shown to the learner.
      }
    }
  };

  const handleNext = async () => {
    try {
      await flushPendingSave();
      if (currentIdx < totalQuestions - 1) {
        setCurrentIdx((prev) => prev + 1);
      }
    } catch {
      // Keep the learner on the current question until its answer is saved.
    }
  };

  const handlePrev = async () => {
    try {
      await flushPendingSave();
      if (currentIdx > 0) {
        setCurrentIdx((prev) => prev - 1);
      }
    } catch {
      // Keep the learner on the current question until its answer is saved.
    }
  };

  const hasAnswer = (question: any, answer: any) => {
    if (answer === undefined || answer === null) return false;
    if (typeof answer === 'string') return answer.trim().length > 0;
    if (question?.type === 'CHARACTER_WRITING') return answer.completed === true;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'object') return Object.keys(answer).length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    try {
      await flushPendingSave();
    } catch {
      return;
    }

    const validAnsweredCount = questions.filter((question: any) =>
      hasAnswer(question, answers[question.id])
    ).length;

    const isFull = validAnsweredCount >= totalQuestions;

    const confirmMsg = isFull
      ? `Bạn đã hoàn thành ${validAnsweredCount}/${totalQuestions} câu. Bạn có chắc chắn muốn nộp bài để chấm điểm?`
      : `Bạn mới làm ${validAnsweredCount}/${totalQuestions} câu. Còn ${totalQuestions - validAnsweredCount} câu chưa trả lời. Bạn vẫn muốn nộp bài?`;

    const ok = await appConfirm({
      title: 'Xác nhận nộp bài',
      message: confirmMsg,
      confirmLabel: 'Nộp bài ngay',
      cancelLabel: 'Tiếp tục làm',
    });

    if (!ok) return;

    try {
      setIsSubmitting(true);
      const res = await api.post<any>(`/practice/attempts/${attempt.attemptId}/submit`, {
        answers,
      });
      try {
        window.sessionStorage.removeItem(`practice-attempt-${attempt.attemptId}`);
      } catch {
        appNotice('Không thể xóa bản lưu tạm sau khi nộp bài.', 'error');
      }

      // Lấy collectionId từ query params, state hoặc exerciseSet
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const collectionId =
        (window.history.state?.usr as any)?.collectionId ||
        window.history.state?.collectionId ||
        params.get('collectionId') ||
        exerciseSet?.collectionId ||
        null;

      // Push state và điều hướng sang trang Result
      const targetHash = collectionId
        ? `#/practice/results/${attempt.attemptId}?collectionId=${collectionId}`
        : `#/practice/results/${attempt.attemptId}`;

      window.history.pushState(
        {
          collectionId,
          exerciseId: exerciseSetId,
        },
        '',
        targetHash
      );
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (err: any) {
      appNotice(err?.message || 'Không thể nộp bài tập.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        <div className="h-64 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm animate-pulse" />
      </div>
    );
  }

  if (!exerciseSet || totalQuestions === 0) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4 bg-white rounded-2xl border border-[#F3E8D6] shadow-sm">
        <AlertCircle className="w-12 h-12 text-[#F59E0B] mx-auto" />
        <h2 className="text-xl font-bold text-[#1F2937]">Chưa có câu hỏi</h2>
        <p className="text-sm text-[#6B7280]">Bộ bài tập này đang được cập nhật nội dung.</p>
        <a
          href="#/practice"
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-white transition-all shadow-sm"
        >
          Quay lại
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Bar: Header nền trắng, border #F3E8D6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm">
        <div className="flex items-center gap-3">
          <a
            href={`#/practice/${exerciseSet.lesson?.level?.code || 'HSK1'}/lessons/${exerciseSet.lesson?.id || ''}`}
            className="p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F3E8D6]/60 text-[#1F2937] transition-colors border border-[#F3E8D6]"
            title="Quay lại bài học"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F59E0B] px-2 py-0.5 rounded-lg bg-[#FFF7E6] border border-[#F59E0B]/30">
                {exerciseSet.skill}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#1F2937] font-chinese truncate">
                {exerciseSet.titleZh}
              </h1>
            </div>
            <div className="text-xs text-[#6B7280] truncate mt-0.5">
              {exerciseSet.lesson?.titleZh} • {exerciseSet.instructions || 'Luyện tập'}
            </div>
          </div>
        </div>

        {/* Question Counter & Save status */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs font-medium text-[#6B7280]">
            {isSaving ? 'Đang lưu...' : saveError ? 'Lưu chưa thành công' : 'Đã tự động lưu'}
          </span>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#FFF7E6] border border-[#F59E0B]/30 text-xs font-bold text-[#D97706]">
            Câu {currentIdx + 1} / {totalQuestions}
          </div>
        </div>
      </div>

      {/* Audio Player if Exercise Set has audio */}
      {exerciseSet.audioUrl && (
        <AudioPlayer
          src={exerciseSet.audioUrl}
          title={`Audio bài tập: ${exerciseSet.titleZh}`}
        />
      )}

      {/* Progress Dots / Bar: nền trắng, border cam nhạt */}
      <div className="w-full bg-white p-2.5 rounded-2xl border border-[#F3E8D6] shadow-sm flex items-center gap-2 overflow-x-auto">
        {questions?.map((q: any, idx: number) => {
          if (!q) return null;
          const isAnswered = hasAnswer(q, answers?.[q.id]);
          const isCurrent = idx === currentIdx;

          return (
            <button
              key={q.id || idx}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`flex-shrink-0 w-8 h-8 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center ${
                isCurrent
                  ? 'bg-[#F59E0B] text-white shadow-md shadow-amber-500/20 scale-105'
                  : isAnswered
                  ? 'bg-[#ECFDF5] text-[#22C55E] border border-[#22C55E]/40 font-semibold'
                  : 'bg-white text-[#6B7280] border border-[#F3E8D6] hover:border-[#F59E0B]/60 hover:text-[#1F2937]'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card: Card trắng bo góc 16px, border #F3E8D6, shadow nhẹ */}
      <div className="bg-white rounded-2xl border border-[#F3E8D6] shadow-sm p-6 sm:p-8 space-y-6">
        {currentQuestion ? (
          <QuestionRenderer
            question={currentQuestion}
            userAnswer={answers?.[currentQuestion.id]}
            onChangeAnswer={handleAnswerChange}
          />
        ) : (
          <div className="p-8 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-[#6B7280] mx-auto" />
            <h3 className="text-base font-bold text-[#1F2937]">Không tìm thấy câu hỏi</h3>
            <p className="text-xs text-[#6B7280]">Vui lòng chọn câu hỏi khác trong danh sách.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation & Submit Bar: Nền trắng, border trên #F3E8D6, shadow nhẹ */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#F3E8D6] sticky bottom-4 backdrop-blur-xl shadow-md">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#FAF7F2] hover:bg-[#F3E8D6]/60 disabled:opacity-40 disabled:cursor-not-allowed text-[#1F2937] transition-all border border-[#F3E8D6]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        <div className="flex items-center gap-2.5">
          {currentIdx < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#F59E0B] hover:bg-[#D97706] text-white transition-all duration-200 shadow-sm hover:shadow"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#E11D48] hover:bg-[#BE123C] text-white transition-all duration-200 shadow-md shadow-rose-500/20 active:scale-95 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang nộp...' : 'Nộp bài'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
