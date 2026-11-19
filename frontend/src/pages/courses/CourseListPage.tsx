import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BookOpen, ArrowRight, Layers, Route } from 'lucide-react';

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

const HSK_VOCAB: Record<string, string> = {
  HSK1: '150 từ',
  HSK2: '300 từ',
  HSK3: '600 từ',
  HSK4: '1.200 từ',
  HSK5: '2.500 từ',
  HSK6: '5.000+ từ',
};

export const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<any[]>('/curriculum/courses')
      .then((data) => setCourses(data || []))
      .catch(() => setCourses([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredCourses =
    selectedFilter === 'ALL'
      ? courses
      : courses.filter((c) => (c.level || '').toUpperCase() === selectedFilter);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Route className="w-6 h-6 text-primary-500" />
            Lộ trình học
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chọn cấp độ HSK phù hợp để vào học theo từng bài.
          </p>
        </div>

        <a
          href="#/onboarding?mode=survey"
          className="text-xs font-bold text-primary-600 hover:underline self-start sm:self-auto"
        >
          Thiết lập lại mục tiêu học
        </a>
      </div>

      {/* Simple Level Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Tất cả
        </button>

        {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const).map((lvl) => {
          const isSelected = selectedFilter === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedFilter(lvl)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {lvl.replace('HSK', 'HSK ')}
            </button>
          );
        })}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <Layers className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">Chưa có khóa học cho cấp độ này</h3>
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className="px-4 py-2 bg-primary-500 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Xem tất cả
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const courseId = (course as any).courseId || (course as any).course_id || 1;
            const chaptersCount =
              (course as any).chaptersCount ?? (course as any)._count?.chapters ?? 2;
            const lvl = (course.level || 'HSK1').toUpperCase();

            return (
              <a
                key={courseId}
                href={`#/courses/${courseId}`}
                className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-600 font-extrabold text-xs">
                      {lvl.replace('HSK', 'HSK ')}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {HSK_VOCAB[lvl] || 'HSK'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-5 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <BookOpen className="w-4 h-4 text-primary-500" />
                    {chaptersCount} chương
                  </span>
                  <span className="flex items-center gap-1 text-primary-600 group-hover:translate-x-0.5 transition-transform">
                    Vào học <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};
