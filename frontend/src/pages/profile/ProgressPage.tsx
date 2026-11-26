import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { GlassCard, NumberTicker } from '../../components/ui';
import { TrendingUp, BookOpen, CheckCircle2, Clock, Settings } from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const [progress, setProgress] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prog, rm] = await Promise.all([
          api.get<any>('/users/me/progress').catch(() => null),
          api.get<any>('/users/roadmap').catch(() => null),
        ]);
        setProgress(prog);
        setRoadmap(rm?.roadmap || rm || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completedLessons = progress?.completedLessonsCount ?? progress?.completedLessons ?? 0;
  const totalLessons = progress?.totalRoadmapLessons ?? progress?.totalLessons ?? 12;
  const percent =
    totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const dailyMins = roadmap?.daily_commitment_mins || 15;
  const targetGoal = roadmap?.target_goal || 'HSK1';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5 tracking-tight">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-secondary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span>Tiến độ học tập</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">Theo dõi kết quả học mỗi ngày của bạn.</p>
        </div>

        <a
          href="#/profile"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white border border-gray-200/80 text-xs font-bold text-gray-700 shadow-sm transition-all self-start sm:self-auto"
        >
          <Settings className="w-4 h-4 text-primary-500" />
          <span>Cài đặt tài khoản</span>
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-3xl bg-white/60 border border-white/80 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard hoverable className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Bài học hoàn thành</span>
              </div>
              <p className="text-3xl font-black text-gray-900">
                <NumberTicker value={completedLessons} />
              </p>
            </GlassCard>

            <GlassCard hoverable className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <BookOpen className="w-4 h-4 text-primary-500" />
                <span>Mục tiêu hiện tại</span>
              </div>
              <p className="text-3xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                {targetGoal}
              </p>
            </GlassCard>

            <GlassCard hoverable className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <Clock className="w-4 h-4 text-secondary-600" />
                <span>Cam kết mỗi ngày</span>
              </div>
              <p className="text-3xl font-black text-gray-900">
                <NumberTicker value={dailyMins} suffix=" phút" />
              </p>
            </GlassCard>
          </div>

          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-gray-900">
                Tiến độ lộ trình {targetGoal}
              </h2>
              <span className="text-sm font-black text-primary-600">
                <NumberTicker value={percent} suffix="%" />
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-gray-200/70 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary-600 via-rose-500 to-secondary-500"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-500 font-medium">
                Đã hoàn thành <strong className="text-gray-800">{completedLessons}</strong> /{' '}
                {totalLessons} bài trong lộ trình.
              </p>
              <a
                href="#/onboarding?mode=survey"
                className="text-xs font-bold text-primary-600 hover:underline"
              >
                Điều chỉnh mục tiêu
              </a>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
};
