import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api, resolveMediaUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { appConfirm, appNotice } from '../../lib/dialog';
import {
  Play,
  Pause,
  RotateCcw,
  Award,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Flag,
  Volume2,
  Lock,
} from 'lucide-react';

export interface QuestionItem {
  id: number;
  section_id: number;
  question_number: number;
  question_type:
    | 'MCQ_ABCD'
    | 'TRUE_FALSE'
    | 'MCQ_ABCDEF'
    | 'WRITING_FILL'
    | 'WRITING_ESSAY'
    | 'MCQ_ABC';
  prompt_text?: string;
  options?: string[];
  points: number;
  order_index?: number;
  needsReview?: boolean;
  reviewReason?: string;
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

const SECTION_META: Record<
  SectionItem['section_type'],
  { viName: string; zhName: string; subtitle: string }
> = {
  LISTENING: { viName: 'Nghe', zhName: '听力理解', subtitle: 'Nghe hiểu · 听力理解' },
  READING: { viName: 'Đọc', zhName: '阅读理解', subtitle: 'Đọc hiểu · 阅读理解' },
  WRITING: { viName: 'Viết', zhName: '书写', subtitle: 'Viết · 书写' },
};

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
      else writingScore += earned;

      detailedAnswers.push({
        question_id: q.id,
        question_number: q.question_number,
        section_type: sec.section_type,
        user_answer: userAns,
        correct_answer: expected,
        is_correct: isCorrect,
        earned_score: earned,
        points: pts,
        explanation: q.explanation || '',
      });
    }
  }

  return {
    attempt_id: Date.now(),
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

export const StudentExamSplitScreen: React.FC<StudentExamSplitScreenProps> = ({
  examId,
  onBack,
  demoMode = false,
  demoExamData,
  onDemoPublish,
  onDemoSaveDraft,
  demoNotice = null,
  isPublishingDemo = false,
}) => {
  const { user } = useAuth();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [lockedSections, setLockedSections] = useState<Record<number, boolean>>({});
  const [currentLocalIdx, setCurrentLocalIdx] = useState<number>(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState<number>(35 * 60);
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number>(15 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);

  // Audio player state
  const [volume, setVolume] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const autoSubmittedRef = useRef(false);

  const sectionDurations = useMemo(() => {
    if (!exam?.sections?.length) return [];
    const totalSecs = Math.max(60, (exam.duration_minutes || 35) * 60);
    const totalQ = Math.max(
      1,
      exam.sections.reduce((acc, s) => acc + s.questions.length, 0)
    );
    return exam.sections.map((s) =>
      Math.max(60, Math.round((s.questions.length / totalQ) * totalSecs))
    );
  }, [exam]);

  useEffect(() => {
    if (demoMode && demoExamData) {
      setExam(demoExamData);
      setLoading(false);
      setError(null);
      const totalSecs = (demoExamData.duration_minutes || 35) * 60;
      setTotalTimeLeft(totalSecs);
      setSectionTimeLeft(Math.round(totalSecs / Math.max(1, demoExamData.sections.length)));
      return;
    }
    if (!examId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        autoSubmittedRef.current = false;
        const data = await api
          .get<ExamDetail>(`/exams/${examId}/take`)
          .catch(() => api.get<ExamDetail>(`/exams/${examId}`));
        if (cancelled) return;
        if (!data) throw new Error('Không tìm thấy dữ liệu đề thi.');
        setExam(data);
        setActiveSectionIdx(0);
        setLockedSections({});
        setCurrentLocalIdx(0);
        const totalSecs = (data.duration_minutes || 35) * 60;
        const totalQ = Math.max(
          1,
          (data.sections || []).reduce((acc, s) => acc + (s.questions?.length || 0), 0)
        );
        const firstSecQ = data.sections?.[0]?.questions?.length || totalQ;
        setTotalTimeLeft(totalSecs);
        setSectionTimeLeft(Math.max(60, Math.round((firstSecQ / totalQ) * totalSecs)));
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Không thể tải đề thi HSK.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [examId, demoMode, demoExamData]);

  const sections = exam?.sections || [];
  const activeSection = sections[activeSectionIdx] || sections[0] || null;
  const currentQuestion =
    activeSection?.questions?.[currentLocalIdx] || activeSection?.questions?.[0] || null;

  const allQuestions = useMemo(
    () => sections.flatMap((s) => s.questions || []),
    [sections]
  );
  const totalQuestionsCount = allQuestions.length;
  const answeredCount = useMemo(
    () =>
      allQuestions.filter((q) => String(userAnswers[q.id] || '').trim() !== '').length,
    [allQuestions, userAnswers]
  );

  // Sub-parts grouped in 5s (Phần 1 · câu 1–5, Phần 2 · câu 6–10...)
  const subParts = useMemo(() => {
    if (!activeSection) return [];
    const groups: Array<{
      partNo: number;
      from: number;
      to: number;
      items: Array<{ question: QuestionItem; localIdx: number }>;
    }> = [];
    const chunkSize = 5;
    for (let i = 0; i < activeSection.questions.length; i += chunkSize) {
      const slice = activeSection.questions.slice(i, i + chunkSize).map((question, offset) => ({
        question,
        localIdx: i + offset,
      }));
      groups.push({
        partNo: Math.floor(i / chunkSize) + 1,
        from: slice[0].question.question_number,
        to: slice[slice.length - 1].question.question_number,
        items: slice,
      });
    }
    return groups;
  }, [activeSection]);

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setIsPlaying(false);
    setAudioProgress(0);
  };

  useEffect(() => {
    stopAudio();
    return () => stopAudio();
  }, [currentQuestion?.id, activeSectionIdx]);

  // Dual Timer countdown
  useEffect(() => {
    if (loading || !exam || attemptResult) return;
    if (totalTimeLeft <= 0) {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void handleSubmitExam(true);
      }
      return;
    }
    const timer = window.setInterval(() => {
      setTotalTimeLeft((t) => Math.max(0, t - 1));
      setSectionTimeLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading, exam, attemptResult, totalTimeLeft]);

  const handleToggleAudio = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    const rawUrl = activeSection?.audio_url || exam?.audio_url;
    const resolvedUrl = rawUrl ? resolveMediaUrl(rawUrl) : '';

    if (resolvedUrl) {
      const audio = new Audio(resolvedUrl);
      audio.volume = volume / 100;
      audioRef.current = audio;
      setIsPlaying(true);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress(Math.min(100, Math.round((audio.currentTime / audio.duration) * 100)));
        }
      };
      audio.onended = () => stopAudio();
      audio.onerror = () => {
        stopAudio();
        speakCurrentQuestion();
      };
      audio.play().catch(() => {
        stopAudio();
        speakCurrentQuestion();
      });
      return;
    }

    speakCurrentQuestion();
  };

  const speakCurrentQuestion = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const raw =
      currentQuestion?.prompt_text ||
      activeSection?.instructions ||
      `第${currentQuestion?.question_number || 1}题`;
    const quoted = raw.match(/"([^"]+)"|“([^”]+)”/);
    const spoken = quoted ? quoted[1] || quoted[2] : raw;
    const u = new SpeechSynthesisUtterance(spoken);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    u.volume = volume / 100;

    setIsPlaying(true);
    setAudioProgress(10);
    progressTimerRef.current = window.setInterval(() => {
      setAudioProgress((p) => (p >= 92 ? 92 : p + 8));
    }, 220);

    u.onend = () => {
      setAudioProgress(100);
      window.setTimeout(() => stopAudio(), 250);
    };
    u.onerror = () => stopAudio();
    window.speechSynthesis.speak(u);
  };

  const handleSelectAnswer = (qId: number, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const toggleFlag = (qId: number) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleAdvanceOrSubmit = async () => {
    if (!activeSection) return;
    const isLastSection = activeSectionIdx >= sections.length - 1;
    if (isLastSection) {
      await handleSubmitExam(false);
      return;
    }

    const curMeta = SECTION_META[activeSection.section_type];
    const nextSec = sections[activeSectionIdx + 1];
    const nextMeta = SECTION_META[nextSec.section_type];

    const ok = await appConfirm({
      title: `Nộp phần ${curMeta.viName}?`,
      message: `Sau khi nộp phần ${curMeta.viName}, phần này sẽ bị khóa và bạn chuyển sang phần ${nextMeta.viName} · ${nextMeta.zhName}. Xác nhận chuyển phần?`,
      confirmLabel: `Sang phần ${nextMeta.viName}`,
      cancelLabel: 'Làm tiếp',
    });
    if (!ok) return;

    stopAudio();
    setLockedSections((prev) => ({ ...prev, [activeSectionIdx]: true }));
    setActiveSectionIdx(activeSectionIdx + 1);
    setCurrentLocalIdx(0);
    setSectionTimeLeft(sectionDurations[activeSectionIdx + 1] || 900);
  };

  const handleSubmitExam = async (skipConfirm = false) => {
    if (!exam || isSubmitting) return;
    if (!skipConfirm) {
      const ok = await appConfirm({
        title: 'Nộp bài thi HSK?',
        message:
          answeredCount < totalQuestionsCount
            ? `Bạn mới trả lời ${answeredCount}/${totalQuestionsCount} câu. Xác nhận nộp bài ngay?`
            : 'Bạn đã trả lời toàn bộ câu hỏi. Xác nhận nộp bài để chấm điểm ngay?',
        confirmLabel: 'Nộp bài ngay',
        cancelLabel: 'Làm tiếp',
      });
      if (!ok) return;
    }

    stopAudio();
    setIsSubmitting(true);
    try {
      if (demoMode) {
        const res = computeDemoAttemptResult(exam, userAnswers);
        setAttemptResult(res);
        if (res.is_passed) confetti({ particleCount: 90, spread: 70 });
        return;
      }

      const answersPayload = allQuestions.map((q) => ({
        question_id: q.id,
        user_answer: userAnswers[q.id] || '',
      }));

      const res = await api.post<AttemptResult>(`/exams/${exam.id}/submit`, {
        answers: answersPayload,
      });
      setAttemptResult(res);
      if (res.is_passed) {
        try {
          confetti({ particleCount: 100, spread: 72, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      autoSubmittedRef.current = false;
      appNotice(err?.message || 'Lỗi khi nộp bài thi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    autoSubmittedRef.current = false;
    setAttemptResult(null);
    setUserAnswers({});
    setFlagged({});
    setLockedSections({});
    setActiveSectionIdx(0);
    setCurrentLocalIdx(0);
    setTotalTimeLeft((exam?.duration_minutes || 35) * 60);
    setSectionTimeLeft(sectionDurations[0] || 900);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f7] dark:bg-[#0b0f14]">
        <p className="text-sm font-bold text-slate-500">Đang tải phòng thi HSK...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f7] dark:bg-[#0b0f14] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#141c26] border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#C41E3A] mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Không thể mở phòng thi
          </h2>
          <p className="text-sm text-slate-500">{error || 'Đề thi không tồn tại.'}</p>
          <button
            type="button"
            onClick={() => (onBack ? onBack() : (window.location.hash = '#/exams'))}
            className="px-5 py-2.5 rounded-xl bg-[#C41E3A] text-white font-bold text-sm cursor-pointer"
          >
            Quay lại kho đề
          </button>
        </div>
      </div>
    );
  }

  // Result View after Submit
  if (attemptResult) {
    return (
      <div className="min-h-screen bg-[#faf7f7] dark:bg-[#0b0f14] py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#141c26] border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-sm">
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                attemptResult.is_passed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#C41E3A] text-white'
              }`}
            >
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                  attemptResult.is_passed
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-primary-50 text-[#C41E3A]'
                }`}
              >
                {attemptResult.is_passed ? 'Đạt chuẩn HSK' : 'Chưa đạt — Cần ôn thêm'}
              </span>
              <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white mt-2">
                {attemptResult.exam_title}
              </h1>
              <p className="text-4xl font-black text-[#C41E3A] mt-3">
                {attemptResult.total_score} / {attemptResult.max_score} điểm
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Đúng {attemptResult.correct_count} câu · Sai {attemptResult.wrong_count} câu
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0b0f14] border border-slate-200/80 dark:border-white/10">
                <p className="text-[11px] font-bold text-slate-500">Nghe</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {attemptResult.listening_score}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0b0f14] border border-slate-200/80 dark:border-white/10">
                <p className="text-[11px] font-bold text-slate-500">Đọc</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {attemptResult.reading_score}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0b0f14] border border-slate-200/80 dark:border-white/10">
                <p className="text-[11px] font-bold text-slate-500">Viết</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {attemptResult.writing_score}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại đề này</span>
              </button>
              <button
                type="button"
                onClick={() => (onBack ? onBack() : (window.location.hash = '#/exams?mode=mock'))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Về kho đề thi</span>
              </button>
            </div>
          </div>

          {/* Review Answer List */}
          {Array.isArray(attemptResult.answers) && attemptResult.answers.length > 0 && (
            <div className="bg-white dark:bg-[#141c26] border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Chi tiết đáp án ({attemptResult.answers.length} câu)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attemptResult.answers.map((ans: any, idx: number) => (
                  <div
                    key={ans.question_id || idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      ans.is_correct
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-primary-50/50 dark:bg-[#C41E3A]/10 border-primary-200 dark:border-[#C41E3A]/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {ans.is_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#C41E3A] shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          Câu {ans.question_number || idx + 1}
                        </p>
                        <p className="text-slate-500">
                          Bạn chọn: <strong>{ans.user_answer || '—'}</strong> · Đáp án:{' '}
                          <strong className="text-emerald-600">{ans.correct_answer || '—'}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeMeta = activeSection ? SECTION_META[activeSection.section_type] : SECTION_META.READING;
  const currentSubPart = subParts.find((sp) =>
    sp.items.some((it) => it.localIdx === currentLocalIdx)
  );
  const isListening = activeSection?.section_type === 'LISTENING';
  const isLastSection = activeSectionIdx >= sections.length - 1;
  const isLastInSection = activeSection
    ? currentLocalIdx >= activeSection.questions.length - 1
    : true;

  // Determine choice options for currentQuestion
  const renderChoices = (q: QuestionItem) => {
    if (q.question_type === 'WRITING_FILL' || q.question_type === 'WRITING_ESSAY') {
      return (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Phần trả lời viết (书写)
          </label>
          <textarea
            rows={q.question_type === 'WRITING_ESSAY' ? 6 : 3}
            value={userAnswers[q.id] || ''}
            onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
            placeholder="Nhập câu trả lời bằng chữ Hán hoặc Pinyin..."
            className="w-full p-4 rounded-2xl bg-white dark:bg-[#141c26] border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] text-base font-chinese text-slate-900 dark:text-white"
          />
        </div>
      );
    }

    const choices: Array<{ value: string; letter: string; label: string }> =
      q.question_type === 'TRUE_FALSE'
        ? [
            { value: 'TRUE', letter: '✓', label: 'Đúng (对)' },
            { value: 'FALSE', letter: '✗', label: 'Sai (错)' },
          ]
        : (() => {
            const count =
              q.question_type === 'MCQ_ABC'
                ? 3
                : q.question_type === 'MCQ_ABCDEF'
                  ? 6
                  : Math.max(4, q.options?.length || 4);
            return Array.from({ length: count }, (_, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const rawText = q.options?.[idx];
              return {
                value: letter,
                letter,
                label: rawText ? rawText : `Đáp án ${letter}`,
              };
            });
          })();

    return (
      <div
        className={`grid gap-3.5 ${
          choices.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : choices.length === 6
              ? 'grid-cols-2 sm:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {choices.map((c) => {
          const isSelected = (userAnswers[q.id] || '').toUpperCase() === c.value.toUpperCase();
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => handleSelectAnswer(q.id, c.value)}
              className={`group p-5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-[#C41E3A] bg-primary-50/90 dark:bg-[#C41E3A]/15 shadow-md shadow-[#C41E3A]/15'
                  : 'border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141c26] hover:border-[#C41E3A]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-black ${
                    isSelected
                      ? 'text-[#C41E3A]'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-[#C41E3A]'
                  }`}
                >
                  {c.letter}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C41E3A]" />}
              </div>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f7] dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100">
      {/* Demo toolbar when previewing from TeacherExamManager */}
      {demoMode && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-amber-800 dark:text-amber-300">
            Chế độ xem trước đề thi (Demo){demoNotice ? ` — ${demoNotice.text}` : ''}
          </span>
          <div className="flex items-center gap-2">
            {onDemoSaveDraft && (
              <button
                type="button"
                onClick={onDemoSaveDraft}
                className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-bold cursor-pointer"
              >
                Lưu nháp
              </button>
            )}
            {onDemoPublish && (
              <button
                type="button"
                disabled={isPublishingDemo}
                onClick={onDemoPublish}
                className="px-3 py-1 rounded-lg bg-[#C41E3A] text-white font-bold cursor-pointer"
              >
                {isPublishingDemo ? 'Đang xuất bản...' : 'Xuất bản đề'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TOP BAR (Matching Image 3) ── */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-white/95 dark:bg-[#10161e]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : (window.location.hash = '#/exams?mode=mock'))}
            title="Rời phòng thi"
            className="w-9 h-9 rounded-full bg-[#C41E3A] text-white flex items-center justify-center shrink-0 hover:bg-[#A51730] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-display font-extrabold text-slate-900 dark:text-white truncate">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {activeMeta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-[11px] text-slate-400 leading-none">Thí sinh</p>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {user?.displayName || 'Học viên'}
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleAdvanceOrSubmit}
            className="px-5 py-2.5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#C41E3A]/25 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSubmitting
              ? 'Đang chấm...'
              : isLastSection
                ? 'Nộp bài thi'
                : `Nộp phần ${activeMeta.viName}`}
          </button>
        </div>
      </header>

      {/* ── MAIN BODY: LEFT QUESTION STAGE + RIGHT SIDEBAR (Images 2 & 3) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        <section className="lg:col-span-8 xl:col-span-9 p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
          {currentQuestion && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="max-w-3xl w-full mx-auto space-y-6"
              >
                {/* Câu X · Phần Y · câu A–B */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white">
                    Câu {currentQuestion.question_number}
                  </h2>
                  {currentSubPart && (
                    <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Phần {currentSubPart.partNo} · câu {currentSubPart.from}–{currentSubPart.to}
                    </span>
                  )}
                </div>

                {/* Audio Bar for Listening (Image 3) */}
                {isListening && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#141c26] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-wrap sm:flex-nowrap items-center gap-4">
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      aria-label={isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
                      className="w-10 h-10 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-[140px]">
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C41E3A] transition-all duration-200"
                          style={{ width: `${Math.max(audioProgress, isPlaying ? 10 : 4)}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {isPlaying ? 'Đang phát câu hỏi...' : 'Nghe đoạn ghi âm'}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <Volume2 className="w-4 h-4 text-[#C41E3A]" />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        aria-label="Âm lượng"
                        className="w-20 accent-[#C41E3A] cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-9 text-right">
                        {volume}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Question Prompt Card */}
                {(currentQuestion.prompt_text || activeSection?.instructions) && (
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#141c26] border border-slate-200/90 dark:border-white/10 shadow-sm">
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                      {currentQuestion.prompt_text ||
                        activeSection?.instructions ||
                        `Câu ${currentQuestion.question_number}`}
                    </p>
                  </div>
                )}

                {/* Choices or Writing Input */}
                {renderChoices(currentQuestion)}

                {/* Bottom Controls: Câu trước | Đánh dấu | Câu tiếp -> */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={currentLocalIdx === 0}
                    onClick={() => setCurrentLocalIdx((i) => Math.max(0, i - 1))}
                    className="px-5 py-2.5 rounded-full bg-white dark:bg-[#18202c] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm hover:border-[#C41E3A]/50 disabled:opacity-45 transition-colors cursor-pointer"
                  >
                    Câu trước
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border font-bold text-sm transition-colors cursor-pointer ${
                      flagged[currentQuestion.id]
                        ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-[#18202c] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    <span>{flagged[currentQuestion.id] ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                  </button>

                  {!isLastInSection ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentLocalIdx((i) =>
                          Math.min((activeSection?.questions.length || 1) - 1, i + 1)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-sm shadow-md shadow-[#C41E3A]/25 transition-colors cursor-pointer"
                    >
                      <span>Câu tiếp</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAdvanceOrSubmit}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-sm shadow-md shadow-[#C41E3A]/25 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span>
                        {isLastSection ? 'Nộp bài thi' : `Nộp phần ${activeMeta.viName}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {/* RIGHT SIDEBAR PANEL (Image 2 & Image 3) */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-[#10161e] border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-white/10 p-5 space-y-5">
          {/* Dual Timers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0b0f14] border border-slate-200/80 dark:border-white/10">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Phần hiện tại
              </p>
              <p
                className={`text-xl font-mono font-black mt-1 ${
                  sectionTimeLeft < 60
                    ? 'text-[#C41E3A] animate-pulse'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatTimer(sectionTimeLeft)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0b0f14] border border-slate-200/80 dark:border-white/10">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Toàn bài
              </p>
              <p
                className={`text-xl font-mono font-black mt-1 ${
                  totalTimeLeft < 120
                    ? 'text-[#C41E3A] animate-pulse'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatTimer(totalTimeLeft)}
              </p>
            </div>
          </div>

          {/* Section Stepper */}
          <div className="space-y-2.5">
            {sections.map((sec, idx) => {
              const meta = SECTION_META[sec.section_type];
              const isActive = idx === activeSectionIdx;
              const isLockedPast = !!lockedSections[idx];
              const isLockedFuture = idx > activeSectionIdx;
              const firstNum = sec.questions[0]?.question_number ?? 1;
              const lastNum = sec.questions[sec.questions.length - 1]?.question_number ?? firstNum;
              const mins = Math.max(1, Math.round((sectionDurations[idx] || 900) / 60));

              return (
                <button
                  key={sec.id}
                  type="button"
                  disabled={isLockedPast || isLockedFuture}
                  onClick={() => {
                    setActiveSectionIdx(idx);
                    setCurrentLocalIdx(0);
                    setSectionTimeLeft(sectionDurations[idx] || 900);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-primary-50/70 dark:bg-[#C41E3A]/15 border-[#C41E3A] shadow-sm'
                      : 'bg-slate-50/80 dark:bg-[#141c26]/70 border-slate-200/80 dark:border-white/10 opacity-75'
                  } ${isLockedPast || isLockedFuture ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive
                        ? 'bg-[#C41E3A] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isLockedPast ? <Lock className="w-3.5 h-3.5" /> : idx + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {meta.viName}{' '}
                      <span className="font-chinese font-medium text-slate-500 dark:text-slate-400">
                        · {meta.zhName}
                      </span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {firstNum}–{lastNum} · {mins} phút
                      {isLockedPast ? ' · đã khóa' : isLockedFuture ? ' · chưa mở' : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bảng câu hỏi (5 per group) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white">Bảng câu hỏi</span>
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Đã trả lời {answeredCount} / {totalQuestionsCount}
              </span>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {subParts.map((sp) => (
                <div key={sp.partNo} className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Phần {sp.partNo} · câu {sp.from}–{sp.to}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {sp.items.map((entry) => {
                      const qid = entry.question.id;
                      const isCur = entry.localIdx === currentLocalIdx;
                      const isAns = String(userAnswers[qid] || '').trim() !== '';
                      const isFlg = !!flagged[qid];

                      return (
                        <button
                          key={qid}
                          type="button"
                          onClick={() => setCurrentLocalIdx(entry.localIdx)}
                          className={`w-9 h-9 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center ${
                            isFlg
                              ? 'bg-amber-500 text-white'
                              : isAns
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 dark:bg-[#17202b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                          } ${
                            isCur
                              ? 'ring-2 ring-[#C41E3A] dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-[#10161e]'
                              : ''
                          }`}
                        >
                          {entry.question.question_number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-200 dark:bg-[#1b2430] border border-slate-300 dark:border-white/15" />
              <span>Chưa làm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span>Đánh dấu</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudentExamSplitScreen;
