import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api';
import {
  FileText,
  Headphones,
  Clock,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Check,
  X,
  Award,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  HelpCircle,
  RefreshCw,
  BookOpen,
  Volume2,
  PenTool,
} from 'lucide-react';

interface QuestionItem {
  id: number;
  section_id: number;
  question_number: number;
  question_type: 'MCQ_ABCD' | 'TRUE_FALSE' | 'MCQ_ABCDEF' | 'WRITING_FILL' | 'WRITING_ESSAY';
  prompt_text?: string;
  options?: string[];
  points: number;
  order_index?: number;
  // Feedback post-submit
  user_answer?: string | null;
  correct_answer?: string | null;
  sample_answer?: string | null;
  explanation?: string | null;
  is_correct?: boolean;
  earned_score?: number;
}

interface SectionItem {
  id: number;
  section_type: 'LISTENING' | 'READING' | 'WRITING';
  title: string;
  instructions?: string;
  audio_url?: string;
  questions: QuestionItem[];
}

interface ExamDetail {
  id: number;
  code: string;
  title: string;
  description?: string;
  hsk_level: string;
  exam_pdf_url: string;
  audio_url?: string;
  answer_pdf_url?: string | null;
  duration_minutes: number;
  total_score: number;
  pass_score: number;
  sections: SectionItem[];
}

interface AttemptResult {
  attempt_id: number;
  exam_id: number;
  exam_code: string;
  exam_title: string;
  hsk_level: string;
  answer_pdf_url?: string | null;
  exam_pdf_url: string;
  audio_url?: string;
  listening_score: number;
  reading_score: number;
  writing_score: number;
  total_score: number;
  max_score: number;
  pass_score: number;
  is_passed: boolean;
  correct_count: number;
  wrong_count: number;
  answers: any[];
}

// Helper to count Hanzi (Chinese characters)
const countHanzi = (str: string): number => {
  if (!str) return 0;
  const match = str.match(/[\u4e00-\u9fa5]/g);
  return match ? match.length : 0;
};

