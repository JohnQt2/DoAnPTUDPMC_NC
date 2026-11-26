import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
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
  AlarmClock,
  Target,
  ArrowRight,
  ArrowLeft,
  History,
  RotateCcw,
  Sparkles,
  BookOpen,
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

interface PracticeCollectionStudentItem {
  id: number;
  code: string;
  levelCode: string;
  levelName: string;
  category: string;
  titleZh: string;
  titlePinyin?: string | null;
  titleVi: string;
  description?: string | null;
  orderIndex: number;
  currentVersionId: number;
  currentVersionNumber: number;
  exerciseSetsCount: number;
  totalQuestions: number;
  totalScore: number;
  estimatedMinutes: number;
  skills: string[];
  userStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  bestScore: number | null;
}

interface StudentPracticeHistoryItem {
  attemptId: number;
  exerciseSetId: number;
  exerciseSetTitle: string;
  skill: string;
  collectionId: number | null;
  collectionTitle: string;
  levelCode: string;
  category: string;
  versionNumber: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED';
  earnedScore: number;
  totalScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  startedAt: string;
  submittedAt?: string | null;
}

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
  HANZI: 'Chữ Hán',
};

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'WORKBOOK_LESSON', label: 'Theo bài học' },
  { key: 'SKILL_PRACTICE', label: 'Theo kỹ năng' },
  { key: 'MIXED_PRACTICE', label: 'Tổng hợp' },
  { key: 'MOCK_EXAM', label: 'Mô phỏng' },
  { key: 'REAL_EXAM_SIMULATION', label: 'Thi thật' },
] as const;

interface ExamListPageProps {
  initialTab?: 'MOCK_EXAM' | 'WORKBOOK';
}

