import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, resolveMediaUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getCached, setCached } from '../../lib/cache';
import {
  GlassCard,
  SpotlightCard,
  ShimmerButton,
} from '../../components/ui';
import {
  FileText,
  Clock,
  Award,
  Play,
  CheckCircle2,
  XCircle,
  AlarmClock,
  Target,
  ArrowRight,
  ArrowLeft,
  History,
  Headphones,
  FileCheck2,
  Search,
  Settings,
  X,
  ExternalLink,
  MessageSquareText,
  BookOpen,
  PenTool,
  RefreshCw,
} from 'lucide-react';

interface TestSummary {
  testId: number;
  title: string;
  testType: 'MOCK_EXAM' | 'WORKBOOK' | 'QUIZ' | 'CHECKPOINT';
  level: string;
  passingScore: number;
  timeLimitMins: number;
  questionsCount: number;
  skills: string[];
  userBestScore: number | null;
  userAttempts: number;
  userPassed: boolean;
}

interface MockExamItem {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  hsk_level: string;
  exam_pdf_url: string;
  audio_url?: string | null;
  has_answer_pdf: boolean;
  duration_minutes: number;
  total_score: number;
  pass_score: number;
  status: string;
  sections_count: number;
  questions_count: number;
  section_types: string[];
  user_best_score: number | null;
  user_attempts_count: number;
  user_passed: boolean;
}

interface MockExamAttemptSummary {
  id: number;
  exam_id: number;
  exam_code: string;
  exam_title: string;
  hsk_level: string;
  max_score: number;
  listening_score: number;
  reading_score: number;
  writing_score: number;
  total_score: number;
  correct_count: number;
  wrong_count: number;
  is_passed: boolean;
  started_at: string;
  submitted_at: string | null;
}

interface AttemptDetailData {
  attempt_id: number;
  exam_id: number;
  exam_code: string;
  exam_title: string;
  hsk_level: string;
  exam_pdf_url: string;
  audio_url?: string | null;
  answer_pdf_url?: string | null;
  listening_score: number;
  reading_score: number;
  writing_score: number;
  total_score: number;
  max_score: number;
  pass_score: number;
  is_passed: boolean;
  correct_count: number;
  wrong_count: number;
  started_at: string;
  submitted_at: string | null;
  answers: Array<{
    question_id: number;
    question_number: number;
    section_id: number;
    section_type: string;
    question_type: string;
    prompt_text?: string | null;
    user_answer?: string | null;
    correct_answer?: string | null;
    sample_answer?: string | null;
    explanation?: string | null;
    is_correct: boolean;
    earned_score: number;
    max_points: number;
    teacher_feedback?: string | null;
  }>;
}

const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const;

const LEVEL_GRADIENTS: Record<string, string> = {
  HSK1: 'from-[#D97706] to-[#B45309]',
  HSK2: 'from-[#157A57] to-[#116145]',
  HSK3: 'from-[#D95B18] to-[#B4460E]',
  HSK4: 'from-[#C41E3A] to-[#9E162E]',
  HSK5: 'from-[#184375] to-[#12325A]',
  HSK6: 'from-[#5A1063] to-[#430B4A]',
};

const SKILL_VI: Record<string, string> = {
  LISTENING: 'Nghe hiểu',
  READING: 'Đọc hiểu',
  GRAMMAR: 'Ngữ pháp',
  VOCABULARY: 'Từ vựng',
  PINYIN: 'Pinyin',
  TONE: 'Thanh điệu',
  WRITING: 'Viết',
};

function readModeFromHash(fallback: 'MOCK_EXAM' | 'WORKBOOK' | null): 'MOCK_EXAM' | 'WORKBOOK' | null {
  if (typeof window === 'undefined') return fallback;
  const raw = window.location.hash || '';
  if (!raw.includes('?')) return fallback;
  const mode = new URLSearchParams(raw.split('?')[1]).get('mode')?.toLowerCase();
  if (mode === 'mock' || mode === 'mock_exam') return 'MOCK_EXAM';
  if (mode === 'workbook' || mode === 'practice') return 'WORKBOOK';
  return fallback;
}

