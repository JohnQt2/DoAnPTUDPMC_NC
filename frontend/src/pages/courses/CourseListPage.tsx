import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  BookOpen,
  Award,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Compass,
  Target,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface CourseItem {
  courseId: number;
  title: string;
  code: string;
  description: string | null;
  level: string;
  isPublished: boolean;
  chaptersCount?: number;
  _count?: { chapters: number };
}

const HSK_LEVEL_CONFIG: Record<
  string,
  {
    badgeBg: string;
    badgeText: string;
    border: string;
    vocabTarget: string;
    summary: string;
    themeColor: string;
  }
> = {
  HSK1: {
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-200',
    vocabTarget: '150 từ vựng',
    summary: 'Nhập môn Pinyin & 150 từ vựng cơ bản',
    themeColor: 'emerald',
  },
  HSK2: {
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    border: 'border-sky-200',
    vocabTarget: '300 từ vựng',
    summary: 'Giao tiếp đời sống, mua sắm & thời tiết',
    themeColor: 'sky',
  },
  HSK3: {
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    border: 'border-amber-200',
    vocabTarget: '600 từ vựng',
    summary: 'Giao tiếp độc lập trong du lịch & công việc',
    themeColor: 'amber',
  },
  HSK4: {
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    border: 'border-orange-200',
    vocabTarget: '1.200 từ vựng',
    summary: 'Đọc hiểu đoạn văn dài & chuẩn bị du học',
    themeColor: 'orange',
  },
  HSK5: {
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    border: 'border-rose-200',
    vocabTarget: '2.500 từ vựng',
    summary: 'Đọc báo chí, xem phim ảnh & viết luận',
    themeColor: 'rose',
  },
  HSK6: {
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    border: 'border-purple-200',
    vocabTarget: '5.000+ từ vựng',
    summary: 'Ngữ pháp học thuật & diễn đạt chuyên sâu',
    themeColor: 'purple',
  },
};

export const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.get<any[]>('/curriculum/courses');
      setCourses(data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses =
    selectedFilter === 'ALL'
      ? courses
      : courses.filter((c) => (c.level || '').toUpperCase() === selectedFilter);

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 text-white p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-secondary-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Giáo Trình HSK Chuẩn Hóa 1–6
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Chinh Phục Tiếng Trung <br /> Dễ Dàng Cùng <span className="text-secondary-300">ChinaEasy</span>
          </h1>

          <p className="text-primary-100 text-xs sm:text-sm md:text-base leading-relaxed">
            Hệ thống giáo trình HSK 1 đến HSK 6 được cấu trúc chi tiết theo từng Unit, tích hợp chuẩn ngữ âm Pinyin, thứ tự nét chữ Hán SVG và kiểm tra mở khóa tự động.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href="#/onboarding"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-700 hover:bg-primary-50 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4 text-primary-600" />
              <span>Khảo sát & Thiết lập lộ trình</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#/onboarding?mode=survey"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              <Target className="w-4 h-4 text-secondary-300" />
              <span>Đổi mục tiêu học</span>
            </a>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-primary-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary-400" />
              Học theo cấu trúc Unit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary-400" />
              Mở khóa bài tiếp khi đạt ≥ 80%
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary-400" />
              Ôn tập ngắt quãng SM-2
            </span>
          </div>
        </div>

        {/* Decorative Chinese Character */}
        <span className="absolute -right-8 -bottom-16 text-[220px] font-chinese font-black text-white/5 select-none pointer-events-none">
          中文
        </span>
      </div>

      {/* Level Filter Tabs (HSK 1 - 6) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary-600" />
              Danh Mục Khóa Học HSK 1 Đến HSK 6
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Chọn cấp độ phù hợp để xem cấu trúc các Unit và bắt đầu học tập
            </p>
          </div>

          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {filteredCourses.length} khóa học đang phát hành
          </span>
        </div>

        {/* Horizontal Level Pill Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tất cả cấp độ
          </button>

          {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const).map((lvl) => {
            const isSelected = selectedFilter === lvl;
            const cfg = HSK_LEVEL_CONFIG[lvl];
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedFilter(lvl)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : `${cfg.badgeBg} ${cfg.badgeText} ${cfg.border} hover:opacity-80`
                }`}
              >
                <span>{lvl.replace('HSK', 'HSK ')}</span>
                <span className="text-[10px] opacity-80">({cfg.vocabTarget})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-gray-100 animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Layers className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">Chưa có khóa học cho cấp độ này</h3>
          <p className="text-xs text-gray-500">Vui lòng chọn cấp độ khác hoặc quay lại xem tất cả khóa học.</p>
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl"
          >
            Xem tất cả khóa học
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const courseId = (course as any).courseId || (course as any).course_id || 1;
            const chaptersCount =
              (course as any).chaptersCount ?? (course as any)._count?.chapters ?? 2;
            const lvl = (course.level || 'HSK1').toUpperCase();
            const levelCfg = HSK_LEVEL_CONFIG[lvl] || HSK_LEVEL_CONFIG.HSK1;

            return (
              <div
                key={courseId}
                className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Level Pill & Course Code */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full border font-extrabold text-xs ${levelCfg.badgeBg} ${levelCfg.badgeText} ${levelCfg.border}`}
                    >
                      {course.level || 'HSK1'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Mã: {course.code}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {course.description || levelCfg.summary}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics & CTA */}
                <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                      <BookOpen className="w-4 h-4 text-primary-600" />
                      {chaptersCount} Unit (Chương)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                      <Award className="w-4 h-4 text-amber-500" />
                      Yêu cầu đạt ≥ 80%
                    </span>
                  </div>

                  <a
                    href={`#/courses/${courseId}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-50 hover:bg-primary-600 text-gray-700 hover:text-white font-bold text-xs transition-all group-hover:bg-primary-600 group-hover:text-white cursor-pointer shadow-sm"
                  >
                    <span>Vào Xem Các Unit & Bài Học</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
