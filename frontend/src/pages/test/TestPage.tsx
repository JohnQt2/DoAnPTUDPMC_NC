import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { appConfirm, appNotice } from '../../lib/dialog';
import { GlassCard, BorderBeam, ShimmerButton } from '../../components/ui';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileQuestion,
  Volume2,
  Play,
  Pause,
  Flag,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface ExamSection {
  key: 'LISTENING' | 'READING' | 'WRITING';
  index: number;
  viName: string;
  zhName: string;
  subtitle: string;
  durationSecs: number;
  startGlobalIdx: number;
  questions: Array<{ question: any; globalIdx: number }>;
}

const LISTENING_SKILLS = new Set(['LISTENING', 'PINYIN', 'TONE']);
const WRITING_SKILLS = new Set(['WRITING']);

function buildExamSections(questions: any[], totalTimeMins: number): ExamSection[] {
  const listening: Array<{ question: any; globalIdx: number }> = [];
  const reading: Array<{ question: any; globalIdx: number }> = [];
  const writing: Array<{ question: any; globalIdx: number }> = [];

  questions.forEach((q, idx) => {
    const skill = String(q.skillCategory || '').toUpperCase();
    if (LISTENING_SKILLS.has(skill)) {
      listening.push({ question: q, globalIdx: idx });
    } else if (WRITING_SKILLS.has(skill)) {
      writing.push({ question: q, globalIdx: idx });
    } else {
      reading.push({ question: q, globalIdx: idx });
    }
  });

  const raw: Array<{
    key: ExamSection['key'];
    viName: string;
    zhName: string;
    subtitle: string;
    items: Array<{ question: any; globalIdx: number }>;
  }> = [];

  if (listening.length > 0) {
    raw.push({
      key: 'LISTENING',
      viName: 'Nghe',
      zhName: '听力理解',
      subtitle: 'Nghe hiểu · 听力理解',
      items: listening,
    });
  }
  if (reading.length > 0) {
    raw.push({
      key: 'READING',
      viName: 'Đọc',
      zhName: '阅读理解',
      subtitle: 'Đọc hiểu · 阅读理解',
      items: reading,
    });
  }
  if (writing.length > 0) {
    raw.push({
      key: 'WRITING',
      viName: 'Viết',
      zhName: '书写',
      subtitle: 'Viết · 书写',
      items: writing,
    });
  }

  if (raw.length === 0 && questions.length > 0) {
    raw.push({
      key: 'READING',
      viName: 'Đọc',
      zhName: '阅读理解',
      subtitle: 'Đọc hiểu · 阅读理解',
      items: questions.map((question, globalIdx) => ({ question, globalIdx })),
    });
  }

  const totalQ = Math.max(1, questions.length);
  const totalSecs = Math.max(60, totalTimeMins * 60);
  let cursor = 0;

  return raw.map((sec, idx) => {
    const reindexed = sec.items.map((entry, localI) => ({
      question: entry.question,
      globalIdx: cursor + localI,
    }));
    const startGlobalIdx = cursor;
    cursor += reindexed.length;
    const share = Math.max(60, Math.round((reindexed.length / totalQ) * totalSecs));
    return {
      key: sec.key,
      index: idx + 1,
      viName: sec.viName,
      zhName: sec.zhName,
      subtitle: sec.subtitle,
      durationSecs: share,
      startGlobalIdx,
      questions: reindexed,
    };
  });
}