export const ExamListPage: React.FC<ExamListPageProps> = ({ initialTab }) => {
  const cachedTests = getCached<TestSummary[]>('exams:list');
  const cachedSubs = getCached<any[]>('exams:submissions');

  const [section, setSection] = useState<'MOCK_EXAM' | 'WORKBOOK' | null>(
    initialTab ?? null
  );
  const [selectedLevel, setSelectedLevel] = useState<string>('HSK1');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Data for Assessment Mock Exam mode
  const [tests, setTests] = useState<TestSummary[]>(cachedTests || []);
  const [submissions, setSubmissions] = useState<any[]>(cachedSubs || []);

  // Data for Workbook / Practice Collection mode
  const [collections, setCollections] = useState<PracticeCollectionStudentItem[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<StudentPracticeHistoryItem[]>([]);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(!cachedTests);

  useEffect(() => {
    setSection(initialTab ?? null);
  }, [initialTab]);

  // Load Mock Exam data
  useEffect(() => {
    const loadMock = async () => {
      try {
        const [allTests, subs] = await Promise.all([
          api.get<TestSummary[]>('/assessment/tests').catch(() => []),
          api.get<any[]>('/assessment/submissions').catch(() => []),
        ]);
        const tList = Array.isArray(allTests) ? allTests : [];
        const sList = Array.isArray(subs) ? subs : [];
        setCached('exams:list', tList);
        setCached('exams:submissions', sList);
        setTests(tList);
        setSubmissions(sList);
      } catch {
        // silent
      }
    };
    loadMock();
  }, []);

  // Load Practice Collections & History when in WORKBOOK mode or for counters
  useEffect(() => {
    const loadPracticeData = async () => {
      try {
        setLoading(true);
        // Load collections for current selected level and category
        const catQuery = selectedCategory !== 'ALL' ? `&category=${selectedCategory}` : '';
        const [colRes, historyRes, allColRes] = await Promise.all([
          api.get<{ items: PracticeCollectionStudentItem[] }>(
            `/practice/collections?levelCode=${selectedLevel}${catQuery}&limit=100`
          ).catch(() => ({ items: [] })),
          api.get<{ items: StudentPracticeHistoryItem[] }>(
            '/practice/history?limit=20'
          ).catch(() => ({ items: [] })),
          api.get<{ items: PracticeCollectionStudentItem[] }>(
            '/practice/collections?limit=500'
          ).catch(() => ({ items: [] })),
        ]);

        const colItems = colRes?.items || [];
        setCollections(colItems);
        setPracticeHistory(historyRes?.items || []);

        // Count per level
        const counts: Record<string, number> = {
          HSK1: 0, HSK2: 0, HSK3: 0, HSK4: 0, HSK5: 0, HSK6: 0,
        };
        (allColRes?.items || []).forEach((c) => {
          const lvl = c.levelCode?.toUpperCase();
          if (counts[lvl] !== undefined) {
            counts[lvl]++;
          }
        });
        setLevelCounts(counts);
      } finally {
        setLoading(false);
      }
    };

    if (section === 'WORKBOOK') {
      loadPracticeData();
    } else {
      setLoading(false);
    }
  }, [section, selectedLevel, selectedCategory]);

  const sectionTests = section ? tests.filter((t) => t.testType === section) : [];
  const filteredTests = sectionTests.filter(
    (t) => t.level.toUpperCase() === selectedLevel.toUpperCase()
  );

  // In-progress collections for "Tiếp tục làm"
  const inProgressCollections = collections.filter((c) => c.userStatus === 'IN_PROGRESS');

  // Mode Selection View
  if (!section) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Đề thi HSK
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Chọn chế độ làm bài trước khi vào kho đề. Bạn có thể đổi chế độ bất cứ lúc nào.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Mô phỏng thi thật */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/mock-exams';
            }}
            className="group relative overflow-hidden rounded-[26px] p-7 sm:p-8 text-left bg-white dark:bg-[#141a22] border border-slate-200/90 dark:border-white/10 hover:border-[#C41E3A]/60 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[270px]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-bl-[72px] bg-[#C41E3A]/[0.08] dark:bg-[#C41E3A]/[0.16] transition-transform duration-300 group-hover:scale-105"
            />
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
                  Đây là bản mô phỏng sát nhất với phòng thi thật: cùng giao diện tiếng Trung, cùng cách tính giờ, cùng quy tắc không được quay lại phần trước — để bạn thi thử với đúng áp lực như thi thật.
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
            onClick={() => setSection('WORKBOOK')}
            className="group relative overflow-hidden rounded-[26px] p-7 sm:p-8 text-left bg-white dark:bg-[#141a22] border border-slate-200/90 dark:border-white/10 hover:border-[#C41E3A]/60 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[270px]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-bl-[72px] bg-[#C41E3A]/[0.08] dark:bg-[#C41E3A]/[0.16] transition-transform duration-300 group-hover:scale-105"
            />
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Compact Header with Back / Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSection(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-light text-xs font-bold text-slate-700 hover:text-[#C41E3A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Đổi chế độ</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white">
            {section === 'MOCK_EXAM' ? 'Mô phỏng thi thật' : 'Luyện tập Sách bài tập & Bộ đề'}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setSection(section === 'MOCK_EXAM' ? 'WORKBOOK' : 'MOCK_EXAM')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-[#C41E3A] hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
        >
          Chuyển sang {section === 'MOCK_EXAM' ? 'Luyện tập' : 'Mô phỏng thi thật'}
        </button>
      </div>

      {/* HSK 1–6 Level Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-light w-fit">
        {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const).map((lvl) => {
          const active = selectedLevel === lvl;
          const countInLevel = section === 'WORKBOOK'
            ? (levelCounts[lvl] ?? 0)
            : sectionTests.filter((t) => t.level === lvl).length;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${active ? 'text-white' : 'text-[#57534E] hover:text-[#1C1917]'
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

      {/* Categories Filter (Only in WORKBOOK mode) */}
      {section === 'WORKBOOK' && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${active
                  ? 'bg-[#C41E3A] text-white shadow-sm'
                  : 'glass-light text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Khu vực "Tiếp tục làm" (chỉ khi có attempt IN_PROGRESS trong WORKBOOK mode) */}
      {section === 'WORKBOOK' && inProgressCollections.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Tiếp tục làm bài
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inProgressCollections.map((col) => (
              <a
                key={`inprogress-${col.id}`}
                href={`#/practice/collections/${col.id}`}
                className="p-4 rounded-2xl border-2 border-amber-300/80 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400 transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">
                    Đang làm dở
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {col.titleVi}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{col.titleZh}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Tiếp tục
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: MOCK_EXAM vs WORKBOOK collections */}
      {section === 'MOCK_EXAM' ? (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-3xl glass-card-grid animate-pulse" />
            ))}
          </div>
        ) : filteredTests.length === 0 ? (
          <GlassCard className="p-12 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Chưa có bộ đề mô phỏng cho {selectedLevel}.
            </p>
          </GlassCard>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`MOCK-${selectedLevel}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredTests.map((exam, idx) => {
                const lvlGrad = LEVEL_GRADIENTS[exam.level] || LEVEL_GRADIENTS.HSK1;
                return (
                  <SpotlightCard
                    key={exam.testId}
                    className="p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${lvlGrad}`}
                        >
                          {`ĐỀ MẪU 0${idx + 1} • ${exam.level.replace('HSK', 'HSK ')}`}
                        </span>
                        {exam.userBestScore !== null && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${exam.userPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            Cao nhất: {Math.round(exam.userBestScore)}%
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-display font-bold text-slate-900 dark:text-white leading-snug">
                        {exam.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {exam.skills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-white/10 border border-white/20 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                          >
                            {SKILL_VI[sk] || sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/75 dark:border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">
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
                        <span>Vào thi</span>
                      </ShimmerButton>
                    </div>
                  </SpotlightCard>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )
      ) : (
        // WORKBOOK Mode: Published Practice Collections
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-3xl glass-card-grid animate-pulse" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <GlassCard className="p-12 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Chưa có bộ bài luyện nào cho {selectedLevel} theo bộ lọc này.
            </p>
          </GlassCard>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`WORKBOOK-${selectedLevel}-${selectedCategory}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {collections.map((col, idx) => {
                const lvlGrad = LEVEL_GRADIENTS[col.levelCode] || LEVEL_GRADIENTS.HSK1;
                return (
                  <SpotlightCard
                    key={col.id}
                    className="p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${lvlGrad}`}
                        >
                          {`BÀI TẬP 0${idx + 1} • ${col.levelCode.replace('HSK', 'HSK ')}`}
                        </span>
                        {col.bestScore !== null && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                            Điểm cao nhất: {col.bestScore}
                          </span>
                        )}
                        {col.userStatus === 'IN_PROGRESS' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
                            Đang làm dở
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-display font-bold text-slate-900 dark:text-white leading-snug">
                          {col.titleVi}
                        </h3>
                        <p className="text-xs font-hanzi text-slate-500">
                          {col.titleZh}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {col.exerciseSetsCount} phần
                        </span>
                        {col.skills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-white/10 border border-white/20 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                          >
                            {SKILL_VI[sk] || sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/75 dark:border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          ~{col.estimatedMinutes} phút
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {col.totalQuestions} câu • {col.totalScore}đ
                        </span>
                      </div>

                      <ShimmerButton
                        href={`#/practice/collections/${col.id}`}
                        size="sm"
                        className="rounded-xl shrink-0"
                      >
                        {col.userStatus === 'IN_PROGRESS' ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Tiếp tục</span>
                          </>
                        ) : col.userStatus === 'COMPLETED' ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Xem lại</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Vào luyện</span>
                          </>
                        )}
                      </ShimmerButton>
                    </div>
                  </SpotlightCard>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )
      )}

      {/* Lịch sử làm bài (riêng biệt cho Mock Exam vs Practice) */}
      <div className="space-y-3 pt-4">
        <h3 className="text-base font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-rose-500" />
          <span>
            {section === 'MOCK_EXAM'
              ? `Lịch sử thi mô phỏng (${submissions.length})`
              : `Lịch sử luyện tập bài tập (${practiceHistory.length})`}
          </span>
        </h3>

        {section === 'MOCK_EXAM' ? (
          submissions.length === 0 ? (
            <GlassCard className="p-8 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">Bạn chưa hoàn thành bài thi mô phỏng nào.</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {submissions.slice(0, 8).map((sub: any) => {
                const id = sub.submissionId || sub.id;
                const score = Math.round(sub.scorePercent ?? sub.score ?? 0);
                const passed = sub.isPassed ?? score >= 60;
                return (
                  <a
                    key={id}
                    href={`#/test-result/${id}`}
                    className="glass-light glass-light-hover rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 ${passed ? 'text-emerald-500' : 'text-amber-500'}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {sub.test?.title || sub.testTitle || `Bài kiểm tra #${id}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {passed ? 'Đạt yêu cầu' : 'Cần ôn thêm'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-xl text-sm font-black shrink-0 ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                    >
                      {score}%
                    </span>
                  </a>
                );
              })}
            </div>
          )
        ) : (
          practiceHistory.length === 0 ? (
            <GlassCard className="p-8 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">Bạn chưa hoàn thành bài luyện tập nào.</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {practiceHistory.slice(0, 8).map((hist) => {
                const passed = hist.percentage >= 60;
                return (
                  <a
                    key={hist.attemptId}
                    href={`#/practice/results/${hist.attemptId}`}
                    className="glass-light glass-light-hover rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 ${passed ? 'text-emerald-500' : 'text-amber-500'}`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {hist.levelCode}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            v{hist.versionNumber}
                          </span>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {hist.collectionTitle}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {hist.exerciseSetTitle} ({hist.skill})
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`px-3 py-1 rounded-xl text-sm font-black inline-block ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                      >
                        {hist.percentage}%
                      </span>
                      <p className="text-[10px] text-slate-400 pt-0.5">
                        {hist.earnedScore}/{hist.totalScore}đ
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};
