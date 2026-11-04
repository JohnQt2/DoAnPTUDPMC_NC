import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CourseDetailPage: React.FC<{ courseId: number }> = ({ courseId }) => {
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

  const loadCourseDetail = async () => {
    try {
      const data = await api.get<any>(`/curriculum/courses/${courseId}`);
      setCourse(data);

      // Expand all chapters initially
      const expanded: Record<number, boolean> = {};
      data?.chapters?.forEach((ch: any) => {
        expanded[ch.chapter_id] = true;
      });
      setExpandedChapters(expanded);
    } catch (err) {
      console.error('Failed to load course detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <div className="h-40 rounded-3xl bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-3xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-gray-500">Không tìm thấy thông tin khóa học này.</p>
        <a href="#/courses" className="text-primary-600 font-bold underline">
          Quay lại danh sách khóa học
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Course Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full bg-primary-50 text-primary-600 font-extrabold text-xs">
            {course.level || 'HSK1'}
          </span>
          <span className="text-xs text-gray-400 font-mono">Mã: {course.code}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {course.title}
        </h1>

        <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>

        <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-gray-500">
          <span>{course.chapters?.length || 0} Chương</span>
          <span>•</span>
          <span className="text-amber-600 font-bold">Mở khóa bài tiếp theo khi đạt ≥ 80%</span>
        </div>
      </div>

      {/* Chapters & Lessons Tree */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Nội Dung Khóa Học</h2>

        <div className="space-y-4">
          {course.chapters?.map((chapter: any, chapIdx: number) => {
            const isExpanded = expandedChapters[chapter.chapter_id] ?? true;

            return (
              <div
                key={chapter.chapter_id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Chapter Accordion Header */}
                <button
                  onClick={() => toggleChapter(chapter.chapter_id)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 bg-gray-50/70 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                      {chapIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                        {chapter.title}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {chapter.lessons?.length || 0} bài học
                      </span>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Lessons List */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100 p-2 sm:p-4">
                    {chapter.lessons?.map((lesson: any, lessonIdx: number) => {
                      // First lesson of first chapter is unlocked; others depend on progress
                      const isCompleted = lesson.userCompleted;
                      const isUnlocked = chapIdx === 0 && lessonIdx === 0 ? true : lesson.userUnlocked ?? true;

                      return (
                        <div
                          key={lesson.lesson_id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl hover:bg-gray-50/80 transition-colors"
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            <div className="mt-0.5 sm:mt-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              ) : isUnlocked ? (
                                <PlayCircle className="w-6 h-6 text-primary-600" />
                              ) : (
                                <Lock className="w-6 h-6 text-gray-300" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-sm font-bold ${
                                    isUnlocked ? 'text-gray-900' : 'text-gray-400'
                                  }`}
                                >
                                  {lesson.title}
                                </h4>
                                {isCompleted && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                    Đã hoàn thành
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {lesson.estimated_duration_mins || 10} phút
                                </span>
                                {lesson.blocks && (
                                  <span>{lesson.blocks.length} nội dung</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isUnlocked ? (
                              <>
                                <a
                                  href={`#/lessons/${lesson.lesson_id}`}
                                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-sm transition-all"
                                >
                                  {isCompleted ? 'Học lại' : 'Bắt đầu học'}
                                </a>

                                {lesson.tests && lesson.tests.length > 0 && (
                                  <a
                                    href={`#/test/${lesson.tests[0].test_id}`}
                                    className="px-3 py-2 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 font-semibold text-xs transition-all flex items-center gap-1"
                                    title="Làm bài kiểm tra"
                                  >
                                    <FileQuestion className="w-3.5 h-3.5 text-primary-500" />
                                    Kiểm tra
                                  </a>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl font-medium">
                                <Lock className="w-3.5 h-3.5" />
                                Cần đạt 80% bài trước
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