export const TestPage: React.FC<{ testId: number }> = ({ testId }) => {
  const { user } = useAuth();
  const [testSession, setTestSession] = useState<any>(null);
  const [testPreview, setTestPreview] = useState<any>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [lockedSections, setLockedSections] = useState<Record<number, boolean>>({});
  const [currentLocalIdx, setCurrentLocalIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [totalTimeLeft, setTotalTimeLeft] = useState(900);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(900);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Audio bar state (Hanpeak-style listening bar)
  const [volume, setVolume] = useState(80);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const [idempotencyKey] = useState(
    () => 'idem_' + Math.random().toString(36).substring(2) + Date.now()
  );
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    api
      .get<any>(`/assessment/tests/${testId}`)
      .then((data) => setTestPreview(data))
      .catch(() => null);
  }, [testId]);

  const sections = useMemo(() => {
    if (!testSession?.questions) return [];
    return buildExamSections(testSession.questions, testSession.timeLimitMins || 30);
  }, [testSession]);

  const isMockStrict = (testSession?.testType || testPreview?.testType) === 'MOCK_EXAM';
  const activeSection = sections[activeSectionIdx] || sections[0] || null;
  const activeEntry = activeSection?.questions[currentLocalIdx] || activeSection?.questions[0] || null;
  const currentQuestion = activeEntry?.question || null;
  const totalQuestionsCount = testSession?.questions?.length || 0;
  const answeredCount = Object.values(answers).filter((v) => String(v || '').trim() !== '').length;

  // Group current section questions into sub-parts of 5 (MUST stay above early return!)
  const subParts = useMemo(() => {
    if (!activeSection) return [];
    const groups: Array<{
      partNo: number;
      from: number;
      to: number;
      items: Array<{ question: any; globalIdx: number; localIdx: number }>;
    }> = [];
    const chunkSize = 5;
    for (let i = 0; i < activeSection.questions.length; i += chunkSize) {
      const slice = activeSection.questions.slice(i, i + chunkSize).map((item, offset) => ({
        ...item,
        localIdx: i + offset,
      }));
      groups.push({
        partNo: Math.floor(i / chunkSize) + 1,
        from: slice[0].globalIdx + 1,
        to: slice[slice.length - 1].globalIdx + 1,
        items: slice,
      });
    }
    return groups;
  }, [activeSection]);

  // Cleanup speech / audio on unmount or question change
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
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  useEffect(() => {
    stopAudio();
    return () => stopAudio();
  }, [currentQuestion?.questionId, activeSectionIdx]);

  // Dual Timer countdown (Phần hiện tại & Toàn bài)
  useEffect(() => {
    if (!hasStarted) return;
    if (totalTimeLeft <= 0) {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmitTest(true);
      }
      return;
    }
    const timer = window.setInterval(() => {
      setTotalTimeLeft((t) => Math.max(0, t - 1));
      setSectionTimeLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasStarted, totalTimeLeft]);

  const handleStartTest = async () => {
    try {
      const session = await api.post<any>(`/assessment/tests/${testId}/start`);
      const built = buildExamSections(session.questions || [], session.timeLimitMins || 30);
      setTestSession(session);
      setActiveSectionIdx(0);
      setLockedSections({});
      setCurrentLocalIdx(0);
      setTotalTimeLeft((session.timeLimitMins || 30) * 60);
      setSectionTimeLeft(built[0]?.durationSecs || (session.timeLimitMins || 30) * 60);
      autoSubmittedRef.current = false;
      setHasStarted(true);
    } catch (err: any) {
      appNotice(err.message || 'Không thể bắt đầu phiên làm bài.', 'error');
    }
  };

  const handleSelectOption = (questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const toggleFlag = (questionId: number) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleAdvanceOrSubmitSection = async () => {
    if (!activeSection) return;
    const isLastSection = activeSectionIdx >= sections.length - 1;
    if (isLastSection) {
      await handleSubmitTest(false);
      return;
    }

    const nextSec = sections[activeSectionIdx + 1];
    const ok = await appConfirm({
      title: `Nộp phần ${activeSection.viName}?`,
      message: isMockStrict
        ? `Sau khi chuyển sang phần ${nextSec.viName}, bạn sẽ không thể quay lại phần ${activeSection.viName}. Xác nhận chuyển phần?`
        : `Bạn muốn chuyển sang phần ${nextSec.viName} · ${nextSec.zhName} ngay bây giờ?`,
      confirmLabel: `Sang phần ${nextSec.viName}`,
      cancelLabel: 'Ở lại',
    });
    if (!ok) return;

    stopAudio();
    if (isMockStrict) {
      setLockedSections((prev) => ({ ...prev, [activeSectionIdx]: true }));
    }
    setActiveSectionIdx(activeSectionIdx + 1);
    setCurrentLocalIdx(0);
    setSectionTimeLeft(nextSec.durationSecs);
  };

  const handleSwitchSection = (secIdx: number) => {
    if (secIdx === activeSectionIdx) return;
    if (isMockStrict) {
      if (lockedSections[secIdx] || secIdx > activeSectionIdx) return;
    }
    stopAudio();
    setActiveSectionIdx(secIdx);
    setCurrentLocalIdx(0);
    setSectionTimeLeft(sections[secIdx]?.durationSecs || 600);
  };

  const handleSubmitTest = async (skipConfirm = false) => {
    if (!testSession || isSubmitting) return;
    if (!skipConfirm) {
      const ok = await appConfirm({
        title: 'Nộp bài thi HSK?',
        message:
          answeredCount < totalQuestionsCount
            ? `Bạn đã trả lời ${answeredCount}/${totalQuestionsCount} câu. Xác nhận nộp bài ngay để chấm điểm?`
            : 'Bạn đã hoàn thành toàn bộ câu hỏi. Xác nhận nộp bài để xem kết quả ngay?',
        confirmLabel: 'Nộp bài ngay',
        cancelLabel: 'Làm tiếp',
      });
      if (!ok) return;
    }

    stopAudio();
    setIsSubmitting(true);
    try {
      const answersPayload = Object.entries(answers)
        .filter(([, val]) => String(val || '').trim() !== '')
        .map(([qId, ans]) => ({
          question_id: parseInt(qId, 10),
          user_answer: ans,
        }));

      const totalSecs = (testSession.timeLimitMins || 30) * 60;
      const result = await api.post<any>(
        `/assessment/tests/${testId}/submit`,
        {
          session_token: testSession.sessionToken,
          duration_seconds: Math.max(1, totalSecs - totalTimeLeft),
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

  const handleToggleAudio = (question: any) => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    const audioUrl = question.audioUrl || question.mediaUrl;
    if (audioUrl && /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(audioUrl)) {
      const audio = new Audio(audioUrl);
      audio.volume = volume / 100;
      audioRef.current = audio;
      setIsPlayingAudio(true);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress(Math.min(100, Math.round((audio.currentTime / audio.duration) * 100)));
        }
      };
      audio.onended = () => stopAudio();
      audio.onerror = () => stopAudio();
      audio.play().catch(() => stopAudio());
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const raw = String(question.content || '');
    const quoted = raw.match(/"([^"]+)"|“([^”]+)”/);
    const spoken = quoted ? quoted[1] || quoted[2] : raw;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    utterance.volume = volume / 100;

    setIsPlayingAudio(true);
    setAudioProgress(8);
    progressTimerRef.current = window.setInterval(() => {
      setAudioProgress((p) => (p >= 92 ? 92 : p + 7));
    }, 220);

    utterance.onend = () => {
      setAudioProgress(100);
      window.setTimeout(() => stopAudio(), 250);
    };
    utterance.onerror = () => stopAudio();
    window.speechSynthesis.speak(utterance);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  // Pre-start confirmation card
  if (!hasStarted) {
    return (
      <div className="max-w-xl mx-auto py-14 px-4">
        <GlassCard className="p-8 text-center space-y-6 relative overflow-hidden">
          <BorderBeam duration={7} colorFrom="#C41E3A" colorTo="#D4A017" />
          <div className="w-16 h-16 rounded-2xl bg-[#C41E3A] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#C41E3A]/25">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-[#C41E3A] text-xs font-black uppercase">
              {testPreview?.testType === 'WORKBOOK' ? 'Luyện tập HSK' : 'Mô phỏng thi thật HSK'}
            </span>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 leading-snug">
              {testPreview?.title || 'Phòng Thi HSK'}
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              Phòng thi chia rõ từng phần Nghe – Đọc – Viết, bấm giờ độc lập và chấm điểm tự động kèm đáp án chi tiết.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/60 border border-white/85 text-center">
            <div>
              <span className="text-[11px] font-semibold text-gray-400">Số câu hỏi</span>
              <p className="font-black text-gray-900 text-lg mt-0.5">
                {testPreview?.questionsCount ?? '—'} câu
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400">Thời gian</span>
              <p className="font-black text-[#C41E3A] text-lg mt-0.5">
                {testPreview?.timeLimitMins ?? 30} phút
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
              <span>Vào phòng thi ngay</span>
            </ShimmerButton>
            <a
              href="#/exams"
              className="inline-block text-xs font-bold text-gray-500 hover:text-[#C41E3A] pt-1"
            >
              ← Quay lại kho đề thi
            </a>
          </div>
        </GlassCard>
      </div>
    );
  }

  const currentSubPart = subParts.find((sp) =>
    sp.items.some((it) => it.localIdx === currentLocalIdx)
  );
  const isListeningSection = activeSection?.key === 'LISTENING';
  const isWritingQuestion =
    activeSection?.key === 'WRITING' ||
    !currentQuestion?.options ||
    currentQuestion.options.length === 0;
  const isLastSection = activeSectionIdx >= sections.length - 1;
  const isLastInSection = activeSection
    ? currentLocalIdx >= activeSection.questions.length - 1
    : true;

  return (
    <div className="min-h-[calc(100vh-1rem)] flex flex-col bg-[#faf7f7] dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100">
      {/* ── TOP EXAM HEADER (Matching Image 3) ── */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-white/95 dark:bg-[#10161e]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <a
            href="#/exams"
            title="Rời phòng thi"
            className="w-9 h-9 rounded-full bg-[#C41E3A] text-white flex items-center justify-center shrink-0 hover:bg-[#A51730] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-display font-extrabold text-slate-900 dark:text-white truncate">
              {testSession?.title || 'Phòng thi HSK'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {activeSection?.subtitle || 'Đề thi HSK'}
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
            onClick={handleAdvanceOrSubmitSection}
            className="px-5 py-2.5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#C41E3A]/25 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSubmitting
              ? 'Đang chấm...'
              : isLastSection
                ? 'Nộp bài thi'
                : `Nộp phần ${activeSection?.viName}`}
          </button>
        </div>
      </header>

      {/* ── MAIN BODY: LEFT STAGE + RIGHT SIDEBAR (Images 2 & 3) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT EXAM QUESTION STAGE */}
        <section className="lg:col-span-8 xl:col-span-9 p-5 sm:p-8 lg:p-10 flex flex-col justify-between">
          {currentQuestion && activeEntry && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.questionId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="max-w-3xl w-full mx-auto space-y-6"
              >
                {/* Question Title Row: Câu 1 · Phần 1 · câu 1–5 */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white">
                    Câu {activeEntry.globalIdx + 1}
                  </h2>
                  {currentSubPart && (
                    <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Phần {currentSubPart.partNo} · câu {currentSubPart.from}–{currentSubPart.to}
                    </span>
                  )}
                </div>

                {/* Listening Audio Player Bar (Image 3) */}
                {isListeningSection && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#141c26] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-wrap sm:flex-nowrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleAudio(currentQuestion)}
                      aria-label={isPlayingAudio ? 'Tạm dừng' : 'Phát âm thanh'}
                      className="w-10 h-10 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-[140px] space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C41E3A] transition-all duration-200"
                          style={{ width: `${Math.max(audioProgress, isPlayingAudio ? 10 : 4)}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {isPlayingAudio ? 'Đang phát câu hỏi...' : 'Nghe đoạn ghi âm'}
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
                <div className="p-6 rounded-2xl bg-white dark:bg-[#141c26] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                      {currentQuestion.content}
                    </p>
                    {!isListeningSection && (
                      <button
                        type="button"
                        onClick={() => handleToggleAudio(currentQuestion)}
                        title="Nghe đọc tiếng Trung"
                        className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-white/10 text-[#C41E3A] hover:bg-[#C41E3A] hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Answer Area: Writing Textarea OR Option Cards (A/B/C/D) */}
                {isWritingQuestion ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Phần trả lời viết (书写)
                    </label>
                    <textarea
                      rows={5}
                      value={answers[currentQuestion.questionId] || ''}
                      onChange={(e) =>
                        handleSelectOption(currentQuestion.questionId, e.target.value)
                      }
                      placeholder="Nhập câu trả lời bằng chữ Hán hoặc Pinyin của bạn..."
                      className="w-full p-4 rounded-2xl bg-white dark:bg-[#141c26] border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] text-base font-chinese text-slate-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div
                    className={`grid gap-3.5 ${
                      currentQuestion.options.length === 3
                        ? 'grid-cols-1 sm:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {currentQuestion.options.map((opt: any, optIdx: number) => {
                      let letter = String.fromCharCode(65 + optIdx);
                      const optText =
                        typeof opt === 'string' ? opt : opt.text || opt.content || String(opt);
                      const optImage = typeof opt === 'object' ? opt.imageUrl || opt.image : null;
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
                          className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 ${
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
                              {letter}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#C41E3A]" />
                            )}
                          </div>

                          {optImage ? (
                            <img
                              src={optImage}
                              alt={optText}
                              className="w-full h-36 object-contain rounded-xl bg-white/80"
                            />
                          ) : null}

                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {optText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Action Controls: Câu trước | Đánh dấu | Câu tiếp -> (Exact Image 3 order) */}
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
                    onClick={() => toggleFlag(currentQuestion.questionId)}
                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border font-bold text-sm transition-colors cursor-pointer ${
                      flagged[currentQuestion.questionId]
                        ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-[#18202c] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    <span>{flagged[currentQuestion.questionId] ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
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
                      onClick={handleAdvanceOrSubmitSection}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white font-bold text-sm shadow-md shadow-[#C41E3A]/25 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span>
                        {isLastSection ? 'Nộp bài thi' : `Nộp phần ${activeSection?.viName}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {/* RIGHT SIDEBAR PANEL (Exact Image 2 & Image 3 structure) */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-[#10161e] border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-white/10 p-5 space-y-5">
          {/* Dual Timers: Phần hiện tại & Toàn bài */}
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

          {/* Section Stepper (Nghe / Đọc / Viết) */}
          <div className="space-y-2.5">
            {sections.map((sec, idx) => {
              const isActive = idx === activeSectionIdx;
              const isLockedPast = !!lockedSections[idx];
              const isLockedFuture = isMockStrict && idx > activeSectionIdx;
              const rangeLabel = `${sec.startGlobalIdx + 1}–${
                sec.startGlobalIdx + sec.questions.length
              }`;
              const mins = Math.max(1, Math.round(sec.durationSecs / 60));

              return (
                <button
                  key={sec.key}
                  type="button"
                  disabled={isLockedPast || isLockedFuture}
                  onClick={() => handleSwitchSection(idx)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-primary-50/70 dark:bg-[#C41E3A]/15 border-[#C41E3A] shadow-sm'
                      : 'bg-slate-50/80 dark:bg-[#141c26]/70 border-slate-200/80 dark:border-white/10 opacity-75'
                  } ${isLockedPast || isLockedFuture ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-100'}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive
                        ? 'bg-[#C41E3A] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isLockedPast ? <Lock className="w-3.5 h-3.5" /> : sec.index}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {sec.viName}{' '}
                      <span className="font-chinese font-medium text-slate-500 dark:text-slate-400">
                        · {sec.zhName}
                      </span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {rangeLabel} · {mins} phút
                      {isLockedPast ? ' · đã khóa' : isLockedFuture ? ' · chưa mở' : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Question Grid (Bảng câu hỏi grouped in 5s — Image 2 & 3) */}
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
                      const qid = entry.question.questionId;
                      const isCur = entry.localIdx === currentLocalIdx;
                      const isAns = String(answers[qid] || '').trim() !== '';
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
                          {entry.globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend (Chưa làm / Đã trả lời / Đánh dấu) */}
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
