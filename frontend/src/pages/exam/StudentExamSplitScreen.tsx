import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { api, resolveMediaUrl } from '../../lib/api';
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
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  Save,
} from 'lucide-react';

export interface QuestionItem {
  id: number;
  section_id: number;
  question_number: number;
  question_type: 'MCQ_ABCD' | 'TRUE_FALSE' | 'MCQ_ABCDEF' | 'WRITING_FILL' | 'WRITING_ESSAY' | 'MCQ_ABC';
  prompt_text?: string;
  options?: string[];
  points: number;
  order_index?: number;
  needsReview?: boolean;
  reviewReason?: string;
  // Feedback post-submit
  user_answer?: string | null;
  correct_answer?: string | null;
  sample_answer?: string | null;
  explanation?: string | null;
  is_correct?: boolean;
  earned_score?: number;
}

export interface SectionItem {
  id: number;
  section_type: 'LISTENING' | 'READING' | 'WRITING';
  title: string;
  instructions?: string;
  audio_url?: string;
  questions: QuestionItem[];
}

export interface ExamDetail {
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

// Helper tính toán kết quả Demo cục bộ (dùng cho cả chấm thử lần đầu và tự động chấm lại khi sửa đáp án/điểm)
const computeDemoAttemptResult = (
  examData: ExamDetail,
  answersMap: Record<number, string>
): AttemptResult => {
  let listeningScore = 0;
  let readingScore = 0;
  let writingScore = 0;
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  const detailedAnswers: any[] = [];

  for (const sec of examData.sections) {
    for (const q of sec.questions) {
      const pts = Number(q.points || 0);
      maxScore += pts;
      const userAns = (answersMap[q.id] || '').trim();
      const expected = (q.correct_answer || q.sample_answer || '').trim();
      let isCorrect = false;
      let earned = 0;

      if (q.question_type === 'TRUE_FALSE') {
        const normUser = ['TRUE', 'T', '✓', 'V', '1'].includes(userAns.toUpperCase())
          ? 'TRUE'
          : ['FALSE', 'F', '✗', 'X', '0'].includes(userAns.toUpperCase())
            ? 'FALSE'
            : '';
        const normExp = ['TRUE', 'T', '✓', 'V', '1'].includes(expected.toUpperCase())
          ? 'TRUE'
          : 'FALSE';
        isCorrect = Boolean(normUser && normUser === normExp);
      } else if (q.question_type.startsWith('MCQ_')) {
        isCorrect = Boolean(userAns && userAns.toUpperCase() === expected.toUpperCase());
      } else {
        isCorrect = Boolean(
          expected &&
            userAns.replace(/[.。!！?？\s]+/g, '').toLowerCase() ===
              expected.replace(/[.。!！?？\s]+/g, '').toLowerCase()
        );
      }

      if (isCorrect) {
        earned = pts;
        correctCount += 1;
      } else {
        wrongCount += 1;
      }

      totalScore += earned;
      if (sec.section_type === 'LISTENING') listeningScore += earned;
      else if (sec.section_type === 'READING') readingScore += earned;
      else if (sec.section_type === 'WRITING') writingScore += earned;

      detailedAnswers.push({
        question_id: q.id,
        user_answer: userAns,
        correct_answer: q.correct_answer,
        sample_answer: q.sample_answer,
        explanation: q.explanation,
        is_correct: isCorrect,
        earned_score: earned,
      });
    }
  }

  return {
    attempt_id: 0,
    exam_id: examData.id,
    exam_code: examData.code,
    exam_title: examData.title,
    hsk_level: examData.hsk_level,
    answer_pdf_url: examData.answer_pdf_url,
    exam_pdf_url: examData.exam_pdf_url,
    audio_url: examData.audio_url,
    listening_score: Math.round(listeningScore * 10) / 10,
    reading_score: Math.round(readingScore * 10) / 10,
    writing_score: Math.round(writingScore * 10) / 10,
    total_score: Math.round(totalScore * 10) / 10,
    max_score: Math.round(maxScore * 10) / 10,
    pass_score: examData.pass_score,
    is_passed: totalScore >= examData.pass_score,
    correct_count: correctCount,
    wrong_count: wrongCount,
    answers: detailedAnswers,
  };
};

export interface StudentExamSplitScreenProps {
  examId?: number;
  onBack?: () => void;
  demoMode?: boolean;
  demoExamData?: ExamDetail;
  onDemoPublish?: () => Promise<void> | void;
  onDemoSaveDraft?: () => Promise<void> | void;
  demoNotice?: { text: string; type: 'success' | 'error' } | null;
  isPublishingDemo?: boolean;
  onDemoUpdateMeta?: (patch: {
    title?: string;
    hsk_level?: string;
    duration_minutes?: number;
    pass_score?: number;
  }) => void;
  onDemoUpdateSections?: (updater: (prev: SectionItem[]) => SectionItem[]) => void;
}

export const StudentExamSplitScreen: React.FC<StudentExamSplitScreenProps> = ({
  examId,
  onBack,
  demoMode = false,
  demoExamData,
  onDemoPublish,
  onDemoSaveDraft,
  demoNotice = null,
  isPublishingDemo = false,
  onDemoUpdateMeta,
  onDemoUpdateSections,
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

  // Confirmation modals
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  // Demo Inline Edit State
  const [demoInteractionMode, setDemoInteractionMode] = useState<'test' | 'edit'>('test');
  const [expandedNotesMap, setExpandedNotesMap] = useState<Record<number, boolean>>({});
  const hasInitializedDemoRef = useRef(false);
  const questionsContainerRef = useRef<HTMLDivElement | null>(null);

  const handleSwitchSection = (newIdx: number) => {
    setActiveSectionIdx(newIdx);
    requestAnimationFrame(() => {
      if (questionsContainerRef.current) {
        questionsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // Load Exam Data (hỗ trợ đồng bộ 2 chiều trong demoMode mà không làm mất kết quả chấm thử đang xem)
  useEffect(() => {
    if (demoMode && demoExamData) {
      setLoading(false);
      setError(null);
      setExam(demoExamData);
      if (!hasInitializedDemoRef.current) {
        hasInitializedDemoRef.current = true;
        setTimeLeft((demoExamData.duration_minutes || 35) * 60);
        setAttemptResult(null);
        setUserAnswers({});
        setPdfViewMode('exam');
      } else {
        setTimeLeft((demoExamData.duration_minutes || 35) * 60);
      }
      return;
    }
    if (!examId) return;

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
  }, [examId, demoMode, demoExamData]);

  // Tự động chấm lại kết quả Demo ngay lập tức khi giáo viên sửa đáp án đúng / điểm số lúc đang xem kết quả
  useEffect(() => {
    if (demoMode && exam && attemptResult) {
      setAttemptResult(computeDemoAttemptResult(exam, userAnswers));
    }
  }, [exam, demoMode]);

  // Countdown Timer
  useEffect(() => {
    if (demoMode || attemptResult || !exam || timeLeft <= 0) return;

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

  // ── DEMO INLINE EDIT HELPERS (ĐỒNG BỘ TRỰC TIẾP VỀ FORM GỐC) ──────────────
  const applyDemoSectionsMutation = (updater: (prev: SectionItem[]) => SectionItem[]) => {
    if (onDemoUpdateSections) {
      onDemoUpdateSections(updater);
    } else {
      setExam((prev) => {
        if (!prev) return null;
        const nextSections = updater(prev.sections);
        const newTotal = nextSections.reduce(
          (sum, s) => sum + s.questions.reduce((qs, q) => qs + Number(q.points || 0), 0),
          0
        );
        return {
          ...prev,
          sections: nextSections,
          total_score: Math.round(newTotal * 10) / 10,
        };
      });
    }
  };

  const handleDemoUpdateQuestion = (
    secIdx: number,
    questionId: number,
    patch: Partial<QuestionItem>
  ) => {
    applyDemoSectionsMutation((prev) =>
      prev.map((sec, idx) =>
        idx !== secIdx
          ? sec
          : {
              ...sec,
              questions: sec.questions.map((q) =>
                q.id === questionId ? { ...q, ...patch } : q
              ),
            }
      )
    );
  };

  const handleDemoChangeQuestionType = (
    secIdx: number,
    questionId: number,
    newType: QuestionItem['question_type']
  ) => {
    let nextOptions: string[] = ['A', 'B', 'C', 'D'];
    if (newType === 'TRUE_FALSE') nextOptions = ['✓', '✗'];
    else if (newType === 'MCQ_ABC') nextOptions = ['A', 'B', 'C'];
    else if (newType === 'MCQ_ABCDEF') nextOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
    else if (newType === 'WRITING_FILL' || newType === 'WRITING_ESSAY') nextOptions = [];

    applyDemoSectionsMutation((prev) =>
      prev.map((sec, idx) =>
        idx !== secIdx
          ? sec
          : {
              ...sec,
              questions: sec.questions.map((q) => {
                if (q.id !== questionId) return q;
                let nextAns = q.correct_answer || '';
                if (newType === 'TRUE_FALSE') {
                  if (!['TRUE', 'FALSE'].includes(nextAns.toUpperCase())) nextAns = 'TRUE';
                } else if (newType.startsWith('MCQ_')) {
                  if (!nextOptions.includes(nextAns.toUpperCase())) nextAns = 'A';
                }
                return {
                  ...q,
                  question_type: newType,
                  options: nextOptions,
                  correct_answer: nextAns,
                };
              }),
            }
      )
    );
  };

  const handleDemoDeleteQuestion = (secIdx: number, questionId: number) => {
    applyDemoSectionsMutation((prev) =>
      prev.map((sec, idx) =>
        idx !== secIdx
          ? sec
          : {
              ...sec,
              questions: sec.questions.filter((q) => q.id !== questionId),
            }
      )
    );
  };

  const handleDemoAddQuestion = (secIdx: number) => {
    applyDemoSectionsMutation((prev) =>
      prev.map((sec, idx) => {
        if (idx !== secIdx) return sec;
        const maxQNum = sec.questions.reduce((m, q) => Math.max(m, q.question_number), 0);
        const nextNum = maxQNum > 0 ? maxQNum + 1 : 1;
        const isWriting = sec.section_type === 'WRITING';
        const defaultType: QuestionItem['question_type'] = isWriting ? 'WRITING_FILL' : 'MCQ_ABCD';
        const defaultOpts = isWriting ? [] : ['A', 'B', 'C', 'D'];
        const defaultPoints = sec.questions[0]?.points || 5;
        const newQ: QuestionItem = {
          id: -Date.now() - Math.floor(Math.random() * 1000),
          section_id: sec.id || idx + 1,
          question_number: nextNum,
          question_type: defaultType,
          prompt_text: `Câu ${nextNum}`,
          options: defaultOpts,
          correct_answer: isWriting ? '' : 'A',
          sample_answer: '',
          points: defaultPoints,
          order_index: sec.questions.length,
        };
        return {
          ...sec,
          questions: [...sec.questions, newQ],
        };
      })
    );
  };

  const handleDemoUpdateMetaField = (patch: {
    title?: string;
    hsk_level?: string;
    duration_minutes?: number;
    pass_score?: number;
  }) => {
    if (onDemoUpdateMeta) {
      onDemoUpdateMeta(patch);
    } else {
      setExam((prev) => (prev ? { ...prev, ...patch } : null));
    }
  };

  // Total questions & answered count
  const allQuestions: QuestionItem[] = exam?.sections.flatMap((s) => s.questions) || [];
  const totalCount = allQuestions.length;
  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[Number(k)] && userAnswers[Number(k)].trim() !== ''
  ).length;

  // Submit Exam (hoặc chấm thử Demo cục bộ không ghi vào DB)
  const handleSubmitExam = async (_forceAuto: boolean = false) => {
    if (!exam || isSubmitting) return;

    if (demoMode) {
      setIsSubmitting(true);
      setShowConfirmSubmit(false);
      setAttemptResult(computeDemoAttemptResult(exam, userAnswers));
      setIsSubmitting(false);
      return;
    }

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
  const currentPdfUrl = resolveMediaUrl(
    pdfViewMode === 'answer' && exam.answer_pdf_url ? exam.answer_pdf_url : exam.exam_pdf_url
  );

  return (
    <div
      className={
        demoMode
          ? 'w-full h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white font-sans'
          : 'min-h-screen flex flex-col bg-[#FCFBF8] dark:bg-[#0B0F17] text-slate-900 dark:text-white font-sans'
      }
    >
      {/* ── THANH THÔNG BÁO CHẾ ĐỘ XEM DEMO GHIM TRÊN CÙNG ─────────────────── */}
      {demoMode && (
        <div className="shrink-0 z-50 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700 text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-white/15">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-black uppercase tracking-wider shrink-0">
              DEMO PREVIEW
            </span>
            <span>
              CHẾ ĐỘ XEM DEMO (CHƯA XUẤT BẢN) — Kiểm tra hiển thị PDF, Audio và chấm điểm thử trước khi công khai
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {demoNotice && (
              <span
                className={`px-3 py-1 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm animate-in fade-in duration-150 ${
                  demoNotice.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {demoNotice.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                )}
                <span>{demoNotice.text}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onBack?.()}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại chỉnh sửa</span>
            </button>
            {onDemoSaveDraft && (
              <button
                type="button"
                disabled={isPublishingDemo}
                onClick={onDemoSaveDraft}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu nháp</span>
              </button>
            )}
            {onDemoPublish && (
              <button
                type="button"
                disabled={isPublishingDemo}
                onClick={onDemoPublish}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPublishingDemo ? 'Đang xuất bản...' : '✓ Xác nhận & Xuất bản đề thi'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TOP APP BAR (HEADER CỐ ĐỊNH) ─────────────────────────────────── */}
      <header
        className={`${
          demoMode ? 'shrink-0' : 'sticky top-0'
        } z-40 bg-white/95 dark:bg-[#111722]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-3 shadow-sm`}
      >
        {/* Left: Back & Exam Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              if (demoMode) {
                onBack?.();
              } else if (!attemptResult && answeredCount > 0) {
                setShowConfirmLeave(true);
              } else {
                onBack ? onBack() : (window.location.hash = '#/mock-exams');
              }
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title={demoMode ? 'Quay lại chỉnh sửa' : 'Thoát phòng thi'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            {demoMode ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-md bg-[#C41E3A]/10 text-[#C41E3A] shrink-0">
                  {exam.code}
                </span>
                <select
                  value={exam.hsk_level}
                  onChange={(e) => handleDemoUpdateMetaField({ hsk_level: e.target.value })}
                  className="text-xs font-bold px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700 cursor-pointer outline-none"
                  title="Đổi cấp độ HSK"
                >
                  {['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={exam.title}
                  onChange={(e) => handleDemoUpdateMetaField({ title: e.target.value })}
                  className="text-sm sm:text-base font-display font-extrabold bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-white/10 px-2 py-0.5 rounded-lg border border-transparent focus:border-[#C41E3A] outline-none min-w-[180px] flex-1 max-w-md"
                  title="Bấm để sửa tiêu đề đề thi"
                />
                <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#C41E3A]" />
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={exam.duration_minutes}
                    onChange={(e) =>
                      handleDemoUpdateMetaField({ duration_minutes: Number(e.target.value) || 35 })
                    }
                    className="w-11 text-center font-bold bg-transparent outline-none border-b border-slate-300 focus:border-[#C41E3A]"
                    title="Sửa thời gian làm bài (phút)"
                  />
                  <span className="text-slate-500 font-semibold">phút</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                  <span className="text-slate-500 font-semibold">Đạt:</span>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={exam.pass_score}
                    onChange={(e) =>
                      handleDemoUpdateMetaField({ pass_score: Number(e.target.value) || 0 })
                    }
                    className="w-12 text-center font-bold text-emerald-600 bg-transparent outline-none border-b border-slate-300 focus:border-[#C41E3A]"
                    title="Sửa điểm chuẩn đạt"
                  />
                  <span className="text-slate-400 font-bold">/ {exam.total_score}đ</span>
                </div>
              </div>
            ) : (
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
            )}
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
              onClick={() => (demoMode ? handleSubmitExam(false) : setShowConfirmSubmit(true))}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                demoMode ? 'bg-sky-600 hover:bg-sky-700' : 'bg-[#C41E3A] hover:bg-[#A81830]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{demoMode ? 'Chấm thử Demo' : 'Nộp bài'}</span>
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
              <span>{demoMode ? 'Làm lại Demo' : 'Làm lại đề này'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── SUBMISSION SCORE SUMMARY BANNER (NẾU ĐÃ NỘP BÀI) ──────────────── */}
      {attemptResult && (
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-[#1C1917] to-slate-900 text-white py-4 px-4 sm:px-8 border-b border-white/10 shadow-lg">
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
      <main
        className={`flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden ${
          demoMode ? '' : 'h-[calc(100vh-4rem)]'
        }`}
      >
        {/* ── CỘT BÊN TRÁI (~58% CHIỀU RỘNG): FILE ĐỀ PDF + AUDIO PLAYER ─────── */}
        <section className="w-full lg:w-[58%] h-full min-h-0 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0E131F]">
          {/* Pinned Audio Player Bar */}
          {exam.audio_url && (
            <div className="p-3 bg-white dark:bg-[#141a22] border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
              <audio ref={audioRef} src={resolveMediaUrl(exam.audio_url)} preload="auto" />

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
          <div className="flex-1 min-h-0 w-full relative bg-slate-200 dark:bg-[#0B0F17]">
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
        <section className="w-full lg:w-[42%] flex flex-col h-full min-h-0 overflow-hidden bg-white dark:bg-[#141a22]">
          {/* Demo Mode Switcher Bar (Làm thử vs Sửa nhanh trực tiếp) */}
          {demoMode && (
            <div className="px-3.5 py-2.5 bg-sky-50/90 dark:bg-sky-950/30 border-b border-sky-200/80 dark:border-sky-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="inline-flex p-0.5 rounded-xl bg-white dark:bg-white/10 border border-sky-200 dark:border-white/10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDemoInteractionMode('test')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    demoInteractionMode === 'test'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chế độ Làm thử</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoInteractionMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    demoInteractionMode === 'edit'
                      ? 'bg-[#C41E3A] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Chế độ Sửa nhanh</span>
                </button>
              </div>

              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span>
                  Phần này:{' '}
                  <b className="text-[#C41E3A]">
                    {Math.round(
                      activeSection.questions.reduce((s, q) => s + Number(q.points || 0), 0) * 10
                    ) / 10}
                    đ
                  </b>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Tổng đề: <b className="text-emerald-600">{exam.total_score}đ</b>
                </span>
              </div>
            </div>
          )}

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
                    onClick={() => handleSwitchSection(idx)}
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
          <div ref={questionsContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
              const showInlineTools = demoMode && (demoInteractionMode === 'edit' || isSubmitted);
              const isNotesExpanded = Boolean(expandedNotesMap[q.id]);

              return (
                <div
                  key={q.id}
                  id={`question-card-${q.id}`}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-red-500 bg-red-50/70 dark:bg-red-950/30 ring-2 ring-red-500/50 shadow-sm'
                      : q.needsReview
                        ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-300'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
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

                      {q.needsReview && demoMode && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1"
                          title={q.reviewReason || 'Cần kiểm tra lại đáp án từ PDF'}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Cần kiểm tra</span>
                        </span>
                      )}

                      {showInlineTools ? (
                        <div className="inline-flex items-center gap-1 bg-[#C41E3A]/10 px-2 py-0.5 rounded-md border border-[#C41E3A]/20">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={q.points}
                            onChange={(e) =>
                              handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                                points: Number(e.target.value) || 0,
                              })
                            }
                            className="w-12 text-center font-black text-[11px] text-[#C41E3A] bg-transparent outline-none"
                            title="Sửa điểm số câu này"
                          />
                          <span className="text-[10px] font-bold text-[#C41E3A]">đ</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#C41E3A] px-2 py-0.5 rounded-md bg-[#C41E3A]/10">
                          {q.points} điểm
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
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

                      {/* Quick Edit Toolbar Icons in Demo */}
                      {demoMode && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNotesMap((prev) => ({
                                ...prev,
                                [q.id]: !prev[q.id],
                              }))
                            }
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isNotesExpanded
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'border-slate-200 dark:border-white/10 text-slate-500 hover:text-[#C41E3A] hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                            title="Sửa ghi chú / nội dung câu hỏi & giải thích"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {showInlineTools && (
                            <button
                              type="button"
                              onClick={() => handleDemoDeleteQuestion(activeSectionIdx, q.id)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── DẢI CÔNG CỤ SỬA NHANH GIÁO VIÊN TRONG MÀN HÌNH DEMO ───── */}
                  {showInlineTools && (
                    <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0E131F] border border-slate-200 dark:border-white/10 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Đổi nhanh Dạng câu hỏi */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500">Dạng câu:</span>
                          <select
                            value={q.question_type}
                            onChange={(e) =>
                              handleDemoChangeQuestionType(
                                activeSectionIdx,
                                q.id,
                                e.target.value as QuestionItem['question_type']
                              )
                            }
                            className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141a22] text-slate-800 dark:text-slate-200 cursor-pointer outline-none focus:border-[#C41E3A]"
                          >
                            <option value="TRUE_FALSE">Đúng / Sai (✓/✗)</option>
                            <option value="MCQ_ABC">Trắc nghiệm A–C</option>
                            <option value="MCQ_ABCD">Trắc nghiệm A–D</option>
                            <option value="MCQ_ABCDEF">Trắc nghiệm A–F</option>
                            <option value="WRITING_FILL">Viết điền đáp án</option>
                            <option value="WRITING_ESSAY">Viết câu văn</option>
                          </select>
                        </div>

                        {/* Đổi nhanh Đáp án chuẩn */}
                        {q.question_type === 'TRUE_FALSE' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500">Đáp án chuẩn:</span>
                            {[
                              { val: 'TRUE', label: '✓ Đúng' },
                              { val: 'FALSE', label: '✗ Sai' },
                            ].map(({ val, label }) => {
                              const active = (q.correct_answer || '').toUpperCase() === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() =>
                                    handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                                      correct_answer: val,
                                      needsReview: false,
                                    })
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer transition-all ${
                                    active
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-400'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {q.question_type.startsWith('MCQ_') && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-500 mr-1">Đáp án chuẩn:</span>
                            {(q.question_type === 'MCQ_ABC'
                              ? ['A', 'B', 'C']
                              : q.question_type === 'MCQ_ABCDEF'
                                ? ['A', 'B', 'C', 'D', 'E', 'F']
                                : ['A', 'B', 'C', 'D']
                            ).map((opt) => {
                              const active = (q.correct_answer || '').toUpperCase() === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                                      correct_answer: opt,
                                      needsReview: false,
                                    })
                                  }
                                  className={`w-7 h-7 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                                    active
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-400'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Với câu viết: Ô sửa nhanh Đáp án chuẩn & Câu văn mẫu tham khảo */}
                      {(q.question_type === 'WRITING_FILL' || q.question_type === 'WRITING_ESSAY') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Đáp án chuẩn
                            </label>
                            <input
                              type="text"
                              value={q.correct_answer || ''}
                              onChange={(e) =>
                                handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                                  correct_answer: e.target.value,
                                  needsReview: false,
                                })
                              }
                              placeholder="Nhập đáp án chuẩn..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a22] text-xs outline-none focus:border-[#C41E3A]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Câu văn mẫu tham khảo
                            </label>
                            <input
                              type="text"
                              value={q.sample_answer || ''}
                              onChange={(e) =>
                                handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                                  sample_answer: e.target.value,
                                })
                              }
                              placeholder="Nhập câu mẫu tham khảo..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a22] text-xs outline-none focus:border-[#C41E3A]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ô sửa nhanh Nội dung câu dẫn & Giải thích (khi bấm icon bút chì) */}
                  {demoMode && isNotesExpanded && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                          Nội dung câu hỏi / câu dẫn (tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={q.prompt_text || ''}
                          onChange={(e) =>
                            handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                              prompt_text: e.target.value,
                            })
                          }
                          placeholder={`VD: Câu ${q.question_number}...`}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-white/10 bg-white dark:bg-[#141a22] text-xs outline-none focus:border-[#C41E3A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                          Giải thích đáp án (hiển thị sau khi nộp bài)
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) =>
                            handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                              explanation: e.target.value,
                            })
                          }
                          placeholder="Nhập giải thích chi tiết hoặc transcript..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-white/10 bg-white dark:bg-[#141a22] text-xs outline-none focus:border-[#C41E3A]"
                        />
                      </div>
                    </div>
                  )}

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

                    {/* 2. MCQ_ABC (A, B, C) */}
                    {q.question_type === 'MCQ_ABC' && (
                      <div className="grid grid-cols-3 gap-2.5">
                        {(q.options && q.options.length > 0 ? q.options : ['A', 'B', 'C']).map(
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

                    {/* 3. MCQ_ABCD (A, B, C, D) */}
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

            {/* Nút thêm nhanh câu hỏi tại chỗ trong Demo */}
            {demoMode && (demoInteractionMode === 'edit' || activeSection.questions.length === 0) && (
              <button
                type="button"
                onClick={() => handleDemoAddQuestion(activeSectionIdx)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#C41E3A] hover:bg-red-50/40 dark:hover:bg-red-950/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#C41E3A] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm câu vào phần này ({activeSection.title})</span>
              </button>
            )}

            {/* ── THANH ĐIỀU HƯỚNG LÙI LẠI / CHUYỂN TIẾP PHẦN THI ───────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
              {activeSectionIdx > 0 ? (
                <button
                  type="button"
                  onClick={() => handleSwitchSection(activeSectionIdx - 1)}
                  className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>← Lùi lại: {exam.sections[activeSectionIdx - 1]?.title}</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">
                  Đang ở phần đầu tiên
                </span>
              )}

              {activeSectionIdx < exam.sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleSwitchSection(activeSectionIdx + 1)}
                  className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
                >
                  <span>Tiếp theo: {exam.sections[activeSectionIdx + 1]?.title} →</span>
                </button>
              ) : !attemptResult && !demoMode ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmSubmit(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 cursor-pointer transition-all ml-auto disabled:opacity-50"
                >
                  <span>
                    Hoàn tất &amp; Nộp bài ✓ ({answeredCount}/{totalCount} câu)
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (questionsContainerRef.current) {
                      questionsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
                >
                  <span>↑ Lên đầu trang</span>
                </button>
              )}
            </div>
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

      {/* ── MODAL XÁC NHẬN RỜI PHÒNG THI ──────────────────────────────────── */}
      {showConfirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                Rời khỏi phòng thi?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Bạn đang làm dở bài thi (đã trả lời <b>{answeredCount}/{totalCount}</b> câu). Nếu rời khỏi trang ngay bây giờ, kết quả hiện tại sẽ không được lưu lại.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmLeave(false)}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmLeave(false);
                  onBack ? onBack() : (window.location.hash = '#/mock-exams');
                }}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
              >
                Rời khỏi trang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamSplitScreen;
