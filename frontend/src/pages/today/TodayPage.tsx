import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { GlassCard, ShimmerButton, NumberTicker } from '../../components/ui';
import {
  Play,
  BookOpen,
  MessagesSquare,
  FileText,
  CheckCircle2,
  Flame,
  ArrowRight,
  Route,
  Sparkles,
} from 'lucide-react';

export const TodayPage: React.FC = () => {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [nextLessonId, setNextLessonId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [rm, prog] = await Promise.all([
          api.get<any>('/users/roadmap').catch(() => null),
          api.get<any>('/users/me/progress').catch(() => null),
        ]);
        setRoadmap(rm?.roadmap || null);
        setProgress(prog || null);
        if (rm?.recommendedFirstLessonId) {
          setNextLessonId(rm.recommendedFirstLessonId);
        } else if (rm?.lessons?.length > 0) {
          const next = rm.lessons.find((l: any) => !l.isCompleted) || rm.lessons[0];
          setNextLessonId(next.lessonId || next.lesson_id || 1);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dailyMins = roadmap?.daily_commitment_mins || 15;
  const targetGoal = roadmap?.target_goal || 'HSK1';
  const completedLessons = progress?.completedLessonsCount ?? progress?.completedLessons ?? 0;

  const dailyActions = [
    {
      href: '#/vocab',
      icon: BookOpen,
      title: 'Ôn từ vựng',
      desc: 'Ôn thẻ từ vựng và luyện viết chữ Hán',
      accent: 'from-primary-500/15 to-rose-500/5 text-primary-600',
    },
    {
      href: '#/speak-practice',
      icon: MessagesSquare,
      title: 'Luyện nói 5 phút',
      desc: 'Nghe và đọc theo câu giao tiếp',
      accent: 'from-secondary-500/20 to-amber-500/5 text-secondary-700',
    },
    {
      href: '#/exams',
      icon: FileText,
      title: 'Làm đề kiểm tra',
      desc: 'Đạt ≥ 80% để mở khóa bài mới',
      accent: 'from-emerald-500/15 to-teal-500/5 text-emerald-600',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-7">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Chào {user?.displayName || 'bạn'}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Mục tiêu hôm nay: <strong className="text-gray-800">{dailyMins} phút</strong> • Lộ trình{' '}
            <strong className="text-primary-600">{targetGoal}</strong>
          </p>
        </div>

        <GlassCard className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl self-start sm:self-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white flex items-center justify-center shadow-sm">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-sm font-black text-gray-900">
              <NumberTicker value={completedLessons} suffix=" bài" />
            </p>
            <p className="text-[11px] font-semibold text-gray-500">Đã hoàn thành</p>
          </div>
        </GlassCard>
      </div>

      {/* Main Call-To-Action iPhone Liquid Glass Hero Lens */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 ios-hero-glass bg-gradient-to-br from-rose-200/32 via-white/18 to-violet-200/30"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute right-6 -bottom-6 font-hanzi-serif font-black text-[120px] text-rose-400/[0.10] leading-none"
        >
          学
        </span>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/75 border border-white text-xs font-bold text-rose-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Bài học tiếp theo
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight">
              {loading ? 'Đang chuẩn bị bài học...' : 'Tiếp tục lộ trình học hôm nay'}
            </h2>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Học ngắn gọn từ vựng, nghe phát âm và làm bài tập nhanh chỉ trong {dailyMins} phút.
            </p>
          </div>

          <ShimmerButton
            href={`#/lessons/${nextLessonId}`}
            size="lg"
            className="shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Học ngay</span>
          </ShimmerButton>
        </div>
      </motion.div>

      {/* 3-Step Daily Checklist */}
      <div className="space-y-3.5">
        <h3 className="text-base font-extrabold text-gray-900">Việc cần làm hôm nay</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dailyActions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.href}
                href={item.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="glass-light glass-light-hover rounded-3xl p-5 flex flex-col justify-between gap-5 group"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.accent} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>

      {/* Quick Link to Full Roadmap */}
      <GlassCard hoverable className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-gray-900">Xem toàn bộ lộ trình HSK 1 – 6</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Chọn khóa học và bài học theo từng chương
            </p>
          </div>
        </div>
        <a
          href="#/courses"
          className="px-4 py-2.5 rounded-xl bg-white/90 hover:bg-primary-50 border border-gray-200/80 hover:border-primary-200 text-gray-700 hover:text-primary-600 font-bold text-xs transition-all shrink-0 inline-flex items-center justify-center gap-1.5 shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Mở lộ trình</span>
        </a>
      </GlassCard>
    </div>
  );
};