export const StudentExamSplitScreen: React.FC<{ examId: number; onBack?: () => void }> = ({
  examId,
  onBack,
}) => {
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User answers state: Map<question_id, string>
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  // Active section tab in right pane
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);

  // Timer countdown in seconds
  const [timeLeft, setTimeLeft] = useState<number>(35 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);

  // PDF Viewer Mode: 'exam' | 'answer'
  const [pdfViewMode, setPdfViewMode] = useState<'exam' | 'answer'>('exam');

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Confirmation modal
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Load Exam Data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Sử dụng endpoint /take bảo mật chống gian lận trong lúc làm bài
        const data = await api
          .get<ExamDetail>(`/exams/${examId}/take`)
          .catch(() => api.get<ExamDetail>(`/exams/${examId}`));
        if (!data) throw new Error('Không có dữ liệu đề thi.');
        setExam(data);
        setTimeLeft(data.duration_minutes * 60);
      } catch (err: any) {
        setError(err.message || 'Không thể tải đề thi.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId]);

  // Countdown Timer
  useEffect(() => {
    if (attemptResult || !exam || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Tự động nộp bài khi hết giờ
          void handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, timeLeft, attemptResult]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setAudioCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [exam]);

  const togglePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const rewindAudio = (seconds: number = 5) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - seconds);
  };

  const forwardAudio = (seconds: number = 5) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + seconds);
  };

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answer handler
  const handleSelectAnswer = (questionId: number, answerVal: string) => {
    if (attemptResult) return; // Đã nộp bài thì không sửa
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerVal,
    }));
  };

  // Total questions & answered count
  const allQuestions: QuestionItem[] = exam?.sections.flatMap((s) => s.questions) || [];
  const totalCount = allQuestions.length;
  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[Number(k)] && userAnswers[Number(k)].trim() !== ''
  ).length;

  // Submit Exam
  const handleSubmitExam = async (_forceAuto: boolean = false) => {
    if (!exam || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setShowConfirmSubmit(false);

      const answersPayload = Object.entries(userAnswers).map(([qId, ans]) => ({
        question_id: Number(qId),
        user_answer: ans,
      }));

      // Thêm cả những câu chưa trả lời
      for (const q of allQuestions) {
        if (!userAnswers[q.id]) {
          answersPayload.push({
            question_id: q.id,
            user_answer: '',
          });
        }
      }

      const res = await api.post<AttemptResult>(`/exams/${exam.id}/submit`, {
        answers: answersPayload,
      });

      setAttemptResult(res);

      // Nếu có đáp án PDF mở khóa, tự động cập nhật
      if (res.answer_pdf_url) {
        setExam((prev) => (prev ? { ...prev, answer_pdf_url: res.answer_pdf_url } : null));
      }

      // Confetti nếu đỗ
      if (res.is_passed) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nộp bài thi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 font-sans">
        <RefreshCw className="w-8 h-8 text-[#C41E3A] animate-spin" />
        <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
          Đang nạp đề thi và cấu hình phòng thi chia đôi màn hình...
        </p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 rounded-3xl bg-white dark:bg-[#141a22] border border-red-200 dark:border-red-900/40 text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không thể tải đề thi</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error || 'Đề thi không tồn tại.'}</p>
        <button
          type="button"
          onClick={() => (onBack ? onBack() : (window.location.hash = '#/mock-exams'))}
          className="px-5 py-2.5 rounded-xl bg-[#C41E3A] text-white font-bold text-sm cursor-pointer"
        >
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  // Active section
  const activeSection = exam.sections[activeSectionIdx] || exam.sections[0];

  // Resolve PDF full URL
  const currentPdfUrl =
    pdfViewMode === 'answer' && exam.answer_pdf_url ? exam.answer_pdf_url : exam.exam_pdf_url;

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] dark:bg-[#0B0F17] text-slate-900 dark:text-white font-sans">
      {/* ── TOP APP BAR (HEADER CỐ ĐỊNH) ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111722]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
        {/* Left: Back & Exam Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!attemptResult && answeredCount > 0) {
                if (confirm('Bạn đang làm dở bài thi. Rời khỏi trang bài làm sẽ không lưu lại?')) {
                  onBack ? onBack() : (window.location.hash = '#/mock-exams');
                }
              } else {
                onBack ? onBack() : (window.location.hash = '#/mock-exams');
              }
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Thoát phòng thi"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-md bg-[#C41E3A]/10 text-[#C41E3A]">
                {exam.code}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                {exam.hsk_level}
              </span>
              <h1 className="text-sm sm:text-base font-display font-extrabold truncate max-w-[200px] sm:max-w-md">
                {exam.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2">
          {!attemptResult ? (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm border shadow-sm ${
                timeLeft <= 300
                  ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/40 dark:border-red-800 animate-pulse'
                  : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-white/5 dark:text-white dark:border-white/10'
              }`}
            >
              <Clock className="w-4 h-4 text-[#C41E3A]" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-black border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>ĐÃ HOÀN TẤT BÀI THI</span>
            </div>
          )}
        </div>

        {/* Right: Progress & Submit Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-[11px] font-bold text-slate-500">
              {attemptResult ? 'Điểm của bạn' : 'Tiến độ làm bài'}
            </div>
            <div className="text-xs font-extrabold text-[#C41E3A]">
              {attemptResult ? (
                <span>
                  {attemptResult.total_score} / {attemptResult.max_score}đ
                </span>
              ) : (
                <span>
                  {answeredCount}/{totalCount} câu
                </span>
              )}
            </div>
          </div>

          {!attemptResult ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowConfirmSubmit(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C41E3A] hover:bg-[#A81830] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAttemptResult(null);
                setUserAnswers({});
                setTimeLeft(exam.duration_minutes * 60);
                setPdfViewMode('exam');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại đề này</span>
            </button>
          )}
        </div>
      </header>

      {/* ── SUBMISSION SCORE SUMMARY BANNER (NẾU ĐÃ NỘP BÀI) ──────────────── */}
      {attemptResult && (
        <div className="bg-gradient-to-r from-slate-900 via-[#1C1917] to-slate-900 text-white py-6 px-4 sm:px-8 border-b border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md ${
                  attemptResult.is_passed
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-red-500 text-white shadow-red-500/30'
                }`}
              >
                {attemptResult.is_passed ? <Award className="w-8 h-8" /> : <X className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      attemptResult.is_passed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {attemptResult.is_passed ? 'CHÚC MỪNG BẠN ĐÃ ĐẠT (PASS)' : 'CHƯA ĐẠT CHUẨN'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Điểm chuẩn đạt: {attemptResult.pass_score}đ
                  </span>
                </div>
                <h2 className="text-2xl font-display font-black text-white mt-0.5">
                  Tổng điểm: <span className="text-[#F59E0B]">{attemptResult.total_score}</span> /{' '}
                  {attemptResult.max_score} điểm
                </h2>
              </div>
            </div>

            {/* Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 flex flex-col">
                <span className="text-slate-400 text-[10px]">Phần Nghe</span>
                <span className="font-extrabold text-blue-400 text-sm">
                  {attemptResult.listening_score} điểm
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 flex flex-col">
                <span className="text-slate-400 text-[10px]">Phần Đọc</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {attemptResult.reading_score} điểm
                </span>
              </div>
              {attemptResult.writing_score > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 flex flex-col">
                  <span className="text-slate-400 text-[10px]">Phần Viết</span>
                  <span className="font-extrabold text-purple-400 text-sm">
                    {attemptResult.writing_score} điểm
                  </span>
                </div>
              )}
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex flex-col">
                <span className="text-[10px]">Số câu đúng</span>
                <span className="font-extrabold text-sm">✓ {attemptResult.correct_count} câu</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex flex-col">
                <span className="text-[10px]">Số câu sai</span>
                <span className="font-extrabold text-sm">✗ {attemptResult.wrong_count} câu</span>
              </div>
            </div>

            {/* Unlocked Answer PDF Button */}
            {exam.answer_pdf_url && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPdfViewMode(pdfViewMode === 'answer' ? 'exam' : 'answer')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                    pdfViewMode === 'answer'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pdfViewMode === 'answer'
                      ? 'Quay lại xem File Đề PDF'
                      : 'Mở khóa: Xem File Đáp Án PDF (答案)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GIAO DIỆN CHIA ĐÔI MÀN HÌNH (SPLIT-SCREEN WORKSPACE) 58% / 42% ─── */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
        {/* ── CỘT BÊN TRÁI (~58% CHIỀU RỘNG): FILE ĐỀ PDF + AUDIO PLAYER ─────── */}
        <section className="w-full lg:w-[58%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0E131F]">
          {/* Pinned Audio Player Bar */}
          {exam.audio_url && (
            <div className="p-3 bg-white dark:bg-[#141a22] border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
              <audio ref={audioRef} src={exam.audio_url} preload="auto" />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-10 h-10 rounded-full bg-[#C41E3A] hover:bg-[#A81830] text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95"
                  title={isPlaying ? 'Tạm dừng' : 'Phát âm thanh đề thi'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => rewindAudio(5)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-xs flex items-center gap-1 font-bold"
                  title="Tua lùi 5 giây"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>-5s</span>
                </button>

                <button
                  type="button"
                  onClick={() => forwardAudio(5)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-xs flex items-center gap-1 font-bold"
                  title="Tua tới 5 giây"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>+5s</span>
                </button>
              </div>

              {/* Progress Slider */}
              <div className="flex-1 min-w-[140px] flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {formatTime(audioCurrentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={audioDuration || 100}
                  value={audioCurrentTime}
                  onChange={(e) => {
                    const audio = audioRef.current;
                    if (audio) {
                      audio.currentTime = Number(e.target.value);
                      setAudioCurrentTime(Number(e.target.value));
                    }
                  }}
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C41E3A]"
                />
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {formatTime(audioDuration)}
                </span>
              </div>

              {/* Speed Pills */}
              <div className="flex items-center gap-1">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changePlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-[#C41E3A] text-white'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PDF Viewer Header Toolbar */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C41E3A]" />
              <span>
                {pdfViewMode === 'answer'
                  ? 'Đang xem: File Đáp Án & Transcript (答案)'
                  : 'Đang xem: File Đề Thi Chuẩn HSK (PDF)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {exam.answer_pdf_url && attemptResult && (
                <button
                  type="button"
                  onClick={() => setPdfViewMode(pdfViewMode === 'answer' ? 'exam' : 'answer')}
                  className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  {pdfViewMode === 'answer' ? '⇄ Xem lại File Đề' : '⇄ Xem File Đáp Án PDF'}
                </button>
              )}
              <a
                href={currentPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#C41E3A] transition-colors"
                title="Mở file PDF trong tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở tab mới</span>
              </a>
            </div>
          </div>

          {/* PDF Embedded View */}
          <div className="flex-1 w-full h-full relative bg-slate-200 dark:bg-[#0B0F17]">
            {currentPdfUrl ? (
              <iframe
                src={currentPdfUrl}
                title="Đề thi PDF"
                className="w-full h-full border-0 absolute inset-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                <FileText className="w-12 h-12 text-slate-400" />
                <p className="font-bold text-sm">Chưa có liên kết file PDF</p>
                <p className="text-xs max-w-sm">
                  Thí sinh làm bài trực tiếp theo danh sách câu hỏi ở cột bên phải.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── CỘT BÊN PHẢI (~42% CHIỀU RỘNG): PHIẾU TRẢ LỜI & CHẤM ĐIỂM ──────── */}
        <section className="w-full lg:w-[42%] flex flex-col h-full overflow-hidden bg-white dark:bg-[#141a22]">
          {/* Section Navigation Tabs */}
          <div className="p-3 bg-slate-50 dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-2">
              {exam.sections.map((sec, idx) => {
                const secQuestions = sec.questions;
                const secAnswered = secQuestions.filter(
                  (q) => userAnswers[q.id] && userAnswers[q.id].trim() !== ''
                ).length;

                return (
                  <button
                    key={sec.id || idx}
                    type="button"
                    onClick={() => setActiveSectionIdx(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      activeSectionIdx === idx
                        ? 'bg-[#C41E3A] text-white shadow-sm'
                        : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sec.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeSectionIdx === idx
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                      }`}
                    >
                      {secAnswered}/{secQuestions.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Quick Jump Matrix (Ma trận số câu hỏi) */}
          <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 overflow-x-auto shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {activeSection.questions.map((q) => {
                const ans = userAnswers[q.id];
                const isAnswered = ans !== undefined && ans.trim() !== '';

                // Phản hồi kết quả sau khi nộp bài
                let resFeedback: any = null;
                if (attemptResult) {
                  resFeedback = attemptResult.answers.find((a) => a.question_id === q.id);
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`question-card-${q.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`min-w-7 h-7 px-1.5 rounded-lg text-xs font-black border flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      resFeedback
                        ? resFeedback.is_correct
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-red-600 text-white border-red-600 shadow-md ring-1 ring-red-400'
                        : isAnswered
                          ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-xs'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                    title={`Câu ${q.question_number}`}
                  >
                    <span>{q.question_number}</span>
                    {resFeedback && (
                      <span className="text-[10px]">{resFeedback.is_correct ? '✓' : '✗'}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Instructions Banner */}
          {activeSection.instructions && (
            <div className="px-5 py-2 bg-slate-100/70 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 shrink-0">
              <HelpCircle className="w-4 h-4 text-[#C41E3A] shrink-0" />
              <span>{activeSection.instructions}</span>
            </div>
          )}

          {/* Questions Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {activeSection.questions.map((q) => {
              const selectedAns = userAnswers[q.id] || '';

              // Feedback after submission
              let feedback: any = null;
              if (attemptResult) {
                feedback = attemptResult.answers.find((a) => a.question_id === q.id);
              }

              const isSubmitted = Boolean(attemptResult);
              const isWrong = feedback && !feedback.is_correct;
              const isCorrect = feedback && feedback.is_correct;

              return (
                <div
                  key={q.id}
                  id={`question-card-${q.id}`}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-red-500 bg-red-50/70 dark:bg-red-950/30 ring-2 ring-red-500/50 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                          isSubmitted
                            ? isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 text-white font-extrabold'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white'
                        }`}
                      >
                        {q.question_number}
                      </span>

                      {/* Prominent Red ✗ mark beside question number when wrong */}
                      {isWrong && (
                        <span
                          className="text-red-600 font-black text-lg leading-none"
                          title="Câu trả lời chưa đúng"
                        >
                          ✗
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {q.prompt_text || `Câu ${q.question_number}`}
                      </span>

                      <span className="text-[11px] font-semibold text-[#C41E3A] px-2 py-0.5 rounded-md bg-[#C41E3A]/10">
                        {q.points} điểm
                      </span>
                    </div>

                    {/* Result Badge */}
                    {feedback && (
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ĐÚNG (+{feedback.earned_score}đ)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-700 dark:text-red-300 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/60 font-black tracking-wide border border-red-300 dark:border-red-800">
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm">✗ SAI (0 / {q.points}đ)</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Input Option by Question Type */}
                  <div className="pt-1">
                    {/* 1. TRUE_FALSE (✓ / ✗) */}
                    {q.question_type === 'TRUE_FALSE' && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { val: 'TRUE', label: '✓ Đúng' },
                          { val: 'FALSE', label: '✗ Sai' },
                        ].map(({ val, label }) => {
                          const isChosen = selectedAns.toUpperCase() === val;
                          const correctVal = feedback ? (feedback.correct_answer || '').toUpperCase() : '';
                          const isThisCorrect = isSubmitted && correctVal === val;
                          const isThisWrongChoice = isSubmitted && isChosen && !feedback?.is_correct;

                          let btnStyle =
                            'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#C41E3A]/50';

                          if (isSubmitted) {
                            if (isThisCorrect) {
                              btnStyle =
                                'bg-emerald-600 text-white border-emerald-600 font-black shadow-md ring-2 ring-emerald-400/50';
                            } else if (isThisWrongChoice) {
                              btnStyle =
                                'bg-red-600 text-white border-red-600 font-black shadow-md ring-2 ring-red-400/50';
                            } else {
                              btnStyle =
                                'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 opacity-60';
                            }
                          } else if (isChosen) {
                            btnStyle = 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm font-bold';
                          }

                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectAnswer(q.id, val)}
                              className={`py-3 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all cursor-pointer ${btnStyle}`}
                            >
                              <span>{label}</span>
                              {isThisWrongChoice && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-black/30 text-white text-xs font-black">
                                  ✗ Lựa chọn sai
                                </span>
                              )}
                              {isThisCorrect && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-white text-xs font-black">
                                  ✓ Đáp án đúng
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. MCQ_ABCD (A, B, C, D) */}
                    {q.question_type === 'MCQ_ABCD' && (
                      <div className="grid grid-cols-4 gap-2">
                        {(q.options && q.options.length > 0 ? q.options : ['A', 'B', 'C', 'D']).map(
                          (opt) => {
                            const isChosen = selectedAns.toUpperCase() === opt.toUpperCase();
                            const correctVal = feedback
                              ? (feedback.correct_answer || '').toUpperCase()
                              : '';
                            const isThisCorrect = isSubmitted && correctVal === opt.toUpperCase();
                            const isThisWrongChoice = isSubmitted && isChosen && !feedback?.is_correct;

                            let btnStyle =
                              'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#C41E3A]/60';

                            if (isSubmitted) {
                              if (isThisCorrect) {
                                btnStyle =
                                  'bg-emerald-600 text-white border-emerald-600 font-black shadow-md ring-2 ring-emerald-400/50 scale-102';
                              } else if (isThisWrongChoice) {
                                btnStyle =
                                  'bg-red-600 text-white border-red-600 font-black shadow-md ring-2 ring-red-400/50 scale-102';
                              } else {
                                btnStyle =
                                  'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 opacity-50';
                              }
                            } else if (isChosen) {
                              btnStyle =
                                'bg-[#C41E3A] text-white border-[#C41E3A] shadow-md shadow-[#C41E3A]/20 scale-102 font-black';
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleSelectAnswer(q.id, opt)}
                                className={`py-3 rounded-xl font-display font-black text-base border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isThisWrongChoice && (
                                  <span className="text-white text-xs font-black">✗</span>
                                )}
                                {isThisCorrect && (
                                  <span className="text-white text-xs font-black">✓</span>
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* 3. MCQ_ABCDEF (A – F Ghép tranh/câu) */}
                    {q.question_type === 'MCQ_ABCDEF' && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {(q.options && q.options.length > 0
                          ? q.options
                          : ['A', 'B', 'C', 'D', 'E', 'F']
                        ).map((opt) => {
                          const isChosen = selectedAns.toUpperCase() === opt.toUpperCase();
                          const correctVal = feedback
                            ? (feedback.correct_answer || '').toUpperCase()
                            : '';
                          const isThisCorrect = isSubmitted && correctVal === opt.toUpperCase();
                          const isThisWrongChoice = isSubmitted && isChosen && !feedback?.is_correct;

                          let btnStyle =
                            'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#C41E3A]/60';

                          if (isSubmitted) {
                            if (isThisCorrect) {
                              btnStyle =
                                'bg-emerald-600 text-white border-emerald-600 font-black shadow-md ring-2 ring-emerald-400/50 scale-102';
                            } else if (isThisWrongChoice) {
                              btnStyle =
                                'bg-red-600 text-white border-red-600 font-black shadow-md ring-2 ring-red-400/50 scale-102';
                            } else {
                              btnStyle =
                                'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 opacity-50';
                            }
                          } else if (isChosen) {
                            btnStyle =
                              'bg-[#C41E3A] text-white border-[#C41E3A] shadow-md shadow-[#C41E3A]/20 scale-102 font-black';
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`py-3 rounded-xl font-display font-black text-sm border flex items-center justify-center gap-1 transition-all cursor-pointer ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isThisWrongChoice && (
                                <span className="text-white text-xs font-black">✗</span>
                              )}
                              {isThisCorrect && (
                                <span className="text-white text-xs font-black">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 4. WRITING_FILL (Viết điền đáp án ngắn) */}
                    {q.question_type === 'WRITING_FILL' && (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={selectedAns}
                          disabled={isSubmitted}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                          placeholder="Nhập từ hoặc sắp xếp câu trả lời..."
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                            isSubmitted
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50/30'
                                : 'border-red-500 bg-red-50/50'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A]'
                          }`}
                        />
                      </div>
                    )}

                    {/* 5. WRITING_ESSAY (Viết câu / đoạn văn) với Live Hanzi Counter */}
                    {q.question_type === 'WRITING_ESSAY' && (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={selectedAns}
                          disabled={isSubmitted}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                          placeholder="Nhập câu văn hoặc đoạn văn chữ Hán của bạn vào đây..."
                          className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                            isSubmitted
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50/30'
                                : 'border-red-500 bg-red-50/50'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A]'
                          }`}
                        />
                        {/* Live Character & Hanzi Counter */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                          <span className="flex items-center gap-1">
                            <PenTool className="w-3.5 h-3.5 text-[#C41E3A]" />
                            <span>
                              Đã viết: <b className="text-slate-800 dark:text-white">{countHanzi(selectedAns)}</b> chữ Hán
                            </span>
                          </span>
                          <span>Tổng số ký tự: {selectedAns.length}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── CHI TIẾT GIẢI THÍCH & ĐÁP ÁN ĐÚNG KHI ĐÃ NỘP BÀI ──────── */}
                  {feedback && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-white/10 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <span>Bạn đã chọn:</span>
                          <b
                            className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
                              feedback.is_correct
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                                : 'bg-red-200 text-red-900 dark:bg-red-950/80 dark:text-red-300 font-black'
                            }`}
                          >
                            {!feedback.is_correct && <span className="text-red-700 font-black">✗</span>}
                            <span>{feedback.user_answer || '(Chưa điền/Bỏ trống)'}</span>
                          </b>
                        </span>

                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <span>Đáp án chuẩn:</span>
                          <b className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black flex items-center gap-1">
                            <span>✓</span>
                            <span>{feedback.correct_answer || feedback.sample_answer || 'Xem file đáp án PDF'}</span>
                          </b>
                        </span>
                      </div>

                      {/* Sample answer for writing questions */}
                      {feedback.sample_answer && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
                          <b>Bài viết mẫu tham khảo (参考答案):</b>
                          <p className="mt-1 font-sans">{feedback.sample_answer}</p>
                        </div>
                      )}

                      {/* Explanation */}
                      {feedback.explanation && (
                        <p className="text-slate-600 dark:text-slate-400 italic bg-white/70 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                          💡 <b>Giải thích chi tiết:</b> {feedback.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── MODAL XÁC NHẬN NỘP BÀI ────────────────────────────────────────── */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                Xác nhận nộp bài thi?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Bạn đã hoàn thành <b>{answeredCount}</b> trên tổng số <b>{totalCount}</b> câu hỏi.
                {totalCount - answeredCount > 0 && (
                  <span className="block text-red-600 font-bold mt-1.5">
                    ⚠️ Còn {totalCount - answeredCount} câu bạn chưa chọn đáp án!
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam(false)}
                className="py-2.5 rounded-xl bg-[#C41E3A] hover:bg-[#A81830] text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamSplitScreen;
