import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileQuestion,
  Volume2,
} from 'lucide-react';

export const TestPage: React.FC<{ testId: number }> = ({ testId }) => {
  const [testSession, setTestSession] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [idempotencyKey] = useState(() => 'idem_' + Math.random().toString(36).substring(2) + Date.now());

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (hasStarted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (hasStarted && timeLeft === 0) {
      handleSubmitTest(); // Auto submit on timeout
    }
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft]);

  const handleStartTest = async () => {
    try {
      const session = await api.post<any>(`/assessment/tests/${testId}/start`);
      setTestSession(session);
      setTimeLeft((session.timeLimitMins || 15) * 60);
      setHasStarted(true);
    } catch (err: any) {
      alert(err.message || 'Không thể bắt đầu phiên làm bài.');
    }
  };

  const handleSelectOption = (questionId: number, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitTest = async () => {
    if (!testSession) return;
    if (!confirm('Bạn có chắc chắn muốn nộp bài kiểm tra?')) return;

    setIsSubmitting(true);

    try {
      const answersPayload = Object.entries(answers).map(([qId, ans]) => ({
        question_id: parseInt(qId, 10),
        user_answer: ans,
      }));

      // Submit with Idempotency-Key header to avoid duplicate grading
      const result = await api.post<any>(
        `/assessment/tests/${testId}/submit`,
        {
          session_token: testSession.sessionToken,
          duration_seconds: (testSession.timeLimitMins * 60) - timeLeft,
          answers: answersPayload,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      // Navigate to result view
      window.location.hash = `#/test-result/${result.submissionId}`;
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const playQuestionAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis?.speak(utterance);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!hasStarted) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-gray-900">
              Bài Kiểm Tra Đánh Giá Năng Lực (UC05)
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bài kiểm tra sẽ tạo phiên làm việc với cơ chế <strong>Snapshot câu hỏi</strong> nhằm bảo toàn nội dung tại thời điểm làm bài.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 text-left text-xs text-gray-600">
            <div>
              <span className="text-gray-400">Yêu cầu hoàn thành:</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">≥ 80% để mở khóa bài tiếp</p>
            </div>
            <div>
              <span className="text-gray-400">Cơ chế an toàn:</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">Áp dụng Idempotency-Key</p>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/20 transition-all hover:scale-105"
          >
            Bắt đầu làm bài ngay
          </button>
        </div>
      </div>
    );
  }

  const questions = testSession?.questions || [];
  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Test Bar: Timer & Progress */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-400">Câu hỏi</span>
          <p className="font-bold text-gray-900 text-sm">
            {currentIdx + 1} / {questions.length}
          </p>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${
            timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        <button
          onClick={handleSubmitTest}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs shadow-sm transition-all"
        >
          Nộp bài ({answeredCount}/{questions.length})
        </button>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase">
              {currentQuestion.skillCategory || 'TRẮC NGHIỆM'}
            </span>
            <span className="text-xs text-gray-400">
              {currentQuestion.questionType}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {currentQuestion.content}
              </h3>
              <button
                onClick={() => playQuestionAudio(currentQuestion.content)}
                className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors shrink-0"
                title="Nghe câu hỏi"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options?.map((opt: any) => {
                const optId = opt.id || opt;
                const optText = opt.text || opt;
                const isSelected = answers[currentQuestion.questionId] === optId;

                return (
                  <button
                    key={optId}
                    onClick={() => handleSelectOption(currentQuestion.questionId, optId)}
                    className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{optText}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected ? '✓' : optId}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          Câu trước
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            Câu tiếp
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmitTest}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            Nộp bài
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
