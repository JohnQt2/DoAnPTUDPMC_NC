import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { getCached, setCached } from '../../lib/cache';
import {
  GlassCard,
  SpotlightCard,
  ShimmerButton,
  NumberTicker,
} from '../../components/ui';
import {
  FileText,
  Clock,
  Award,
  Play,
  CheckCircle2,
  Trophy,
  BookOpenCheck,
  Sparkles,
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
  HSK1: 'from-emerald-400 to-teal-400',
  HSK2: 'from-sky-400 to-indigo-400',
  HSK3: 'from-amber-400 to-orange-400',
  HSK4: 'from-rose-400 to-pink-400',
  HSK5: 'from-violet-400 to-purple-400',
  HSK6: 'from-fuchsia-400 to-amber-400',
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

  const [section, setSection] = useState<'MOCK_EXAM' | 'WORKBOOK'>('MOCK_EXAM');
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

  const sectionTests = tests.filter((t) => t.testType === section);
  const filteredTests = sectionTests.filter(
    (t) => t.level.toUpperCase() === selectedLevel.toUpperCase()
  );

  const mockCount = tests.filter((t) => t.testType === 'MOCK_EXAM').length;
  const workbookCount = tests.filter((t) => t.testType === 'WORKBOOK').length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-7">
      {/* iPhone Optical Liquid Glass Exam Hero */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 ios-hero-glass bg-gradient-to-br from-rose-200/32 via-white/18 to-sky-200/32">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/75 border border-white text-xs font-extrabold uppercase tracking-wider text-rose-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Trung tâm Đề thi & Sách bài tập HSK 1–6
            </span>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
              Phòng Thi Mô Phỏng & Sách Bài Tập HSK
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Gồm <strong className="text-slate-800">5 đề thi mẫu cho mỗi cấp độ HSK 1–6</strong> và{' '}
              <strong className="text-slate-800">bộ bài tập bám sát Sách bài tập Giáo trình chuẩn HSK</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/70 border border-white/95 text-center shadow-sm">
              <p className="text-2xl font-display font-black text-rose-600">
                <NumberTicker value={mockCount} />
              </p>
              <p className="text-[11px] font-bold text-slate-600">Đề thi mô phỏng</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/70 border border-white/95 text-center shadow-sm">
              <p className="text-2xl font-display font-black text-indigo-600">
                <NumberTicker value={workbookCount} />
              </p>
              <p className="text-[11px] font-bold text-slate-600">Bộ Sách bài tập</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Part Pastel Switcher: Phòng thi mô phỏng vs Luyện tập Sách bài tập */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => setSection('MOCK_EXAM')}
          className={`relative p-5 rounded-[26px] text-left border-2 transition-[background,border-color,box-shadow] duration-200 cursor-pointer overflow-hidden ${
            section === 'MOCK_EXAM'
              ? 'bg-gradient-to-br from-rose-100/95 via-pink-50/95 to-amber-100/90 border-rose-300/90 text-slate-900 shadow-lg shadow-rose-200/40'
              : 'glass-light hover:bg-white/85 border-white/80 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                section === 'MOCK_EXAM'
                  ? 'bg-gradient-to-tr from-rose-400 to-amber-300 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-500'
              }`}
            >
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                Phần 1 • Đề thi mẫu HSK
              </span>
              <h2 className="text-lg font-display font-extrabold text-slate-900">
                Phòng thi mô phỏng
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                5 đề thi mẫu chuẩn cho mỗi cấp HSK 1–6 (tổng {mockCount} đề)
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSection('WORKBOOK')}
          className={`relative p-5 rounded-[26px] text-left border-2 transition-[background,border-color,box-shadow] duration-200 cursor-pointer overflow-hidden ${
            section === 'WORKBOOK'
              ? 'bg-gradient-to-br from-indigo-100/95 via-violet-50/95 to-sky-100/90 border-indigo-300/90 text-slate-900 shadow-lg shadow-indigo-200/40'
              : 'glass-light hover:bg-white/85 border-white/80 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                section === 'WORKBOOK'
                  ? 'bg-gradient-to-tr from-indigo-400 to-sky-400 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-500'
              }`}
            >
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                Phần 2 • Giáo trình chuẩn HSK
              </span>
              <h2 className="text-lg font-display font-extrabold text-slate-900">
                Luyện tập Sách bài tập
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Bài tập chuyên đề bám sát Sách bài tập HSK 1–6
              </p>
            </div>
          </div>
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
                active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
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
