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

export const ExamListPage: React.FC = () => {
  const cachedTests = getCached<TestSummary[]>('exams:list');
  const cachedSubs = getCached<any[]>('exams:submissions');

  const [section, setSection] = useState<'MOCK_EXAM' | 'WORKBOOK' | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('HSK1');
  const [tests, setTests] = useState<TestSummary[]>(cachedTests || []);
  const [submissions, setSubmissions] = useState<any[]>(cachedSubs || []);
  const [loading, setLoading] = useState(!cachedTests);

  useEffect(() => {
    const load = async () => {
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sectionTests = section ? tests.filter((t) => t.testType === section) : [];
  const filteredTests = sectionTests.filter(
    (t) => t.level.toUpperCase() === selectedLevel.toUpperCase()
  );

  // Mode Selection View (matching uploaded design: Đề thi HSK + 2 large cards Mô phỏng thi thật & Luyện tập)
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
            onClick={() => setSection('MOCK_EXAM')}
            className="group relative overflow-hidden rounded-[26px] p-7 sm:p-8 text-left bg-white dark:bg-[#141a22] border border-slate-200/90 dark:border-white/10 hover:border-[#C41E3A]/60 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[270px]"
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
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900">
            {section === 'MOCK_EXAM' ? 'Mô phỏng thi thật' : 'Luyện tập'}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setSection(section === 'MOCK_EXAM' ? 'WORKBOOK' : 'MOCK_EXAM')}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-[#C41E3A] hover:bg-primary-50 cursor-pointer"
        >
          Chuyển sang {section === 'MOCK_EXAM' ? 'Luyện tập' : 'Mô phỏng thi thật'}
        </button>
      </div>

      {/* HSK 1–6 Level Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-light w-fit">
        {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const).map((lvl) => {
          const active = selectedLevel === lvl;
          const countInLevel = sectionTests.filter((t) => t.level === lvl).length;
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

      {/* Exam / Workbook Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-3xl glass-card-grid animate-pulse" />
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            Chưa có bộ đề cho {selectedLevel} trong phân khu này.
          </p>
        </GlassCard>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${section}-${selectedLevel}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
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
                        {section === 'MOCK_EXAM'
                          ? `ĐỀ MẪU 0${idx + 1} • ${exam.level.replace('HSK', 'HSK ')}`
                          : `BÀI TẬP 0${idx + 1} • ${exam.level.replace('HSK', 'HSK ')}`}
                      </span>
                      {exam.userBestScore !== null && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            exam.userPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
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
                      <span>{section === 'MOCK_EXAM' ? 'Vào thi' : 'Luyện tập'}</span>
                    </ShimmerButton>
                  </div>
                </SpotlightCard>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Past Submissions History */}
      <div className="space-y-3 pt-2">
        <h3 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-rose-500" />
          <span>Lịch sử làm bài gần đây ({submissions.length})</span>
        </h3>
        {submissions.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500">Bạn chưa hoàn thành bài thi hoặc bài luyện tập nào.</p>
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
                      passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
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
    </div>
  );
};
