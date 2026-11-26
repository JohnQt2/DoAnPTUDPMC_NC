import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api, resolveMediaUrl } from '../../lib/api';
import { appNotice } from '../../lib/dialog';
import { ShimmerButton } from '../../components/ui';
import {
  FileText,
  Headphones,
  Clock,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  X,
  Award,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Send,
  HelpCircle,
  RefreshCw,
  BookOpen,
  PenTool,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  Save,
  Flag,
  Volume2,
  VolumeX,
  Sparkles,
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

const LEVEL_GRADIENTS: Record<string, string> = {
  HSK1: 'from-[#D97706] to-[#B45309]',
  HSK2: 'from-[#157A57] to-[#116145]',
  HSK3: 'from-[#D95B18] to-[#B4460E]',
  HSK4: 'from-[#C41E3A] to-[#9E162E]',
  HSK5: 'from-[#184375] to-[#12325A]',
  HSK6: 'from-[#5A1063] to-[#430B4A]',
};

const DRAFT_TTL_MS = 3 * 60 * 60 * 1000;

function getDraftStorageKey(examId?: number): string | null {
  return examId ? `hanzi4u_mock_exam_draft_${examId}` : null;
}

const countHanzi = (str: string): number => {
  if (!str) return 0;
  const match = str.match(/[\u4e00-\u9fa5]/g);
  return match ? match.length : 0;
};

const formatPoints = (val: number): string => {
  const n = Number(val || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
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

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const [restoredDraftBanner, setRestoredDraftBanner] = useState<string | null>(null);

  // PDF viewer state + graceful missing-file detection
  const [pdfViewMode, setPdfViewMode] = useState<'exam' | 'answer'>('exam');
  const [pdfStatus, setPdfStatus] = useState<'checking' | 'ready' | 'missing'>('checking');
  const [pdfRetryTick, setPdfRetryTick] = useState(0);

  // Audio player state + graceful missing-file detection
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  // Confirmation modals
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  // Demo inline edit state
  const [demoInteractionMode, setDemoInteractionMode] = useState<'test' | 'edit'>('test');
  const [expandedNotesMap, setExpandedNotesMap] = useState<Record<number, boolean>>({});
  const hasInitializedDemoRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const questionsContainerRef = useRef<HTMLDivElement | null>(null);

  const clearSavedDraft = useCallback(() => {
    const key = getDraftStorageKey(examId);
    if (!key) return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  }, [examId]);

  const handleSwitchSection = (newIdx: number) => {
    setActiveSectionIdx(newIdx);
    requestAnimationFrame(() => {
      if (questionsContainerRef.current) {
        questionsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  // Load Exam Data (+ restore in-progress draft after accidental browser F5 reload)
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
        setFlagged({});
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
        autoSubmittedRef.current = false;
        const data = await api
          .get<ExamDetail>(`/exams/${examId}/take`)
          .catch(() => api.get<ExamDetail>(`/exams/${examId}`));
        if (!data) throw new Error('Không có dữ liệu đề thi.');
        setExam(data);

        const defaultSecs = (data.duration_minutes || 35) * 60;
        const draftKey = getDraftStorageKey(examId);
        let restored = false;

        if (draftKey) {
          try {
            const raw = sessionStorage.getItem(draftKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              const isFresh = parsed?.updatedAt && Date.now() - parsed.updatedAt < DRAFT_TTL_MS;
              const savedAnswers = parsed?.userAnswers && typeof parsed.userAnswers === 'object' ? parsed.userAnswers : {};
              const savedCount = Object.values(savedAnswers).filter(
                (v) => typeof v === 'string' && v.trim() !== ''
              ).length;
              if (isFresh && savedCount > 0) {
                setUserAnswers(savedAnswers);
                if (parsed.flagged && typeof parsed.flagged === 'object') {
                  setFlagged(parsed.flagged);
                }
                if (typeof parsed.activeSectionIdx === 'number' && parsed.activeSectionIdx < data.sections.length) {
                  setActiveSectionIdx(parsed.activeSectionIdx);
                }
                if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 10 && parsed.timeLeft <= defaultSecs) {
                  setTimeLeft(parsed.timeLeft);
                } else {
                  setTimeLeft(defaultSecs);
                }
                setRestoredDraftBanner(`Đã khôi phục ${savedCount} câu bạn đang làm trước khi tải lại trang.`);
                setTimeout(() => setRestoredDraftBanner(null), 4500);
                restored = true;
              }
            }
          } catch {
            // ignore corrupted draft
          }
        }

        if (!restored) {
          setTimeLeft(defaultSecs);
          setUserAnswers({});
          setFlagged({});
          setActiveSectionIdx(0);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải đề thi.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, demoMode, demoExamData]);

  // Persist in-progress student answers & timer across F5 reloads
  useEffect(() => {
    if (demoMode || !exam || attemptResult || loading) return;
    const key = getDraftStorageKey(examId);
    if (!key) return;
    const count = Object.values(userAnswers).filter((v) => v && v.trim() !== '').length;
    if (count === 0) return;
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          userAnswers,
          flagged,
          timeLeft,
          activeSectionIdx,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [demoMode, exam, attemptResult, loading, examId, userAnswers, flagged, timeLeft, activeSectionIdx]);

  // Auto-recompute Demo result when teacher edits answers/points live
  useEffect(() => {
    if (demoMode && exam && attemptResult) {
      setAttemptResult(computeDemoAttemptResult(exam, userAnswers));
    }
  }, [exam, demoMode]);

  // Countdown Timer
  useEffect(() => {
    if (demoMode || attemptResult || !exam || loading) return;
    if (timeLeft <= 0) {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void handleSubmitExam(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, timeLeft, attemptResult, demoMode, loading]);

  // Resolve PDF full URL & gracefully verify availability so missing sample PDFs never render a blank void
  const rawPdfUrl =
    pdfViewMode === 'answer' && exam?.answer_pdf_url
      ? exam.answer_pdf_url
      : exam?.exam_pdf_url || '';
  const currentPdfUrl = resolveMediaUrl(rawPdfUrl);

  useEffect(() => {
    if (!currentPdfUrl) {
      setPdfStatus('missing');
      return;
    }
    if (currentPdfUrl.startsWith('blob:') || currentPdfUrl.startsWith('data:')) {
      setPdfStatus('ready');
      return;
    }

    let cancelled = false;
    setPdfStatus('checking');

    fetch(currentPdfUrl, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (res.ok && (ct.includes('pdf') || !ct.includes('text/html'))) {
          setPdfStatus('ready');
        } else {
          setPdfStatus('missing');
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Cross-origin external URLs might block HEAD via CORS — let iframe try rendering
          const isLocalUpload = rawPdfUrl.startsWith('/uploads') || currentPdfUrl.includes('/uploads/');
          setPdfStatus(isLocalUpload ? 'missing' : 'ready');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPdfUrl, rawPdfUrl, pdfRetryTick]);

  // Audio player events & graceful error handling
  const resolvedAudioUrl = resolveMediaUrl(exam?.audio_url);

  useEffect(() => {
    setAudioUnavailable(false);
    setIsPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
  }, [resolvedAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setAudioCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setAudioDuration(audio.duration || 0);
      setAudioUnavailable(false);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      setAudioUnavailable(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [exam, resolvedAudioUrl]);

  const togglePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio || audioUnavailable) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          setAudioUnavailable(true);
        });
    }
  };

  const toggleMuteAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
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
    if (audio) audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (secs: number) => {
    const safe = Number.isFinite(secs) && secs >= 0 ? secs : 0;
    const m = Math.floor(safe / 60);
    const s = Math.floor(safe % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId: number, answerVal: string) => {
    if (attemptResult) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerVal,
    }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // ── DEMO INLINE EDIT HELPERS (100% COMPATIBLE WITH TeacherExamManager) ─────
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

  const allQuestions: QuestionItem[] = exam?.sections.flatMap((s) => s.questions) || [];
  const totalCount = allQuestions.length;
  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[Number(k)] && userAnswers[Number(k)].trim() !== ''
  ).length;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

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

      clearSavedDraft();
      setAttemptResult(res);

      if (res.answer_pdf_url) {
        setExam((prev) => (prev ? { ...prev, answer_pdf_url: res.answer_pdf_url } : null));
      }

      if (res.is_passed) {
        try {
          confetti({
            particleCount: 110,
            spread: 76,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }

      if (questionsContainerRef.current) {
        questionsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      autoSubmittedRef.current = false;
      appNotice(err.message || 'Lỗi khi nộp bài thi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestartExam = () => {
    clearSavedDraft();
    autoSubmittedRef.current = false;
    setAttemptResult(null);
    setUserAnswers({});
    setFlagged({});
    setTimeLeft((exam?.duration_minutes || 35) * 60);
    setPdfViewMode('exam');
    setActiveSectionIdx(0);
    if (questionsContainerRef.current) {
      questionsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── WARM SPLIT-SCREEN LOADING SKELETON ─────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col workspace-mesh-bg bg-[#F5F2EC] dark:bg-[#0c111b] overflow-hidden font-sans">
        <div className="h-16 px-5 border-b border-[#1C1917]/8 dark:border-white/10 bg-[#FCFBF8]/90 dark:bg-[#111827]/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1C1917]/8 dark:bg-white/10 animate-pulse" />
            <div className="w-52 h-5 rounded-lg bg-[#1C1917]/8 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="w-28 h-9 rounded-full bg-[#1C1917]/8 dark:bg-white/10 animate-pulse" />
          <div className="w-28 h-9 rounded-xl bg-[#C41E3A]/20 animate-pulse" />
        </div>
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div className="w-full lg:w-[58%] p-6 border-r border-[#1C1917]/8 dark:border-white/10 flex flex-col gap-4">
            <div className="h-14 rounded-2xl bg-[#FCFBF8]/80 dark:bg-[#141c2b]/80 animate-pulse" />
            <div className="flex-1 rounded-2xl bg-[#FCFBF8]/70 dark:bg-[#141c2b]/70 animate-pulse" />
          </div>
          <div className="w-full lg:w-[42%] p-6 flex flex-col gap-4">
            <div className="h-11 rounded-2xl bg-[#FCFBF8]/80 dark:bg-[#141c2b]/80 animate-pulse" />
            <div className="h-24 rounded-2xl bg-[#FCFBF8]/80 dark:bg-[#141c2b]/80 animate-pulse" />
            <div className="h-32 rounded-2xl bg-[#FCFBF8]/80 dark:bg-[#141c2b]/80 animate-pulse" />
            <div className="h-32 rounded-2xl bg-[#FCFBF8]/80 dark:bg-[#141c2b]/80 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen workspace-mesh-bg flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full p-8 rounded-[28px] glass-light text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/12 text-[#C41E3A] flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-[#1C1917] dark:text-white">
            Không thể tải đề thi
          </h2>
          <p className="text-sm text-[#57534E] dark:text-slate-400">
            {error || 'Đề thi không tồn tại hoặc đã bị ẩn.'}
          </p>
          <ShimmerButton
            type="button"
            onClick={() => (onBack ? onBack() : (window.location.hash = '#/exams?mode=mock'))}
            size="md"
          >
            Quay lại kho đề thi
          </ShimmerButton>
        </div>
      </div>
    );
  }

  const activeSection = exam.sections[activeSectionIdx] || exam.sections[0];
  const levelKey = (exam.hsk_level || 'HSK1').toUpperCase();
  const levelGrad = LEVEL_GRADIENTS[levelKey] || LEVEL_GRADIENTS.HSK1;
  const audioProgressPct = audioDuration > 0 ? Math.min(100, (audioCurrentTime / audioDuration) * 100) : 0;

  return (
    <div
      className={
        demoMode
          ? 'w-full h-full flex flex-col overflow-hidden workspace-mesh-bg text-[#1C1917] dark:text-slate-100 font-sans'
          : 'h-screen w-full flex flex-col overflow-hidden workspace-mesh-bg text-[#1C1917] dark:text-slate-100 font-sans'
      }
    >
      {/* ── DEMO PREVIEW TOP STRIP (TEACHER/ADMIN ONLY) ───────────────────────── */}
      {demoMode && (
        <div className="shrink-0 z-50 bg-gradient-to-r from-[#184375] via-[#1E4F8A] to-[#12325A] text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-white/15">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-black uppercase tracking-wider shrink-0">
              DEMO PREVIEW
            </span>
            <span>
              Chế độ xem thử trước khi xuất bản — kiểm tra PDF, Audio và chấm thử trực tiếp
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {demoNotice && (
              <span
                className={`px-3 py-1 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm ${
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
                className="px-4 py-1.5 rounded-xl bg-[#157A57] hover:bg-[#116145] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPublishingDemo ? 'Đang xuất bản...' : 'Xác nhận & Xuất bản'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── WARM PORCELAIN FROSTED TOP EXAM BAR ───────────────────────────────── */}
      <header className="shrink-0 z-40 bg-[#FCFBF8]/92 dark:bg-[#101622]/94 backdrop-blur-xl border-b border-[#1C1917]/8 dark:border-white/10 px-4 sm:px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-3 shadow-[0_6px_22px_-16px_rgba(28,25,23,0.18)]">
        {/* Left: Back Button + Level + Exam Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              if (demoMode) {
                onBack?.();
              } else if (!attemptResult && answeredCount > 0) {
                setShowConfirmLeave(true);
              } else {
                clearSavedDraft();
                onBack ? onBack() : (window.location.hash = '#/exams?mode=mock');
              }
            }}
            className="w-9 h-9 rounded-full bg-white/85 dark:bg-white/8 border border-[#1C1917]/10 dark:border-white/12 hover:border-[#C41E3A]/40 hover:text-[#C41E3A] text-[#57534E] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            title={demoMode ? 'Quay lại chỉnh sửa' : 'Quay lại danh sách đề'}
            aria-label={demoMode ? 'Quay lại chỉnh sửa' : 'Quay lại danh sách đề'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            {demoMode ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-extrabold text-[11px] px-2.5 py-1 rounded-full bg-[#C41E3A]/10 text-[#C41E3A] shrink-0">
                  {exam.code}
                </span>
                <select
                  value={exam.hsk_level}
                  onChange={(e) => handleDemoUpdateMetaField({ hsk_level: e.target.value })}
                  className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700 cursor-pointer outline-none"
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
                  className="text-sm sm:text-base font-display font-extrabold bg-transparent hover:bg-white/70 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-white/10 px-2 py-0.5 rounded-lg border border-transparent focus:border-[#C41E3A] outline-none min-w-[180px] flex-1 max-w-md"
                  title="Bấm để sửa tiêu đề đề thi"
                />
                <div className="flex items-center gap-1.5 text-xs bg-white/80 dark:bg-white/5 px-2.5 py-1 rounded-full border border-[#1C1917]/10 dark:border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#C41E3A]" />
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={exam.duration_minutes}
                    onChange={(e) =>
                      handleDemoUpdateMetaField({ duration_minutes: Number(e.target.value) || 35 })
                    }
                    className="w-10 text-center font-bold bg-transparent outline-none border-b border-slate-300 focus:border-[#C41E3A]"
                  />
                  <span className="text-slate-500 font-semibold">phút</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-white/80 dark:bg-white/5 px-2.5 py-1 rounded-full border border-[#1C1917]/10 dark:border-white/10">
                  <span className="text-slate-500 font-semibold">Đạt:</span>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={exam.pass_score}
                    onChange={(e) =>
                      handleDemoUpdateMetaField({ pass_score: Number(e.target.value) || 0 })
                    }
                    className="w-11 text-center font-bold text-[#157A57] dark:text-emerald-400 bg-transparent outline-none border-b border-slate-300 focus:border-[#C41E3A]"
                  />
                  <span className="text-slate-400 font-bold">/ {exam.total_score}đ</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${levelGrad} shrink-0`}
                >
                  {levelKey.replace('HSK', 'HSK ')}
                </span>
                <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-[#1C1917]/6 dark:bg-white/10 text-[#57534E] dark:text-slate-300 shrink-0">
                  {exam.code}
                </span>
                <h1 className="text-sm sm:text-base font-display font-extrabold text-[#1C1917] dark:text-white truncate">
                  {exam.title}
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Center: Countdown Timer Pill + Compact Progress */}
        <div className="flex items-center gap-3 shrink-0">
          {!attemptResult ? (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono font-black text-sm border transition-colors ${
                timeLeft <= 60
                  ? 'bg-rose-50 text-[#C41E3A] border-[#C41E3A]/45 dark:bg-rose-950/50 dark:text-rose-300 animate-pulse'
                  : timeLeft <= 300
                    ? 'bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-white/85 dark:bg-white/8 text-[#1C1917] dark:text-white border-[#1C1917]/10 dark:border-white/12'
              }`}
            >
              <Clock className="w-4 h-4 text-[#C41E3A] dark:text-rose-400" />
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#157A57]/12 dark:bg-emerald-950/50 text-[#157A57] dark:text-emerald-300 border border-[#157A57]/30 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã hoàn tất bài thi</span>
            </span>
          )}

          {/* Subtle linear progress indicator on sm+ */}
          <div className="hidden md:flex flex-col items-end gap-1 min-w-[92px]">
            <span className="text-[11px] font-bold text-[#57534E] dark:text-slate-400 tabular-nums">
              {attemptResult ? (
                <strong className="text-[#C41E3A] dark:text-rose-400">
                  {formatPoints(attemptResult.total_score)}/{formatPoints(attemptResult.max_score)}đ
                </strong>
              ) : (
                <>
                  <strong className="text-[#1C1917] dark:text-white">{answeredCount}</strong>/{totalCount} câu
                </>
              )}
            </span>
            {!attemptResult && (
              <div className="w-24 h-1.5 rounded-full bg-[#1C1917]/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C41E3A] to-[#D4A017] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Primary Submit / Retake Action */}
        <div className="flex items-center gap-2 shrink-0">
          {!attemptResult ? (
            demoMode ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#184375] hover:bg-[#12325A] text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Chấm thử Demo</span>
              </button>
            ) : (
              <ShimmerButton
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmSubmit(true)}
                size="sm"
                className="rounded-xl px-4 sm:px-5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang chấm...' : 'Nộp bài'}</span>
              </ShimmerButton>
            )
          ) : (
            <button
              type="button"
              onClick={handleRestartExam}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/85 dark:bg-white/8 border border-[#1C1917]/12 dark:border-white/15 text-xs font-bold text-[#1C1917] dark:text-slate-200 hover:border-[#C41E3A]/40 hover:text-[#C41E3A] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{demoMode ? 'Làm lại Demo' : 'Làm lại đề này'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Auto-restored draft toast strip (appears briefly when resuming after F5 reload) */}
      <AnimatePresence>
        {restoredDraftBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 bg-emerald-50/95 dark:bg-emerald-950/60 border-b border-emerald-200/80 dark:border-emerald-800/60 px-4 py-2 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{restoredDraftBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POST-SUBMISSION SCHOLAR SCORE BANNER ─────────────────────────────── */}
      {attemptResult && (
        <div className="shrink-0 bg-gradient-to-r from-[#241B18] via-[#1C1917] to-[#28181D] text-white py-3.5 px-4 sm:px-6 border-b border-[#D4A017]/25 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
                  attemptResult.is_passed
                    ? 'bg-[#157A57] text-white shadow-[#157A57]/30'
                    : 'bg-[#C41E3A] text-white shadow-[#C41E3A]/30'
                }`}
              >
                {attemptResult.is_passed ? <Award className="w-6 h-6" /> : <X className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      attemptResult.is_passed
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {attemptResult.is_passed ? 'Đạt chuẩn HSK' : 'Chưa đạt chuẩn'}
                  </span>
                  <span className="text-xs text-stone-400">
                    Mốc đạt: {formatPoints(attemptResult.pass_score)}đ
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-display font-black text-white mt-0.5 tabular-nums">
                  Tổng điểm:{' '}
                  <span className="text-[#FDE68A]">{formatPoints(attemptResult.total_score)}</span> /{' '}
                  {formatPoints(attemptResult.max_score)}đ
                </h2>
              </div>
            </div>

            {/* Skill Breakdown Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/10">
                <span className="text-stone-400 text-[10px] block">Nghe hiểu</span>
                <span className="font-extrabold text-amber-300 tabular-nums">
                  {formatPoints(attemptResult.listening_score)}đ
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/10">
                <span className="text-stone-400 text-[10px] block">Đọc hiểu</span>
                <span className="font-extrabold text-emerald-300 tabular-nums">
                  {formatPoints(attemptResult.reading_score)}đ
                </span>
              </div>
              {attemptResult.writing_score > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-white/8 border border-white/10">
                  <span className="text-stone-400 text-[10px] block">Phần viết</span>
                  <span className="font-extrabold text-sky-300 tabular-nums">
                    {formatPoints(attemptResult.writing_score)}đ
                  </span>
                </div>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/25 text-emerald-200">
                <span className="text-[10px] block opacity-80">Đúng / Sai</span>
                <span className="font-extrabold tabular-nums">
                  ✓ {attemptResult.correct_count} · ✗ {attemptResult.wrong_count}
                </span>
              </div>
            </div>

            {exam.answer_pdf_url && (
              <button
                type="button"
                onClick={() => setPdfViewMode(pdfViewMode === 'answer' ? 'exam' : 'answer')}
                className={`px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  pdfViewMode === 'answer'
                    ? 'bg-[#157A57] text-white hover:bg-[#116145]'
                    : 'bg-[#FCFBF8] text-[#1C1917] hover:bg-white'
                }`}
              >
                <BookOpen className={`w-4 h-4 ${pdfViewMode === 'answer' ? 'text-white' : 'text-[#157A57]'}`} />
                <span>
                  {pdfViewMode === 'answer' ? 'Quay lại Đề thi PDF' : 'Mở File Đáp Án PDF'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SPLIT-SCREEN WORKSPACE (58% DOCUMENT / 42% ANSWER SHEET) ─────────── */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* ── LEFT PANE (~58%): AUDIO PLAYER + FRAMED PDF DOCUMENT VIEWPORT ──── */}
        <section className="w-full lg:w-[58%] h-[42vh] lg:h-full min-h-0 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1C1917]/8 dark:border-white/10 bg-[#EFECE5]/80 dark:bg-[#0B0F17]">
          {/* Audio Player Bar */}
          {resolvedAudioUrl && (
            <div className="px-4 py-2.5 bg-[#FCFBF8]/95 dark:bg-[#131a27]/95 border-b border-[#1C1917]/8 dark:border-white/10 shrink-0">
              <audio ref={audioRef} src={resolvedAudioUrl} preload="metadata" />

              {audioUnavailable ? (
                <div className="flex items-center justify-between gap-3 py-1 text-xs text-[#78716C] dark:text-slate-400">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-[#1C1917]/6 dark:bg-white/8 flex items-center justify-center shrink-0">
                      <Headphones className="w-3.5 h-3.5 text-[#C41E3A]/70" />
                    </span>
                    <span className="truncate font-medium">
                      Đề mẫu này hiện chưa có file âm thanh MP3 đính kèm.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUnavailable(false);
                      audioRef.current?.load();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/8 border border-[#1C1917]/10 dark:border-white/10 text-[11px] font-bold text-[#57534E] dark:text-slate-300 hover:text-[#C41E3A] cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Thử lại</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="w-9 h-9 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white flex items-center justify-center shadow-sm shadow-[#C41E3A]/25 cursor-pointer transition-transform active:scale-95 shrink-0"
                      title={isPlaying ? 'Tạm dừng' : 'Phát file nghe'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => rewindAudio(5)}
                      className="px-2 py-1.5 rounded-lg text-[#57534E] dark:text-slate-300 hover:bg-[#1C1917]/6 dark:hover:bg-white/8 cursor-pointer text-[11px] inline-flex items-center gap-1 font-bold transition-colors"
                      title="Lùi 5 giây"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>-5s</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => forwardAudio(5)}
                      className="px-2 py-1.5 rounded-lg text-[#57534E] dark:text-slate-300 hover:bg-[#1C1917]/6 dark:hover:bg-white/8 cursor-pointer text-[11px] inline-flex items-center gap-1 font-bold transition-colors"
                      title="Tới 5 giây"
                    >
                      <FastForward className="w-3 h-3" />
                      <span>+5s</span>
                    </button>
                  </div>

                  {/* Smooth Filled Track Slider */}
                  <div className="flex-1 min-w-[130px] flex items-center gap-2.5">
                    <span className="text-[11px] font-mono text-[#78716C] dark:text-slate-400 font-bold tabular-nums">
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
                      style={{
                        background: `linear-gradient(to right, #C41E3A 0%, #C41E3A ${audioProgressPct}%, rgba(28,25,23,0.12) ${audioProgressPct}%, rgba(28,25,23,0.12) 100%)`,
                      }}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#C41E3A]"
                    />
                    <span className="text-[11px] font-mono text-[#78716C] dark:text-slate-400 font-bold tabular-nums">
                      {formatTime(audioDuration)}
                    </span>
                  </div>

                  {/* Mute + Segmented Speed Control */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleMuteAudio}
                      className="p-1.5 rounded-lg text-[#57534E] dark:text-slate-300 hover:bg-[#1C1917]/6 dark:hover:bg-white/8 cursor-pointer transition-colors"
                      title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-[#C41E3A]" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <div className="inline-flex items-center p-0.5 rounded-lg bg-[#1C1917]/6 dark:bg-white/8">
                      {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => changePlaybackRate(rate)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                            playbackRate === rate
                              ? 'bg-[#C41E3A] text-white shadow-2xs'
                              : 'text-[#57534E] dark:text-slate-300 hover:text-[#1C1917] dark:hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Document Sub-Header */}
          <div className="px-4 py-2 bg-[#F7F4EE]/95 dark:bg-[#111722] border-b border-[#1C1917]/8 dark:border-white/10 flex items-center justify-between gap-2 text-xs font-semibold text-[#57534E] dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3.5 h-3.5 text-[#C41E3A] shrink-0" />
              <span className="truncate font-bold text-[#1C1917] dark:text-slate-200">
                {pdfViewMode === 'answer' ? 'File Đáp án & Transcript (答案)' : 'Tài liệu Đề thi HSK (PDF)'}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {exam.answer_pdf_url && attemptResult && (
                <button
                  type="button"
                  onClick={() => setPdfViewMode(pdfViewMode === 'answer' ? 'exam' : 'answer')}
                  className="text-[11px] font-bold text-[#157A57] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {pdfViewMode === 'answer' ? 'Xem lại Đề PDF' : 'Xem Đáp án PDF'}
                </button>
              )}
              {pdfStatus === 'ready' && currentPdfUrl && (
                <a
                  href={currentPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#57534E] dark:text-slate-400 hover:text-[#C41E3A] transition-colors"
                  title="Mở PDF trong tab mới"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới</span>
                </a>
              )}
            </div>
          </div>

          {/* PDF Viewport with Graceful Warm Porcelain Fallback */}
          <div className="flex-1 min-h-0 w-full relative">
            {pdfStatus === 'checking' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <RefreshCw className="w-6 h-6 text-[#C41E3A] animate-spin" />
                <p className="text-xs font-semibold text-[#78716C] dark:text-slate-400">
                  Đang nạp tài liệu PDF...
                </p>
              </div>
            ) : pdfStatus === 'ready' && currentPdfUrl ? (
              <iframe
                src={`${currentPdfUrl}#view=FitH`}
                title="Đề thi PDF"
                className="w-full h-full border-0 absolute inset-0 bg-white"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="relative overflow-hidden max-w-md w-full rounded-[26px] glass-light p-7 sm:p-8 text-center space-y-4">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none select-none absolute -right-2 -bottom-4 font-hanzi-serif font-black text-[104px] leading-none text-[#C41E3A]/[0.06]"
                  >
                    考
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-[#C41E3A]/10 text-[#C41E3A] flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#C41E3A] dark:text-rose-400">
                      {exam.code} · {levelKey.replace('HSK', 'HSK ')}
                    </p>
                    <h3 className="text-base font-display font-extrabold text-[#1C1917] dark:text-white">
                      Chưa có tệp PDF đính kèm cho đề mẫu này
                    </h3>
                    <p className="text-xs text-[#57534E] dark:text-slate-400 leading-relaxed">
                      Bạn vẫn có thể thao tác trực tiếp trên phiếu trả lời {totalCount} câu ở cột bên phải, hoặc tải lại nếu quản trị viên vừa cập nhật file PDF.
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-center gap-2 relative z-10">
                    <button
                      type="button"
                      onClick={() => setPdfRetryTick((n) => n + 1)}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/90 dark:bg-white/10 hover:bg-white border border-[#1C1917]/12 dark:border-white/15 text-xs font-bold text-[#1C1917] dark:text-slate-200 hover:text-[#C41E3A] transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tải lại tài liệu</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── RIGHT PANE (~42%): ANSWER SHEET (UNIFIED WITH HANZI4U TESTPAGE) ── */}
        <section className="w-full lg:w-[42%] flex flex-col flex-1 lg:h-full min-h-0 overflow-hidden bg-[#F5F2EC]/70 dark:bg-[#0d1320]">
          {/* Demo Mode Switcher Bar */}
          {demoMode && (
            <div className="px-4 py-2.5 bg-sky-50/90 dark:bg-sky-950/30 border-b border-sky-200/80 dark:border-sky-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="inline-flex p-0.5 rounded-xl bg-white dark:bg-white/10 border border-sky-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setDemoInteractionMode('test')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    demoInteractionMode === 'test'
                      ? 'bg-[#184375] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Làm thử</span>
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
                  <span>Sửa nhanh</span>
                </button>
              </div>

              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span>
                  Phần này:{' '}
                  <b className="text-[#C41E3A]">
                    {formatPoints(
                      activeSection.questions.reduce((s, q) => s + Number(q.points || 0), 0)
                    )}
                    đ
                  </b>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Tổng đề: <b className="text-[#157A57]">{formatPoints(exam.total_score)}đ</b>
                </span>
              </div>
            </div>
          )}

          {/* Section Navigation Pills */}
          <div className="px-4 py-3 bg-[#FCFBF8]/92 dark:bg-[#111827]/92 border-b border-[#1C1917]/8 dark:border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {exam.sections.map((sec, idx) => {
              const secQuestions = sec.questions;
              const secAnswered = secQuestions.filter(
                (q) => userAnswers[q.id] && userAnswers[q.id].trim() !== ''
              ).length;
              const isActive = activeSectionIdx === idx;

              return (
                <button
                  key={sec.id || idx}
                  type="button"
                  onClick={() => handleSwitchSection(idx)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 border ${
                    isActive
                      ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm shadow-[#C41E3A]/20'
                      : 'bg-white/80 dark:bg-white/6 border-[#1C1917]/10 dark:border-white/10 text-[#57534E] dark:text-slate-300 hover:bg-white hover:text-[#1C1917]'
                  }`}
                >
                  <span>{sec.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#1C1917]/6 dark:bg-white/10 text-[#78716C] dark:text-slate-400'
                    }`}
                  >
                    {secAnswered}/{secQuestions.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Question Quick-Jump Matrix (Matching TestPage CBT Bubbles + Flag Dots) */}
          <div className="px-4 py-3 border-b border-[#1C1917]/8 dark:border-white/10 bg-[#FCFBF8]/65 dark:bg-[#101622]/75 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {activeSection.questions.map((q) => {
                const ans = userAnswers[q.id];
                const isAnswered = ans !== undefined && ans.trim() !== '';
                const isFlagged = Boolean(flagged[q.id]);
                const resFeedback = attemptResult
                  ? attemptResult.answers.find((a) => a.question_id === q.id)
                  : null;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`question-card-${q.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`relative min-w-8 h-8 px-1.5 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      resFeedback
                        ? resFeedback.is_correct
                          ? 'bg-[#157A57] text-white border-[#157A57]'
                          : 'bg-[#C41E3A] text-white border-[#C41E3A]'
                        : isAnswered
                          ? 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/70'
                          : 'bg-white/85 dark:bg-white/6 border-[#1C1917]/10 dark:border-white/10 text-[#57534E] dark:text-slate-300 hover:border-[#C41E3A]/45 hover:text-[#C41E3A]'
                    }`}
                    title={`Câu ${q.question_number}`}
                  >
                    <span>{q.question_number}</span>
                    {resFeedback && (
                      <span className="text-[10px]">{resFeedback.is_correct ? '✓' : '✗'}</span>
                    )}
                    {!resFeedback && isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4A017] ring-2 ring-[#FCFBF8] dark:ring-[#101622]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Instructions Strip */}
          {activeSection.instructions && (
            <div className="px-4 py-2 bg-[#F7F4EE]/90 dark:bg-white/5 border-b border-[#1C1917]/6 dark:border-white/8 text-xs text-[#57534E] dark:text-slate-400 flex items-center gap-2 shrink-0">
              <HelpCircle className="w-3.5 h-3.5 text-[#C41E3A] shrink-0" />
              <span className="leading-snug">{activeSection.instructions}</span>
            </div>
          )}

          {/* Questions Scrollable List */}
          <div ref={questionsContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-3.5">
            {activeSection.questions.map((q) => {
              const selectedAns = userAnswers[q.id] || '';
              const feedback = attemptResult
                ? attemptResult.answers.find((a) => a.question_id === q.id)
                : null;

              const isSubmitted = Boolean(attemptResult);
              const isWrong = feedback && !feedback.is_correct;
              const isCorrect = feedback && feedback.is_correct;
              const isFlagged = Boolean(flagged[q.id]);
              const showInlineTools = demoMode && (demoInteractionMode === 'edit' || isSubmitted);
              const isNotesExpanded = Boolean(expandedNotesMap[q.id]);

              return (
                <div
                  key={q.id}
                  id={`question-card-${q.id}`}
                  className={`p-4 sm:p-5 rounded-[22px] border transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/45 dark:bg-emerald-950/20'
                        : 'border-rose-400/85 dark:border-rose-700/70 bg-rose-50/55 dark:bg-rose-950/25'
                      : q.needsReview && demoMode
                        ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-[#1C1917]/8 dark:border-white/10 bg-[#FCFBF8]/96 dark:bg-[#141c2b]/95 shadow-[0_8px_24px_-18px_rgba(28,25,23,0.18)] hover:border-[#C41E3A]/25'
                  }`}
                >
                  {/* Clean Uncluttered Question Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                          isSubmitted
                            ? isCorrect
                              ? 'bg-[#157A57] text-white'
                              : 'bg-[#C41E3A] text-white'
                            : selectedAns
                              ? 'bg-[#C41E3A]/12 text-[#C41E3A] dark:bg-rose-500/20 dark:text-rose-300'
                              : 'bg-[#1C1917]/6 dark:bg-white/10 text-[#1C1917] dark:text-white'
                        }`}
                      >
                        {q.question_number}
                      </span>

                      <span className="text-sm font-bold text-[#1C1917] dark:text-white truncate">
                        {q.prompt_text || `Câu ${q.question_number}`}
                      </span>

                      {q.needsReview && demoMode && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 shrink-0"
                          title={q.reviewReason || 'Cần kiểm tra lại đáp án từ PDF'}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Cần kiểm tra</span>
                        </span>
                      )}

                      {showInlineTools ? (
                        <div className="inline-flex items-center gap-1 bg-[#C41E3A]/10 px-2 py-0.5 rounded-md border border-[#C41E3A]/20 shrink-0">
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
                            className="w-11 text-center font-black text-[11px] text-[#C41E3A] bg-transparent outline-none"
                          />
                          <span className="text-[10px] font-bold text-[#C41E3A]">đ</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#78716C] dark:text-slate-400 shrink-0 tabular-nums">
                          · {formatPoints(q.points)}đ
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isSubmitted && !demoMode && (
                        <button
                          type="button"
                          onClick={() => toggleFlag(q.id)}
                          title={isFlagged ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu xem lại'}
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isFlagged
                              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300/80 text-amber-700 dark:text-amber-300'
                              : 'bg-transparent border-transparent text-[#A8A29E] hover:text-amber-600 hover:bg-amber-50/60 dark:hover:bg-white/5'
                          }`}
                        >
                          <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                        </button>
                      )}

                      {feedback && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            isCorrect
                              ? 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>+{formatPoints(feedback.earned_score)}đ</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>0/{formatPoints(q.points)}đ</span>
                            </>
                          )}
                        </span>
                      )}

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
                                : 'border-[#1C1917]/10 dark:border-white/10 text-slate-500 hover:text-[#C41E3A]'
                            }`}
                            title="Sửa câu dẫn & giải thích"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {showInlineTools && (
                            <button
                              type="button"
                              onClick={() => handleDemoDeleteQuestion(activeSectionIdx, q.id)}
                              className="p-1.5 rounded-lg border border-[#1C1917]/10 dark:border-white/10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Xóa câu hỏi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Demo Inline Teacher Controls */}
                  {showInlineTools && (
                    <div className="mb-3 p-3 rounded-xl bg-[#F5F2EC] dark:bg-[#0E131F] border border-[#1C1917]/10 dark:border-white/10 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
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

                        {q.question_type === 'TRUE_FALSE' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500">Đáp án:</span>
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
                                      ? 'bg-[#157A57] text-white border-[#157A57]'
                                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
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
                            <span className="text-[11px] font-bold text-slate-500 mr-1">Đáp án:</span>
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
                                      ? 'bg-[#157A57] text-white border-[#157A57]'
                                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

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
                              Câu mẫu tham khảo
                            </label>
                            <input
                              type="text"
                              value={q.sample_answer || ''}
                              onChange={(e) =>
                                handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                                  sample_answer: e.target.value,
                                })
                              }
                              placeholder="Nhập câu mẫu..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a22] text-xs outline-none focus:border-[#C41E3A]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {demoMode && isNotesExpanded && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                          Nội dung câu dẫn
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
                          Giải thích đáp án
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) =>
                            handleDemoUpdateQuestion(activeSectionIdx, q.id, {
                              explanation: e.target.value,
                            })
                          }
                          placeholder="Nhập giải thích chi tiết..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-white/10 bg-white dark:bg-[#141a22] text-xs outline-none focus:border-[#C41E3A]"
                        />
                      </div>
                    </div>
                  )}

                  {/* ── TACTILE ANSWER CONTROLS ────────────────────────────────── */}
                  <div>
                    {/* 1. TRUE_FALSE */}
                    {q.question_type === 'TRUE_FALSE' && (
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { val: 'TRUE', symbol: '✓', label: 'Đúng' },
                          { val: 'FALSE', symbol: '✗', label: 'Sai' },
                        ].map(({ val, symbol, label }) => {
                          const isChosen = selectedAns.toUpperCase() === val;
                          const correctVal = feedback ? (feedback.correct_answer || '').toUpperCase() : '';
                          const isThisCorrect = isSubmitted && correctVal === val;
                          const isThisWrongChoice = isSubmitted && isChosen && !feedback?.is_correct;

                          let btnStyle =
                            'bg-white/90 dark:bg-white/5 border-[#1C1917]/10 dark:border-white/10 text-[#1C1917] dark:text-slate-200 hover:border-[#C41E3A]/45 hover:bg-white';

                          if (isSubmitted) {
                            if (isThisCorrect) {
                              btnStyle = 'bg-[#157A57] text-white border-[#157A57] shadow-sm';
                            } else if (isThisWrongChoice) {
                              btnStyle = 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm';
                            } else {
                              btnStyle = 'bg-white/40 dark:bg-white/5 border-[#1C1917]/6 text-[#A8A29E] opacity-60';
                            }
                          } else if (isChosen) {
                            btnStyle = 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm shadow-[#C41E3A]/20';
                          }

                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectAnswer(q.id, val)}
                              className={`py-2.5 px-4 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-all active:scale-[0.985] cursor-pointer disabled:cursor-default ${btnStyle}`}
                            >
                              <span className="text-base leading-none">{symbol}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. MCQ (ABC / ABCD / ABCDEF) */}
                    {q.question_type.startsWith('MCQ_') && (
                      <div
                        className={`grid gap-2 ${
                          q.question_type === 'MCQ_ABC'
                            ? 'grid-cols-3'
                            : q.question_type === 'MCQ_ABCDEF'
                              ? 'grid-cols-3 sm:grid-cols-6'
                              : 'grid-cols-4'
                        }`}
                      >
                        {(q.options && q.options.length > 0
                          ? q.options
                          : q.question_type === 'MCQ_ABC'
                            ? ['A', 'B', 'C']
                            : q.question_type === 'MCQ_ABCDEF'
                              ? ['A', 'B', 'C', 'D', 'E', 'F']
                              : ['A', 'B', 'C', 'D']
                        ).map((opt) => {
                          const isChosen = selectedAns.toUpperCase() === opt.toUpperCase();
                          const correctVal = feedback
                            ? (feedback.correct_answer || '').toUpperCase()
                            : '';
                          const isThisCorrect = isSubmitted && correctVal === opt.toUpperCase();
                          const isThisWrongChoice = isSubmitted && isChosen && !feedback?.is_correct;

                          let btnStyle =
                            'bg-white/90 dark:bg-white/5 border-[#1C1917]/10 dark:border-white/10 text-[#1C1917] dark:text-slate-200 hover:border-[#C41E3A]/50 hover:bg-white';

                          if (isSubmitted) {
                            if (isThisCorrect) {
                              btnStyle = 'bg-[#157A57] text-white border-[#157A57] shadow-sm';
                            } else if (isThisWrongChoice) {
                              btnStyle = 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm';
                            } else {
                              btnStyle = 'bg-white/40 dark:bg-white/5 border-[#1C1917]/6 text-[#A8A29E] opacity-55';
                            }
                          } else if (isChosen) {
                            btnStyle = 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm shadow-[#C41E3A]/20';
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`py-2.5 rounded-xl font-display font-extrabold text-sm border flex items-center justify-center gap-1 transition-all active:scale-[0.97] cursor-pointer disabled:cursor-default ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isThisWrongChoice && <span className="text-[11px]">✗</span>}
                              {isThisCorrect && <span className="text-[11px]">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. WRITING_FILL */}
                    {q.question_type === 'WRITING_FILL' && (
                      <input
                        type="text"
                        value={selectedAns}
                        disabled={isSubmitted}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                        placeholder="Nhập từ hoặc sắp xếp câu trả lời..."
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                          isSubmitted
                            ? isCorrect
                              ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                            : 'border-[#1C1917]/12 dark:border-white/12 bg-white/90 dark:bg-white/5 focus:bg-white focus:ring-2 focus:ring-[#C41E3A]/25 focus:border-[#C41E3A]'
                        }`}
                      />
                    )}

                    {/* 4. WRITING_ESSAY */}
                    {q.question_type === 'WRITING_ESSAY' && (
                      <div className="space-y-1.5">
                        <textarea
                          rows={3}
                          value={selectedAns}
                          disabled={isSubmitted}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                          placeholder="Nhập câu văn hoặc đoạn văn chữ Hán của bạn..."
                          className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                            isSubmitted
                              ? isCorrect
                                ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                              : 'border-[#1C1917]/12 dark:border-white/12 bg-white/90 dark:bg-white/5 focus:bg-white focus:ring-2 focus:ring-[#C41E3A]/25 focus:border-[#C41E3A]'
                          }`}
                        />
                        <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-slate-400 px-1">
                          <span className="inline-flex items-center gap-1">
                            <PenTool className="w-3 h-3 text-[#C41E3A]" />
                            Đã viết <strong className="text-[#1C1917] dark:text-white">{countHanzi(selectedAns)}</strong> chữ Hán
                          </span>
                          <span>{selectedAns.length} ký tự</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Post-submit Feedback & Explanation */}
                  {feedback && (
                    <div className="mt-3.5 pt-3 border-t border-[#1C1917]/8 dark:border-white/10 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="text-[#57534E] dark:text-slate-400">
                          Bạn chọn:{' '}
                          <strong className={isWrong ? 'text-[#C41E3A] dark:text-rose-400' : 'text-[#157A57] dark:text-emerald-400'}>
                            {feedback.user_answer || '(Bỏ trống)'}
                          </strong>
                        </span>
                        <span className="text-[#57534E] dark:text-slate-400">
                          Đáp án chuẩn:{' '}
                          <strong className="text-[#157A57] dark:text-emerald-400">
                            {feedback.correct_answer || feedback.sample_answer || 'Xem file đáp án PDF'}
                          </strong>
                        </span>
                      </div>

                      {feedback.sample_answer && (
                        <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
                          <strong>Câu mẫu tham khảo:</strong> {feedback.sample_answer}
                        </div>
                      )}

                      {feedback.explanation && (
                        <p className="text-[#57534E] dark:text-slate-400 bg-white/75 dark:bg-white/5 px-3 py-2 rounded-xl border border-[#1C1917]/6 dark:border-white/8">
                          <strong>Giải thích:</strong> {feedback.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {demoMode && (demoInteractionMode === 'edit' || activeSection.questions.length === 0) && (
              <button
                type="button"
                onClick={() => handleDemoAddQuestion(activeSectionIdx)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-[#1C1917]/20 dark:border-white/20 hover:border-[#C41E3A] text-xs font-bold text-[#57534E] dark:text-slate-300 hover:text-[#C41E3A] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu vào {activeSection.title}</span>
              </button>
            )}

            {/* Bottom Section Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2">
              {activeSectionIdx > 0 ? (
                <button
                  type="button"
                  onClick={() => handleSwitchSection(activeSectionIdx - 1)}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/85 dark:bg-white/8 border border-[#1C1917]/12 dark:border-white/12 text-xs font-bold text-[#1C1917] dark:text-slate-200 hover:border-[#C41E3A]/40 hover:text-[#C41E3A] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{exam.sections[activeSectionIdx - 1]?.title}</span>
                </button>
              ) : (
                <span />
              )}

              {activeSectionIdx < exam.sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleSwitchSection(activeSectionIdx + 1)}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer ml-auto"
                >
                  <span>{exam.sections[activeSectionIdx + 1]?.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : !attemptResult && !demoMode ? (
                <ShimmerButton
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmSubmit(true)}
                  size="sm"
                  className="rounded-xl ml-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nộp bài ({answeredCount}/{totalCount})</span>
                </ShimmerButton>
              ) : (
                <button
                  type="button"
                  onClick={() => questionsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/85 dark:bg-white/8 border border-[#1C1917]/12 text-xs font-bold text-[#57534E] dark:text-slate-200 hover:text-[#C41E3A] cursor-pointer ml-auto"
                >
                  <span>↑ Lên đầu danh sách</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── MODAL XÁC NHẬN NỘP BÀI (LIQUID GLASS) ────────────────────────────── */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmSubmit(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-modal w-full max-w-md p-6 sm:p-7 rounded-[28px] space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#D4A017] flex items-center justify-center mx-auto">
                <Send className="w-5 h-5" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-display font-extrabold text-[#1C1917] dark:text-white">
                  Xác nhận nộp bài thi?
                </h3>
                <p className="text-xs text-[#57534E] dark:text-slate-400 leading-relaxed">
                  Bạn đã trả lời <strong>{answeredCount}/{totalCount}</strong> câu hỏi.
                  {totalCount - answeredCount > 0 && (
                    <span className="block text-[#C41E3A] dark:text-rose-400 font-bold mt-1.5">
                      Còn {totalCount - answeredCount} câu chưa chọn đáp án.
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="py-2.5 rounded-xl bg-white/85 dark:bg-white/8 border border-[#1C1917]/12 dark:border-white/12 font-bold text-xs text-[#1C1917] dark:text-slate-200 hover:bg-white cursor-pointer transition-colors"
                >
                  Làm tiếp
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitExam(false)}
                  className="py-2.5 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài ngay'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL XÁC NHẬN RỜI PHÒNG THI (LIQUID GLASS) ──────────────────────── */}
      <AnimatePresence>
        {showConfirmLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmLeave(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-modal w-full max-w-md p-6 sm:p-7 rounded-[28px] space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/12 text-[#C41E3A] flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-display font-extrabold text-[#1C1917] dark:text-white">
                  Rời khỏi phòng thi?
                </h3>
                <p className="text-xs text-[#57534E] dark:text-slate-400 leading-relaxed">
                  Bạn đã làm <strong>{answeredCount}/{totalCount}</strong> câu. Nếu thoát ngay, tiến độ hiện tại sẽ bị hủy.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmLeave(false)}
                  className="py-2.5 rounded-xl bg-white/85 dark:bg-white/8 border border-[#1C1917]/12 dark:border-white/12 font-bold text-xs text-[#1C1917] dark:text-slate-200 hover:bg-white cursor-pointer transition-colors"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearSavedDraft();
                    setShowConfirmLeave(false);
                    onBack ? onBack() : (window.location.hash = '#/exams?mode=mock');
                  }}
                  className="py-2.5 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Rời khỏi phòng thi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentExamSplitScreen;
