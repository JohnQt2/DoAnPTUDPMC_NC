import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BookOpen, Award, ArrowRight, CheckCircle2, Sparkles, Compass, Target } from 'lucide-react';

const HSK_BADGE_STYLES: Record<string, string> = {
  HSK1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HSK2: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  HSK3: 'bg-amber-50 text-amber-700 border-amber-200',
  HSK4: 'bg-orange-50 text-orange-700 border-orange-200',
  HSK5: 'bg-rose-50 text-rose-700 border-rose-200',
  HSK6: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
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

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 text-white p-8 sm:p-12 overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-secondary-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Giáo Trình HSK Chuẩn Hóa
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Chinh Phục Tiếng Trung <br /> Dễ Dàng Cùng <span className="text-secondary-300">ChinaEasy</span>
          </h1>
          <p className="text-primary-100 text-sm sm:text-base leading-relaxed">
            Học chuẩn ngữ âm Pinyin, làm chủ các nét bút thuận chữ Hán với công nghệ vẽ tương tác, và rèn luyện phản xạ với bài kiểm tra đa dạng.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href="#/onboarding"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-700 hover:bg-primary-50 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Thiết lập lộ trình học</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#/onboarding?mode=survey"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              <Target className="w-4 h-4 text-secondary-300" />
              <span>Làm lại khảo sát</span>
            </a>
          </div>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-primary-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary-400" />
              100% Pinyin & Thanh Điệu F0
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary-400" />
              So khớp nét vẽ chuẩn SVG
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary-400" />
              Ôn tập thông minh SM-2
            </span>
          </div>
        </div>

        {/* Decorative Chinese Character in Background */}
        <span className="absolute -right-8 -bottom-16 text-[220px] font-chinese font-black text-white/5 select-none pointer-events-none">
          中文
        </span>
      </div>

      {/* Courses Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Danh Sách Khóa Học
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Hiển thị {courses.length} khóa học đang phát hành
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.course_id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full border font-extrabold text-xs ${
                        HSK_BADGE_STYLES[course.level || 'HSK1'] || 'bg-primary-50 text-primary-600 border-primary-100'
                      }`}
                    >
                      {course.level || 'HSK1'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Mã: {course.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                      {course.description || 'Chương trình học tiếng Trung sơ cấp toàn diện với đầy đủ lý thuyết, bài tập và đề kiểm tra.'}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      {course._count?.chapters || 2} Chương học
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      Yêu cầu đạt ≥ 80%
                    </span>
                  </div>

                  <a
                    href={`#/courses/${course.course_id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-50 hover:bg-primary-600 text-gray-700 hover:text-white font-bold text-xs transition-all group-hover:bg-primary-600 group-hover:text-white"
                  >
                    Xem Chi Tiết Bài Học
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
