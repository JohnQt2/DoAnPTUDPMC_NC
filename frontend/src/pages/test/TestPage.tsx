import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { appConfirm, appNotice } from '../../lib/dialog';
import { GlassCard, BorderBeam, ShimmerButton } from '../../components/ui';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileQuestion,
  Volume2,
  Flag,
  ShieldCheck,
} from 'lucide-react';

export const TestPage: React.FC<{ testId: number }> = ({ testId }) => {
  const [testSession, setTestSession] = useState<any>(null);
  const [testPreview, setTestPreview] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(900);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [idempotencyKey] = useState(
    () => 'idem_' + Math.random().toString(36).substring(2) + Date.now()
  );
  const autoSubmittedRef = useRef(false);

  // Fetch preview metadata so pre-start screen shows real test title/time/questions
  useEffect(() => {
    api
      .get<any>(`/assessment/tests/${testId}`)
      .then((data) => setTestPreview(data))
      .catch(() => null);
  }, [testId]);

  // Fixed Timer countdown — auto-submits cleanly without blocking confirm() loop!
  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmitTest(true);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  const handleStartTest = async () => {
    try {
      const session = await api.post<any>(`/assessment/tests/${testId}/start`);
      setTestSession(session);
      setTimeLeft((session.timeLimitMins || 15) * 60);
      autoSubmittedRef.current = false;
      setHasStarted(true);
    } catch (err: any) {
      appNotice(err.message || 'Không thể bắt đầu phiên làm bài.', 'error');
    }
  };

  const handleSelectOption = (questionId: number, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitTest = async (skipConfirm = false) => {
    if (!testSession || isSubmitting) return;
    if (!skipConfirm) {
      const answered = Object.keys(answers).length;
      const total = testSession?.questions?.length || 0;
      const ok = await appConfirm({
        title: 'Nộp bài kiểm tra?',
        message:
          answered < total
            ? `Bạn đã trả lời ${answered}/${total} câu. Bạn có chắc muốn nộp bài ngay để chấm điểm không?`
            : 'Bạn đã hoàn thành toàn bộ câu hỏi. Xác nhận nộp bài để chấm điểm ngay?',
        confirmLabel: 'Nộp bài ngay',
        cancelLabel: 'Làm tiếp',
      });
      if (!ok) return;
    }

    setIsSubmitting(true);
    try {
      const answersPayload = Object.entries(answers).map(([qId, ans]) => ({
        question_id: parseInt(qId, 10),
        user_answer: ans,
      }));

      const totalSecs = (testSession.timeLimitMins || 15) * 60;
      const result = await api.post<any>(
        `/assessment/tests/${testId}/submit`,
        {
          session_token: testSession.sessionToken,
          duration_seconds: Math.max(1, totalSecs - timeLeft),
          answers: answersPayload,
        },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
        }
      );

      window.location.hash = `#/test-result/${result.submissionId}`;
    } catch (err: any) {
      appNotice(err.message || 'Lỗi khi nộp bài.', 'error');
      autoSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const playQuestionAudio = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Extract Chinese quoted text if present so listening questions sound super natural
    const quoted = text.match(/"([^"]+)"|“([^”]+)”/);
    const spoken = quoted ? quoted[1] || quoted[2] : text;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!hasStarted) {
    return (
      <div className="max-w-xl mx-auto py-14 px-4">
        <GlassCard className="p-8 text-center space-y-6 relative overflow-hidden">
          <BorderBeam duration={7} colorFrom="#f43f5e" colorTo="#f59e0b" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 via-rose-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-50/90 text-primary-700 text-xs font-black uppercase">
              {testPreview?.testType === 'WORKBOOK' ? 'Luyện tập Sách bài tập' : 'Đề thi thử HSK'}
            </span>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 leading-snug">
              {testPreview?.title || 'Bài Kiểm Tra Năng Lực HSK'}
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              Bài thi có tính giờ và chấm điểm tự động kèm giải thích chi tiết bằng tiếng Việt sau khi nộp bài.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/55 border border-white/85 text-center">
            <div>
              <span className="text-[11px] font-semibold text-gray-400">Số câu hỏi</span>
              <p className="font-black text-gray-900 text-lg mt-0.5">
                {testPreview?.questionsCount ?? '—'} câu
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400">Thời gian</span>
              <p className="font-black text-primary-600 text-lg mt-0.5">
                {testPreview?.timeLimitMins ?? 15} phút
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400">Điểm đạt</span>
              <p className="font-black text-emerald-600 text-lg mt-0.5">
                ≥ {testPreview?.passingScore ?? 60}%
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <ShimmerButton onClick={handleStartTest} size="lg" className="w-full">
              <ShieldCheck className="w-5 h-5" />
              <span>Bắt đầu làm bài ngay</span>
            </ShimmerButton>
            <a
              href="#/exams"
              className="inline-block text-xs font-bold text-gray-500 hover:text-primary-600 pt-1"
            >
              ← Quay lại danh sách đề thi
            </a>
          </div>
        </GlassCard>
      </div>
    );
  }

  const questions = testSession?.questions || [];
  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-5">
      {/* Top Sticky Exam Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3 sticky top-4 z-30">
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase">
            {testSession?.title || 'Phòng thi HSK'}
          </span>
          <p className="font-display font-extrabold text-gray-900 text-sm">
            Câu {currentIdx + 1} / {questions.length}
          </p>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-black ${
            timeLeft < 60
              ? 'bg-red-100 text-red-700 animate-pulse border border-red-300'
              : 'bg-primary-50 text-primary-700 border border-primary-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        <ShimmerButton
          type="button"
          onClick={() => handleSubmitTest(false)}
          disabled={isSubmitting}
          size="sm"
          className="rounded-xl"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isSubmitting ? 'Đang chấm...' : `Nộp bài (${answeredCount}/${questions.length})`}
          </span>
        </ShimmerButton>
      </GlassCard>

      {/* CBT Question Navigator Bubbles */}
      <GlassCard className="p-3.5 flex flex-wrap items-center gap-2">
        {questions.map((q: any, idx: number) => {
          const isAns = !!answers[q.questionId];
          const isCur = idx === currentIdx;
          const isFlg = !!flagged[q.questionId];
          return (
            <button
              key={q.questionId}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`relative w-9 h-9 rounded-xl text-xs font-black transition-colors duration-150 cursor-pointer ${
                isCur
                  ? 'bg-gradient-to-tr from-primary-600 to-amber-500 text-white shadow-md'
                  : isAns
                    ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-300/80'
                    : 'bg-white/60 text-gray-600 border border-white/85 hover:border-primary-300 hover:bg-white'
              }`}
            >
              {idx + 1}
              {isFlg && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </GlassCard>

      {/* Active Question Card */}
      {currentQuestion && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.questionId}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200/70 pb-4">
                <span className="text-xs font-black text-white bg-gradient-to-r from-primary-600 to-rose-500 px-3 py-1 rounded-full uppercase">
                  {currentQuestion.skillCategory || 'TRẮC NGHIỆM'}
                </span>

                <button
                  type="button"
                  onClick={() => toggleFlag(currentQuestion.questionId)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    flagged[currentQuestion.questionId]
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-white/80 text-gray-500 border border-gray-200 hover:text-amber-600'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQuestion.questionId] ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-relaxed">
                    {currentQuestion.content}
                  </h3>
                  <button
                    type="button"
                    onClick={() => playQuestionAudio(currentQuestion.content)}
                    className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-sm"
                    title="Nghe phát âm tiếng Trung"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Options */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options?.map((opt: any, optIdx: number) => {
                    let letter = String.fromCharCode(65 + optIdx);
                    const optText =
                      typeof opt === 'string' ? opt : opt.text || opt.content || String(opt);
                    let optId = letter;

                    if (typeof opt === 'string') {
                      const prefixMatch = opt.match(/^([A-Za-z])[\.\:\)\-\s]+(.*)$/);
                      if (prefixMatch) {
                        letter = prefixMatch[1].toUpperCase();
                        optId = letter;
                      }
                    } else if (opt.id) {
                      optId = String(opt.id);
                    }

                    const isSelected = answers[currentQuestion.questionId] === optId;

                    return (
                      <button
                        key={optId + '_' + optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQuestion.questionId, optId)}
                        className={`w-full p-4 rounded-2xl border-2 text-left text-sm font-bold flex items-center justify-between transition-[background,border-color,box-shadow] duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50/90 text-primary-950 shadow-md shadow-primary-500/10'
                            : 'border-white/85 bg-white/75 hover:border-primary-300 hover:bg-white text-gray-800'
                        }`}
                      >
                        <span className="leading-snug">{optText}</span>
                        <span
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 ml-3 ${
                            isSelected
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : 'border-gray-300 text-gray-500'
                          }`}
                        >
                          {isSelected ? '✓' : letter}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass-light hover:bg-white text-gray-700 font-bold text-xs transition-all disabled:opacity-70 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Câu trước
        </button>

        {currentIdx < questions.length - 1 ? (
          <ShimmerButton
            type="button"
            size="sm"
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="rounded-xl"
          >
            <span>Câu tiếp</span>
            <ArrowRight className="w-4 h-4" />
          </ShimmerButton>
        ) : (
          <ShimmerButton
            type="button"
            size="sm"
            onClick={() => handleSubmitTest(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            <span>Nộp bài</span>
            <CheckCircle2 className="w-4 h-4" />
          </ShimmerButton>
        )}
      </div>
    </div>
  );
};
