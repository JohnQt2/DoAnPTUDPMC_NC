import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Play,
  BookOpen,
  MessagesSquare,
  FileText,
  CheckCircle2,
  Flame,
  ArrowRight,
  Route,
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Chào {user?.displayName || 'bạn'}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Mục tiêu hôm nay của bạn: <strong className="text-gray-800">{dailyMins} phút</strong> • Lộ trình <strong className="text-primary-600">{targetGoal}</strong>
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary-50 text-primary-600 font-bold text-sm self-start sm:self-auto">
          <Flame className="w-4 h-4 fill-primary-500 text-primary-500" />
          <span>{completedLessons} bài đã hoàn thành</span>
        </div>
      </div>

      {/* Main Call-To-Action Card: Next Lesson */}
      <div className="bg-primary-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-primary-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
            Bài học tiếp theo
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {loading ? 'Đang chuẩn bị bài học...' : 'Tiếp tục lộ trình học hôm nay'}
          </h2>
          <p className="text-sm text-primary-100 max-w-md">
            Học ngắn gọn từ vựng, nghe phát âm và làm bài tập nhanh trong {dailyMins} phút.
          </p>
        </div>

        <a
          href={`#/lessons/${nextLessonId}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-primary-600 hover:bg-primary-50 font-bold text-sm shadow-md transition-all shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Học ngay</span>
        </a>
      </div>

      {/* Simple 3-Step Daily Checklist */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-gray-900">Việc cần làm hôm nay</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="#/vocab"
            className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Ôn từ vựng</h4>
              <p className="text-xs text-gray-500 mt-0.5">Lật thẻ nhớ & tập viết chữ Hán</p>
            </div>
          </a>

          <a
            href="#/speak-practice"
            className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Luyện nói 5 phút</h4>
              <p className="text-xs text-gray-500 mt-0.5">Nghe và đọc theo câu giao tiếp</p>
            </div>
          </a>

          <a
            href="#/exams"
            className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Làm đề kiểm tra</h4>
              <p className="text-xs text-gray-500 mt-0.5">Đạt ≥ 80% để mở khóa bài mới</p>
            </div>
          </a>
        </div>
      </div>

      {/* Quick Link to Full Roadmap */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Xem toàn bộ lộ trình HSK 1 – 6</h4>
            <p className="text-xs text-gray-500">Chọn khóa học và bài học theo từng chương</p>
          </div>
        </div>
        <a
          href="#/courses"
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-gray-700 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Mở lộ trình</span>
        </a>
      </div>
    </div>
  );
};

