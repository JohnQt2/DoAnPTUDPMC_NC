import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
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
        setRoadmap(rm?.roadmap || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completedLessons = progress?.completedLessonsCount ?? progress?.completedLessons ?? 0;
  const totalLessons = progress?.totalRoadmapLessons ?? progress?.totalLessons ?? 12;
  const percent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const dailyMins = roadmap?.daily_commitment_mins || 15;
  const targetGoal = roadmap?.target_goal || 'HSK1';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-500" />
            Tiến độ học tập
          </h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi kết quả học mỗi ngày của bạn.</p>
        </div>

        <a
          href="#/profile"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700"
        >
          <Settings className="w-4 h-4" />
          <span>Cài đặt tài khoản</span>
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                <span>Bài học hoàn thành</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{completedLessons}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <BookOpen className="w-4 h-4 text-primary-500" />
                <span>Mục tiêu hiện tại</span>
              </div>
              <p className="text-3xl font-black text-primary-600">{targetGoal}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <Clock className="w-4 h-4 text-primary-500" />
                <span>Cam kết mỗi ngày</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{dailyMins} phút</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Tiến độ lộ trình {targetGoal}</h2>
              <span className="text-sm font-extrabold text-primary-600">{percent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Đã hoàn thành {completedLessons} / {totalLessons} bài trong lộ trình.
              </p>
              <a
                href="#/onboarding?mode=survey"
                className="text-xs font-bold text-primary-600 hover:underline"
              >
                Điều chỉnh mục tiêu
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

