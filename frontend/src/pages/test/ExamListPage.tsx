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
    <div className="max-w-5xl mx-auto py-8 px-5 sm:px-8 space-y-6">
      {/* Crisp Architectural Header Card */}
      <div className="rounded-2xl p-6 sm:p-7 ios-hero-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#BE123C] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Trung tâm Đề thi & Sách bài tập HSK 1–6
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight">
              Phòng Thi Mô Phỏng & Sách Bài Tập HSK
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Gồm <strong className="text-zinc-900 font-semibold">5 đề thi mẫu cho mỗi cấp độ HSK 1–6</strong> và{' '}
              <strong className="text-zinc-900 font-semibold">bộ bài tập bám sát Sách bài tập Giáo trình chuẩn HSK</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
              <p className="text-2xl font-display font-bold text-zinc-950 tabular-nums">
                <NumberTicker value={mockCount} />
              </p>
              <p className="text-[11px] font-medium text-zinc-500">Đề thi mô phỏng</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
              <p className="text-2xl font-display font-bold text-zinc-950 tabular-nums">
                <NumberTicker value={workbookCount} />
              </p>
              <p className="text-[11px] font-medium text-zinc-500">Bộ Sách bài tập</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Part Mode Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => setSection('MOCK_EXAM')}
          className={`p-5 rounded-2xl text-left border transition-colors duration-150 cursor-pointer ${
            section === 'MOCK_EXAM'
              ? 'bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-xs'
              : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                section === 'MOCK_EXAM'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#BE123C]">
                Phần 1 · Đề thi mẫu HSK
              </span>
              <h2 className="text-base font-display font-bold text-zinc-950">
                Phòng thi mô phỏng
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                5 đề thi mẫu chuẩn cho mỗi cấp HSK 1–6 (tổng {mockCount} đề)
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSection('WORKBOOK')}
          className={`p-5 rounded-2xl text-left border transition-colors duration-150 cursor-pointer ${
            section === 'WORKBOOK'
              ? 'bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-xs'
              : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                section === 'WORKBOOK'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                Phần 2 · Giáo trình chuẩn HSK
              </span>
              <h2 className="text-base font-display font-bold text-zinc-950">
                Luyện tập Sách bài tập
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Bài tập chuyên đề bám sát Sách bài tập HSK 1–6
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* HSK 1–6 Level Segmented Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 w-fit">
        {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const).map((lvl) => {
          const active = selectedLevel === lvl;
          const countInLevel = sectionTests.filter((t) => t.level === lvl).length;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                active ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="exam-level-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                  className="absolute inset-0 rounded-lg bg-zinc-900 shadow-xs"
                />
              )}
              <span className="relative z-10">
                {lvl.replace('HSK', 'HSK ')}{' '}
                <span className={active ? 'text-zinc-300' : 'text-zinc-400'}>({countInLevel})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Exam / Workbook Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl glass-card-grid animate-pulse" />
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-2">
          <FileText className="w-9 h-9 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-700">
            Chưa có bộ đề cho {selectedLevel} trong phân khu này.
          </p>
        </GlassCard>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${section}-${selectedLevel}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filteredTests.map((exam, idx) => (
              <SpotlightCard
                key={exam.testId}
                className="p-5 sm:p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold text-zinc-800 bg-zinc-100 border border-zinc-200">
                      {section === 'MOCK_EXAM'
                        ? `ĐỀ MẪU 0${idx + 1} · ${exam.level.replace('HSK', 'HSK ')}`
                        : `BÀI TẬP 0${idx + 1} · ${exam.level.replace('HSK', 'HSK ')}`}
                    </span>
                    {exam.userBestScore !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${
                          exam.userPassed
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        Cao nhất: {Math.round(exam.userBestScore)}%
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-display font-semibold text-zinc-950 leading-snug">
                    {exam.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {exam.skills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 text-[10px] font-medium text-zinc-600"
                      >
                        {SKILL_VI[sk] || sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {exam.timeLimitMins} phút
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-zinc-400" />
                      {exam.questionsCount} câu · Đạt ≥{exam.passingScore}%
                    </span>
                  </div>

                  <ShimmerButton href={`#/test/${exam.testId}`} size="sm" className="shrink-0">
                    <Play className="w-3 h-3 fill-current" />
                    <span>{section === 'MOCK_EXAM' ? 'Vào thi' : 'Luyện tập'}</span>
                  </ShimmerButton>
                </div>
              </SpotlightCard>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Past Submissions History */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-mono uppercase tracking-[0.14em] font-semibold text-zinc-500 flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-500" />
          <span>Lịch sử làm bài gần đây ({submissions.length})</span>
        </h3>
        {submissions.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-sm text-zinc-500">Bạn chưa hoàn thành bài thi hoặc bài luyện tập nào.</p>
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
                  className="glass-light glass-light-hover rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${passed ? 'text-emerald-600' : 'text-amber-600'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-950 truncate">
                        {sub.test?.title || sub.testTitle || `Bài kiểm tra #${id}`}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {passed ? 'Đạt yêu cầu' : 'Cần ôn thêm'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border shrink-0 tabular-nums ${
                      passed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
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