function readLevelFromHash(): string {
  if (typeof window === 'undefined') return 'HSK1';
  const raw = window.location.hash || '';
  if (!raw.includes('?')) return 'HSK1';
  const lvl = new URLSearchParams(raw.split('?')[1]).get('level')?.toUpperCase().replace(/\s+/g, '');
  if (lvl && (HSK_LEVELS as readonly string[]).includes(lvl)) return lvl;
  return 'HSK1';
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatScore(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '0';
  const n = Number(val);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

export const ExamListPage: React.FC<{ initialMode?: 'MOCK_EXAM' | 'WORKBOOK' | null }> = ({
  initialMode = null,
}) => {
  const { user } = useAuth();
  const isTeacherOrAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'CONTENT_EDITOR' ||
    (user?.role as string) === 'TEACHER';

  const cachedMockExams = getCached<MockExamItem[]>('exams:mock-pdf-list');
  const cachedTests = getCached<TestSummary[]>('exams:list');
  const cachedSubs = getCached<any[]>('exams:submissions');

  const [section, setSection] = useState<'MOCK_EXAM' | 'WORKBOOK' | null>(() =>
    readModeFromHash(initialMode)
  );
  const [selectedLevel, setSelectedLevel] = useState<string>(readLevelFromHash);
  const [searchQuery, setSearchQuery] = useState('');

  const [mockExams, setMockExams] = useState<MockExamItem[]>(cachedMockExams || []);
  const [mockAttempts, setMockAttempts] = useState<MockExamAttemptSummary[]>([]);
  const [tests, setTests] = useState<TestSummary[]>(cachedTests || []);
  const [submissions, setSubmissions] = useState<any[]>(cachedSubs || []);
  const [loading, setLoading] = useState(!cachedMockExams && !cachedTests);
  const [refreshing, setRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Interactive Attempt Detail Review Modal (powered by GET /exams/attempts/:attemptId)
  const [attemptModalOpen, setAttemptModalOpen] = useState(false);
  const [attemptModalLoading, setAttemptModalLoading] = useState(false);
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetailData | null>(null);
  const [attemptFilter, setAttemptFilter] = useState<'ALL' | 'WRONG' | 'LISTENING' | 'READING' | 'WRITING'>('ALL');

  // Sync mode/level when navigating via hash links (#/exams vs #/exams?mode=mock)
  useEffect(() => {
    const syncFromHash = () => {
      const nextMode = readModeFromHash(initialMode);
      setSection(nextMode);
      const raw = window.location.hash || '';
      if (raw.includes('level=')) {
        setSelectedLevel(readLevelFromHash());
      }
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [initialMode]);

  const loadAllExamData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [pdfMockList, allTests, subs] = await Promise.all([
        api.get<MockExamItem[]>('/exams').catch(() => []),
        api.get<TestSummary[]>('/assessment/tests').catch(() => []),
        api.get<any[]>('/assessment/submissions').catch(() => []),
      ]);

      const mList = Array.isArray(pdfMockList) ? pdfMockList : [];
      const tList = Array.isArray(allTests) ? allTests : [];
      const sList = Array.isArray(subs) ? subs : [];

      setCached('exams:mock-pdf-list', mList);
      setCached('exams:list', tList);
      setCached('exams:submissions', sList);
      setMockExams(mList);
      setTests(tList);
      setSubmissions(sList);

      // Load real attempt breakdowns (Listening / Reading / Writing) for mock exams the student has attempted
      const attemptedExams = mList.filter((ex) => ex.user_attempts_count > 0).slice(0, 10);
      if (attemptedExams.length > 0) {
        const attemptGroups = await Promise.all(
          attemptedExams.map(async (ex) => {
            const list = await api.get<any[]>(`/exams/${ex.id}/my-attempts`).catch(() => []);
            if (!Array.isArray(list)) return [];
            return list.map(
              (att): MockExamAttemptSummary => ({
                id: att.id,
                exam_id: ex.id,
                exam_code: ex.code,
                exam_title: ex.title,
                hsk_level: ex.hsk_level,
                max_score: ex.total_score || 100,
                listening_score: Number(att.listening_score || 0),
                reading_score: Number(att.reading_score || 0),
                writing_score: Number(att.writing_score || 0),
                total_score: Number(att.total_score || 0),
                correct_count: Number(att.correct_count || 0),
                wrong_count: Number(att.wrong_count || 0),
                is_passed: Boolean(att.is_passed),
                started_at: att.started_at,
                submitted_at: att.submitted_at,
              })
            );
          })
        );
        const flatAttempts = attemptGroups
          .flat()
          .sort(
            (a, b) =>
              new Date(b.submitted_at || b.started_at).getTime() -
              new Date(a.submitted_at || a.started_at).getTime()
          );
        setMockAttempts(flatAttempts);
      } else {
        setMockAttempts([]);
      }
    } finally {
      setLoading(false);
      if (showSpinner) {
        setRefreshing(false);
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 1600);
      }
    }
  }, []);

  useEffect(() => {
    loadAllExamData();
  }, [loadAllExamData]);

  // Close Attempt Detail Modal on Escape
  useEffect(() => {
    if (!attemptModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAttemptModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attemptModalOpen]);

  const openAttemptDetail = async (attemptId: number) => {
    setAttemptModalOpen(true);
    setAttemptModalLoading(true);
    setAttemptDetail(null);
    setAttemptFilter('ALL');
    try {
      const detail = await api.get<AttemptDetailData>(`/exams/attempts/${attemptId}`);
      setAttemptDetail(detail);
    } catch (err) {
      console.error('Failed to load mock exam attempt detail:', err);
    } finally {
      setAttemptModalLoading(false);
    }
  };

  const openLatestAttemptForExam = async (examId: number) => {
    const existing = mockAttempts.find((a) => a.exam_id === examId);
    if (existing) {
      openAttemptDetail(existing.id);
      return;
    }
    try {
      const list = await api.get<any[]>(`/exams/${examId}/my-attempts`);
      if (Array.isArray(list) && list.length > 0) {
        openAttemptDetail(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch exam attempts:', err);
    }
  };

  const legacyMockTests = useMemo(
    () => tests.filter((t) => t.testType === 'MOCK_EXAM'),
    [tests]
  );
  const workbookTests = useMemo(
    () => tests.filter((t) => t.testType === 'WORKBOOK'),
    [tests]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPdfMockExams = useMemo(() => {
    return mockExams.filter((ex) => {
      if ((ex.hsk_level || '').toUpperCase() !== selectedLevel.toUpperCase()) return false;
      if (!normalizedQuery) return true;
      return (
        ex.title.toLowerCase().includes(normalizedQuery) ||
        ex.code.toLowerCase().includes(normalizedQuery) ||
        (ex.description || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [mockExams, selectedLevel, normalizedQuery]);

  const filteredLegacyTests = useMemo(() => {
    const base = section === 'MOCK_EXAM' ? legacyMockTests : workbookTests;
    return base.filter((t) => {
      if (t.level.toUpperCase() !== selectedLevel.toUpperCase()) return false;
      if (!normalizedQuery) return true;
      return t.title.toLowerCase().includes(normalizedQuery);
    });
  }, [section, legacyMockTests, workbookTests, selectedLevel, normalizedQuery]);

  const getLevelCount = (lvl: string) => {
    const upper = lvl.toUpperCase();
    if (section === 'MOCK_EXAM') {
      const pdfCount = mockExams.filter((ex) => (ex.hsk_level || '').toUpperCase() === upper).length;
      const legacyCount = legacyMockTests.filter((t) => t.level.toUpperCase() === upper).length;
      return pdfCount + legacyCount;
    }
    return workbookTests.filter((t) => t.level.toUpperCase() === upper).length;
  };

  const enterSection = (next: 'MOCK_EXAM' | 'WORKBOOK' | null) => {
    setSection(next);
    setSearchQuery('');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 1: MODE SELECTION VIEW (Restored Signature 2-Card Local Layout)
  // ══════════════════════════════════════════════════════════════════════════
  if (!section) {
    return (
      <div className="max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
              Đề thi HSK
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Chọn chế độ làm bài trước khi vào kho đề. Bạn có thể đổi chế độ bất cứ lúc nào.
            </p>
          </div>

          {isTeacherOrAdmin && (
            <a
              href="#/teacher/exams"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-light hover:bg-white border border-slate-200/80 dark:border-white/15 text-xs font-extrabold text-[#C41E3A] dark:text-rose-300 shadow-xs transition-all self-start sm:self-auto shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span>Quản lý &amp; bóc tách đề PDF</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Mô phỏng thi thật */}
          <button
            type="button"
            onClick={() => enterSection('MOCK_EXAM')}
            className="group relative overflow-hidden rounded-[26px] p-7 sm:p-8 text-left bg-white dark:bg-[#141a22] border border-slate-200/90 dark:border-white/10 hover:border-[#C41E3A]/60 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[276px]"
          >
            {/* Top-right decorative corner arc */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-bl-[72px] bg-[#C41E3A]/[0.08] dark:bg-[#C41E3A]/[0.16] transition-transform duration-300 group-hover:scale-105"
            />
            {/* Bottom-right watermark glyph 考 */}
            <span
              aria-hidden="true"
              className="pointer-events-none select-none absolute right-5 bottom-2 font-hanzi-serif font-black text-[96px] leading-none text-[#C41E3A]/[0.08] dark:text-[#C41E3A]/[0.15]"
            >
              考
            </span>

            <div className="relative z-10 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#C41E3A] text-white flex items-center justify-center shadow-[0_4px_0_#8A1228]">
                <AlarmClock className="w-6 h-6" />
              </div>

              <div className="space-y-2.5">
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white">
                  Mô phỏng thi thật
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                  Đây là bản mô phỏng sát nhất với phòng thi thật: làm bài chia đôi màn hình cùng đề chuẩn, file nghe và đồng hồ đếm ngược, tự chấm điểm tách kỹ năng ngay sau khi nộp.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#C41E3A] group-hover:gap-3 transition-all">
              <span>Vào kho đề</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Card 2: Luyện tập */}
          <button
            type="button"
            onClick={() => enterSection('WORKBOOK')}
            className="group relative overflow-hidden rounded-[26px] p-7 sm:p-8 text-left bg-white dark:bg-[#141a22] border border-slate-200/90 dark:border-white/10 hover:border-[#C41E3A]/60 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[276px]"
          >
            {/* Top-right decorative corner arc */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-bl-[72px] bg-[#C41E3A]/[0.08] dark:bg-[#C41E3A]/[0.16] transition-transform duration-300 group-hover:scale-105"
            />
            {/* Bottom-right watermark glyph 练 */}
            <span
              aria-hidden="true"
              className="pointer-events-none select-none absolute right-5 bottom-2 font-hanzi-serif font-black text-[96px] leading-none text-[#C41E3A]/[0.08] dark:text-[#C41E3A]/[0.15]"
            >
              练
            </span>

            <div className="relative z-10 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-[#C41E3A] text-white flex items-center justify-center shadow-[0_4px_0_#8A1228]">
                <Target className="w-6 h-6" />
              </div>

              <div className="space-y-2.5">
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white">
                  Luyện tập
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                  Học từng bước với hướng dẫn đi kèm. Luyện riêng theo phần hoặc dạng bài bạn muốn, xem ngay đáp án và lời thoại sau khi làm xong.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#C41E3A] group-hover:gap-3 transition-all">
              <span>Vào kho đề</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 2: EXAM REPOSITORY (Restored Local Design + Upgraded Backend Data)
  // ══════════════════════════════════════════════════════════════════════════
  const isMockSection = section === 'MOCK_EXAM';
  const totalVisibleInLevel =
    (isMockSection ? filteredPdfMockExams.length : 0) + filteredLegacyTests.length;

  const filteredModalAnswers = (attemptDetail?.answers || []).filter((ans) => {
    if (attemptFilter === 'ALL') return true;
    if (attemptFilter === 'WRONG') return !ans.is_correct;
    return (ans.section_type || '').toUpperCase() === attemptFilter;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Compact Header with Back / Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => enterSection(null)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full glass-light border border-[#1C1917]/10 dark:border-white/12 text-xs font-bold text-slate-700 hover:text-[#C41E3A] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Đổi chế độ</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900">
            {isMockSection ? 'Mô phỏng thi thật' : 'Luyện tập'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isTeacherOrAdmin && (
            <a
              href="#/teacher/exams"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full glass-light border border-[#1C1917]/10 dark:border-white/12 text-xs font-bold text-slate-700 hover:text-[#C41E3A] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Quản lý đề</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => loadAllExamData(true)}
            disabled={refreshing}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full glass-light border text-xs font-bold transition-all cursor-pointer disabled:opacity-65 ${
              justRefreshed
                ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300 bg-emerald-50/75 dark:bg-emerald-950/35'
                : 'border-[#1C1917]/10 dark:border-white/12 text-slate-600 hover:text-[#1C1917] hover:bg-white'
            }`}
          >
            {justRefreshed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Đã cập nhật</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#C41E3A]' : ''}`} />
                <span>{refreshing ? 'Đang tải...' : 'Tải lại'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => enterSection(isMockSection ? 'WORKBOOK' : 'MOCK_EXAM')}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full glass-light border border-[#C41E3A]/20 dark:border-rose-400/25 text-xs font-bold text-[#C41E3A] dark:text-rose-300 hover:bg-[#C41E3A]/8 dark:hover:bg-rose-950/35 cursor-pointer transition-colors"
          >
            <span>Chuyển sang {isMockSection ? 'Luyện tập' : 'Mô phỏng thi thật'}</span>
          </button>
        </div>
      </div>

      {/* HSK 1–6 Level Pills + Quick Code/Title Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-light w-fit">
          {HSK_LEVELS.map((lvl) => {
            const active = selectedLevel === lvl;
            const countInLevel = getLevelCount(lvl);
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
                  active ? 'text-white' : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="exam-level-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${LEVEL_GRADIENTS[lvl]} shadow-sm`}
                  />
                )}
                <span className="relative z-10">
                  {lvl.replace('HSK', 'HSK ')}{' '}
                  <span className={active ? 'opacity-90' : 'opacity-50'}>({countInLevel})</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isMockSection ? 'Tìm mã đề (H11332) hoặc tên...' : 'Tìm tên bài luyện tập...'}
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl glass-light text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/35"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Xóa từ khóa"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Exam / Workbook Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-3xl glass-card-grid animate-pulse" />
          ))}
        </div>
      ) : totalVisibleInLevel === 0 ? (
        <GlassCard className="p-12 text-center space-y-2.5">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {searchQuery
              ? `Không tìm thấy đề phù hợp với "${searchQuery}" ở cấp độ ${selectedLevel.replace('HSK', 'HSK ')}.`
              : `Chưa có bộ đề cho ${selectedLevel.replace('HSK', 'HSK ')} trong phân khu này.`}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-[#C41E3A] hover:underline cursor-pointer"
            >
              Hiển thị tất cả đề {selectedLevel.replace('HSK', 'HSK ')}
            </button>
          )}
        </GlassCard>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${section}-${selectedLevel}-${normalizedQuery}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: refreshing ? 0.55 : 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Real Mock Exams from /api/v1/exams — Clean uncluttered local card anatomy */}
            {isMockSection &&
              filteredPdfMockExams.map((ex) => {
                const lvlKey = (ex.hsk_level || 'HSK1').toUpperCase();
                const lvlGrad = LEVEL_GRADIENTS[lvlKey] || LEVEL_GRADIENTS.HSK1;
                const uniqueSkills = Array.from(new Set(ex.section_types || []));

                return (
                  <SpotlightCard
                    key={`pdf-mock-${ex.id}`}
                    className="p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${lvlGrad}`}
                        >
                          {ex.code} • {lvlKey.replace('HSK', 'HSK ')}
                        </span>

                        {ex.user_best_score !== null && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                              ex.user_passed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            }`}
                          >
                            Cao nhất: {formatScore(ex.user_best_score)}/{formatScore(ex.total_score)}đ
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-display font-bold text-slate-900 leading-snug">
                        {ex.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {uniqueSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2.5 py-0.5 rounded-md bg-white/80 border border-white text-[10px] font-bold text-slate-600"
                          >
                            {SKILL_VI[sk] || sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/75 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          {ex.duration_minutes} phút
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {ex.questions_count || 40} câu • Đạt ≥{formatScore(ex.pass_score)}/{formatScore(ex.total_score)}đ
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ex.user_attempts_count > 0 && (
                          <button
                            type="button"
                            onClick={() => openLatestAttemptForExam(ex.id)}
                            title="Xem lại kết quả lần thi gần nhất"
                            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 dark:border-white/15 text-[11px] font-bold text-slate-600 hover:text-[#C41E3A] transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>{ex.user_attempts_count}</span>
                          </button>
                        )}

                        <ShimmerButton href={`#/mock-exam/${ex.id}`} size="sm" className="rounded-xl">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Vào thi</span>
                        </ShimmerButton>
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}

            {/* Interactive Assessment Tests (Workbooks & Legacy Mock Tests) */}
            {filteredLegacyTests.map((exam, idx) => {
              const lvlGrad = LEVEL_GRADIENTS[exam.level] || LEVEL_GRADIENTS.HSK1;
              return (
                <SpotlightCard
                  key={`test-${exam.testId}`}
                  className="p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${lvlGrad}`}
                      >
                        {isMockSection
                          ? `ĐỀ MẪU 0${idx + 1} • ${exam.level.replace('HSK', 'HSK ')}`
                          : `BÀI TẬP 0${idx + 1} • ${exam.level.replace('HSK', 'HSK ')}`}
                      </span>
                      {exam.userBestScore !== null && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            exam.userPassed
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          Cao nhất: {Math.round(exam.userBestScore)}%
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-display font-bold text-slate-900 leading-snug">
                      {exam.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {exam.skills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-0.5 rounded-md bg-white/80 border border-white text-[10px] font-bold text-slate-600"
                        >
                          {SKILL_VI[sk] || sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/75 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        {exam.timeLimitMins} phút
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {exam.questionsCount} câu • Đạt ≥{exam.passingScore}%
                      </span>
                    </div>

                    <ShimmerButton href={`#/test/${exam.testId}`} size="sm" className="rounded-xl shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isMockSection ? 'Vào thi' : 'Luyện tập'}</span>
                    </ShimmerButton>
                  </div>
                </SpotlightCard>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Unified Past History (Real MockExam Attempts with Nghe/Đọc/Viết + Legacy Assessment Submissions) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-[#C41E3A]" />
          <span>
            Lịch sử làm bài gần đây ({(isMockSection ? mockAttempts.length : 0) + submissions.length})
          </span>
        </h3>

        {(isMockSection ? mockAttempts.length : 0) + submissions.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500">Bạn chưa hoàn thành bài thi hoặc bài luyện tập nào.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Real PDF+Audio Mock Exam Attempts (click to inspect Nghe/Đọc/Viết & unlocked PDF answer) */}
            {isMockSection &&
              mockAttempts.slice(0, 8).map((att) => (
                <button
                  key={`mock-att-${att.id}`}
                  type="button"
                  onClick={() => openAttemptDetail(att.id)}
                  className="glass-light glass-light-hover rounded-2xl p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        att.is_passed ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-extrabold text-slate-900 truncate">
                        [{att.exam_code}] {att.exam_title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        <span>Nghe {formatScore(att.listening_score)}</span>
                        <span>•</span>
                        <span>Đọc {formatScore(att.reading_score)}</span>
                        {att.writing_score > 0 && (
                          <>
                            <span>•</span>
                            <span>Viết {formatScore(att.writing_score)}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {formatDateTime(att.submitted_at || att.started_at)} · Bấm để xem chi tiết &amp; đáp án
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-sm font-black shrink-0 tabular-nums ${
                      att.is_passed
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}
                  >
                    {formatScore(att.total_score)}/{formatScore(att.max_score)}
                  </span>
                </button>
              ))}

            {/* Existing Assessment Submissions */}
            {submissions.slice(0, 8).map((sub: any) => {
              const id = sub.submissionId || sub.id;
              const score = Math.round(sub.scorePercent ?? sub.score ?? 0);
              const passed = sub.isPassed ?? score >= 60;
              return (
                <a
                  key={`sub-${id}`}
                  href={`#/test-result/${id}`}
                  className="glass-light glass-light-hover rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${passed ? 'text-emerald-500' : 'text-amber-500'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">
                        {sub.test?.title || sub.testTitle || `Bài kiểm tra #${id}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {passed ? 'Đạt yêu cầu' : 'Cần ôn thêm'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-sm font-black shrink-0 ${
                      passed
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}
                  >
                    {score}%
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Mock Exam Attempt Detail Modal (Nghe/Đọc/Viết + Unlocked PDF Answer + Teacher Feedback) */}
      <AnimatePresence>
        {attemptModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAttemptModalOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-modal rounded-[28px] max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C41E3A]/10 text-[#C41E3A] dark:text-rose-300 text-[11px] font-black">
                      {attemptDetail ? `${attemptDetail.exam_code} • ${attemptDetail.hsk_level.replace('HSK', 'HSK ')}` : 'Kết quả bài thi'}
                    </span>
                    {attemptDetail && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          attemptDetail.is_passed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {attemptDetail.is_passed ? 'Đã đạt' : 'Chưa đạt'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-display font-extrabold text-slate-900 truncate mt-1">
                    {attemptDetail?.exam_title || 'Đang tải chi tiết bài làm...'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setAttemptModalOpen(false)}
                  aria-label="Đóng"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                {attemptModalLoading ? (
                  <div className="space-y-3">
                    <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
                    <div className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
                  </div>
                ) : !attemptDetail ? (
                  <p className="text-center text-sm text-slate-500 py-8">
                    Không thể tải dữ liệu chi tiết của lượt thi này.
                  </p>
                ) : (
                  <>
                    {/* Summary Score Banner + Skill Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#C41E3A]/8 border border-[#C41E3A]/20">
                        <span className="text-[11px] font-semibold text-slate-500">Tổng điểm</span>
                        <p className="text-xl font-black text-[#C41E3A] dark:text-rose-400 mt-0.5 tabular-nums">
                          {formatScore(attemptDetail.total_score)}/{formatScore(attemptDetail.max_score)}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Đúng {attemptDetail.correct_count} · Sai {attemptDetail.wrong_count}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10">
                        <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1">
                          <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                          Nghe hiểu
                        </span>
                        <p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">
                          {formatScore(attemptDetail.listening_score)}đ
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10">
                        <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          Đọc hiểu
                        </span>
                        <p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">
                          {formatScore(attemptDetail.reading_score)}đ
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10">
                        <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1">
                          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                          Phần viết
                        </span>
                        <p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">
                          {formatScore(attemptDetail.writing_score)}đ
                        </p>
                      </div>
                    </div>

                    {/* Unlocked PDF Documents */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {attemptDetail.exam_pdf_url && (
                        <a
                          href={resolveMediaUrl(attemptDetail.exam_pdf_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-700 hover:text-[#C41E3A] transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Xem file Đề PDF</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}

                      {attemptDetail.answer_pdf_url && (
                        <a
                          href={resolveMediaUrl(attemptDetail.answer_pdf_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/45 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-colors"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Mở file Đáp án &amp; Transcript PDF</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}
                    </div>

                    {/* Filter Pills for Detailed Answers */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: 'ALL', label: `Tất cả (${attemptDetail.answers.length})` },
                          { id: 'WRONG', label: `Câu sai (${attemptDetail.wrong_count})` },
                          { id: 'LISTENING', label: 'Nghe hiểu' },
                          { id: 'READING', label: 'Đọc hiểu' },
                          { id: 'WRITING', label: 'Viết' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setAttemptFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            attemptFilter === tab.id
                              ? 'bg-[#C41E3A] text-white'
                              : 'bg-white/75 dark:bg-slate-800 text-slate-600 hover:bg-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Detailed Question Review List */}
                    <div className="space-y-2.5">
                      {filteredModalAnswers.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">
                          Không có câu hỏi nào trong mục lọc này.
                        </p>
                      ) : (
                        filteredModalAnswers.map((q) => (
                          <div
                            key={q.question_id}
                            className={`p-3.5 rounded-2xl border space-y-1.5 ${
                              q.is_correct
                                ? 'bg-emerald-50/45 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50'
                                : 'bg-rose-50/45 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-800/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {q.is_correct ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                                <span className="text-xs font-extrabold text-slate-900">
                                  Câu {q.question_number}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-slate-500">
                                  {SKILL_VI[q.section_type] || q.section_type}
                                </span>
                              </div>
                              <span className="text-xs font-bold tabular-nums text-slate-700">
                                +{formatScore(q.earned_score)}/{formatScore(q.max_points)}đ
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pl-6">
                              <span className="text-slate-600">
                                Bạn chọn:{' '}
                                <strong className={q.is_correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                                  {q.user_answer || '(Bỏ trống)'}
                                </strong>
                              </span>
                              {(q.correct_answer || q.sample_answer) && (
                                <span className="text-slate-600">
                                  Đáp án chuẩn:{' '}
                                  <strong className="text-emerald-700 dark:text-emerald-300">
                                    {q.correct_answer || q.sample_answer}
                                  </strong>
                                </span>
                              )}
                            </div>

                            {q.explanation && (
                              <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                                Giải thích: {q.explanation}
                              </p>
                            )}

                            {q.teacher_feedback && (
                              <div className="ml-6 mt-1 p-2.5 rounded-xl bg-amber-50/85 dark:bg-amber-950/35 border border-amber-200/70 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                                <MessageSquareText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                                <span>
                                  <strong>Nhận xét giáo viên:</strong> {q.teacher_feedback}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              {attemptDetail && (
                <div className="px-6 py-3.5 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Nộp lúc {formatDateTime(attemptDetail.submitted_at || attemptDetail.started_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAttemptModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      Đóng
                    </button>
                    <ShimmerButton
                      href={`#/mock-exam/${attemptDetail.exam_id}`}
                      onClick={() => setAttemptModalOpen(false)}
                      size="sm"
                      className="rounded-xl"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Thi lại đề này</span>
                    </ShimmerButton>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
