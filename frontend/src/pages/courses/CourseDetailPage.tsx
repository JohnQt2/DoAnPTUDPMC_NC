import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Play,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
  Sparkles,
  Flame,
  Award,
  Layers,
} from 'lucide-react';

interface LessonProgressItem {
  lessonId: number;
  title: string;
  orderIndex: number;
  estimatedDurationMins: number;
  blocksCount?: number;
  vocabulariesCount?: number;
  testsCount?: number;
  status?: string;
  progressStatus?: string;
  isUnlocked?: boolean;
  isCompleted?: boolean;
  highestScore?: number;
}

interface ChapterItem {
  chapterId: number;
  title: string;
  orderIndex: number;
  lessons: LessonProgressItem[];
}

interface CourseDetailData {
  courseId: number;
  title: string;
  code: string;
  description: string | null;
  level: string;
  isPublished: boolean;
  chapters: ChapterItem[];
}

const HSK_BADGE_STYLES: Record<string, { badgeBg: string; badgeText: string; border: string }> = {
  HSK1: { badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', border: 'border-emerald-200' },
  HSK2: { badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', border: 'border-sky-200' },
  HSK3: { badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', border: 'border-amber-200' },
  HSK4: { badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', border: 'border-orange-200' },
  HSK5: { badgeBg: 'bg-rose-50', badgeText: 'text-rose-700', border: 'border-rose-200' },
  HSK6: { badgeBg: 'bg-purple-50', badgeText: 'text-purple-700', border: 'border-purple-200' },
};

export const CourseDetailPage: React.FC<{ courseId: number }> = ({ courseId }) => {
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

  const loadCourseDetail = async () => {
    try {
      const data = await api.get<any>(`/curriculum/courses/${courseId}`);
      if (data) {
        // Normalize backend chapter and lesson fields
        const normalizedChapters: ChapterItem[] = (data.chapters || []).map((ch: any) => {
          const chapId = ch.chapterId || ch.chapter_id;
          return {
            chapterId: chapId,
            title: ch.title,
            orderIndex: ch.orderIndex || ch.order_index || 1,
            lessons: (ch.lessons || []).map((l: any) => ({
              lessonId: l.lessonId || l.lesson_id,
              title: l.title,
              orderIndex: l.orderIndex || l.order_index || 1,
              estimatedDurationMins: l.estimatedDurationMins || l.estimated_duration_mins || 15,
              blocksCount: l.blocksCount ?? l._count?.blocks ?? 0,
              vocabulariesCount: l.vocabulariesCount ?? l._count?.vocabularies ?? 0,
              testsCount: l.testsCount ?? l._count?.tests ?? 0,
              status: l.status || (l.isCompleted ? 'COMPLETED' : l.isUnlocked ? 'UNLOCKED' : 'LOCKED'),
              isUnlocked: l.isUnlocked ?? l.is_unlocked ?? true,
              isCompleted: l.isCompleted ?? l.is_completed ?? false,
              highestScore: l.highestScore ?? l.highest_score ?? 0,
            })),
          };
        });

        const normalizedCourse: CourseDetailData = {
          courseId: data.courseId || data.course_id || courseId,
          title: data.title,
          code: data.code,
          description: data.description,
          level: (data.level || 'HSK1').toUpperCase(),
          isPublished: data.isPublished ?? data.is_published ?? true,
          chapters: normalizedChapters,
        };

        setCourse(normalizedCourse);

        // Expand all chapters initially
        const expanded: Record<number, boolean> = {};
        normalizedChapters.forEach((ch) => {
          expanded[ch.chapterId] = true;
        });
        setExpandedChapters(expanded);
      }
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

  const expandAll = () => {
    if (!course) return;
    const expanded: Record<number, boolean> = {};
    course.chapters.forEach((ch) => {
      expanded[ch.chapterId] = true;
    });
    setExpandedChapters(expanded);
  };

  const collapseAll = () => {
    setExpandedChapters({});
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
        <div className="h-44 rounded-3xl bg-gray-100 animate-pulse border border-gray-200" />
        <div className="h-64 rounded-3xl bg-gray-100 animate-pulse border border-gray-200" />
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

  // Calculate Overall Progress Metrics
  const allLessons = course.chapters.flatMap((ch) => ch.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Next recommended lesson to study
  const nextLesson =
    allLessons.find((l) => l.status === 'IN_PROGRESS') ||
    allLessons.find((l) => l.isUnlocked && !l.isCompleted) ||
    allLessons[0];

  const levelStyle = HSK_BADGE_STYLES[course.level] || HSK_BADGE_STYLES.HSK1;

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <a href="#/courses" className="hover:text-primary-600 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh mục khóa học</span>
        </a>
        <span>/</span>
        <span className="text-gray-900">{course.level}</span>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{course.title}</span>
      </div>

      {/* Course Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border ${levelStyle.badgeBg} ${levelStyle.badgeText} ${levelStyle.border}`}
              >
                Cấp độ: {course.level}
              </span>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                Mã: {course.code}
              </span>
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Đạt ≥ 80% để mở bài kế tiếp
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {course.title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {course.description ||
                'Chương trình học tiếng Trung theo cấp độ chuẩn hóa quốc tế, chia nhỏ kiến thức thành từng Unit trực quan với đầy đủ từ vựng, ngữ pháp, audio và chữ Hán.'}
            </p>
          </div>

          {/* Quick CTA to continue */}
          {nextLesson && (
            <div className="shrink-0 p-5 rounded-2xl bg-primary-50/60 border border-primary-200 text-center space-y-2.5">
              <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider block">
                {nextLesson.isCompleted ? 'Bài học gợi ý ôn tập' : 'Bài học tiếp theo của bạn'}
              </span>
              <p className="text-sm font-extrabold text-gray-900 max-w-[220px] truncate mx-auto">
                {nextLesson.title}
              </p>
              <a
                href={`#/lessons/${nextLesson.lessonId}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{nextLesson.isCompleted ? 'Học lại bài này' : 'Vào học ngay'}</span>
              </a>
            </div>
          )}
        </div>

        {/* Course Overall Progress Bar */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary-600" />
              Tiến độ cấp độ: {completedLessons} / {totalLessons} bài học hoàn thành
            </span>
            <span className="text-primary-600 font-extrabold">{progressPercent}%</span>
          </div>

          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chapters & Units Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Cấu Trúc Các Unit Trong Khóa Học ({course.chapters.length} Unit)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Mỗi Unit tập trung vào một chủ đề giao tiếp thực chiến và hệ thống ngữ pháp cốt lõi
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
            >
              Mở rộng tất cả
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
            >
              Thu gọn
            </button>
          </div>
        </div>

        {/* Unit Accordion Cards List */}
        <div className="space-y-4">
          {course.chapters.map((chapter, chapIdx) => {
            const isExpanded = expandedChapters[chapter.chapterId] ?? true;
            const chapCompletedCount = chapter.lessons.filter((l) => l.isCompleted).length;
            const isChapComplete =
              chapter.lessons.length > 0 && chapCompletedCount === chapter.lessons.length;
            const hasLessonInProgress = chapter.lessons.some((l) => l.status === 'IN_PROGRESS');

            return (
              <div
                key={chapter.chapterId}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Unit Card Header */}
                <button
                  type="button"
                  onClick={() => toggleChapter(chapter.chapterId)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 bg-gray-50/70 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isChapComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : hasLessonInProgress
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      {chapIdx + 1}
                    </span>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-primary-600 uppercase tracking-wider">
                          Unit {chapIdx + 1}
                        </span>
                        {isChapComplete && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Đã hoàn thành Unit
                          </span>
                        )}
                        {hasLessonInProgress && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-600" />
                            Đang học dở
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
                        {chapter.title}
                      </h3>

                      <span className="text-xs text-gray-500 font-medium">
                        {chapCompletedCount} / {chapter.lessons.length} bài đã hoàn thành
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                      {isExpanded ? 'Thu gọn' : 'Xem bài học'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Lessons List in Unit */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100 px-4 sm:px-6 py-2">
                    {chapter.lessons.map((lesson, lessonIdx) => {
                      const isUnlocked = lesson.isUnlocked ?? false;
                      const isCompleted = lesson.isCompleted ?? false;
                      const isInProgress = lesson.status === 'IN_PROGRESS';

                      return (
                        <div
                          key={lesson.lessonId}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-gray-50/50 -mx-2 px-2 rounded-2xl"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            {/* Status Icon Indicator */}
                            <div className="mt-0.5 shrink-0">
                              {isCompleted ? (
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              ) : isInProgress ? (
                                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                  <Flame className="w-4 h-4" />
                                </div>
                              ) : isUnlocked ? (
                                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-gray-400">
                                  Bài {lessonIdx + 1}
                                </span>
                                <h4
                                  className={`text-sm font-bold truncate ${
                                    isUnlocked ? 'text-gray-900' : 'text-gray-400'
                                  }`}
                                >
                                  {lesson.title}
                                </h4>

                                {isCompleted && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                    Hoàn thành {lesson.highestScore ? `(${lesson.highestScore}%)` : ''}
                                  </span>
                                )}

                                {isInProgress && (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                                    Đang học dở
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  {lesson.estimatedDurationMins} phút
                                </span>
                                {lesson.vocabulariesCount ? (
                                  <span>{lesson.vocabulariesCount} từ vựng</span>
                                ) : null}
                                {lesson.testsCount ? (
                                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                                    <FileQuestion className="w-3 h-3" />
                                    Bài test củng cố
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isUnlocked ? (
                              <a
                                href={`#/lessons/${lesson.lessonId}`}
                                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isInProgress
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : isCompleted
                                      ? 'bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 border border-gray-200'
                                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                                }`}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{isCompleted ? 'Ôn tập lại' : isInProgress ? 'Học tiếp' : 'Bắt đầu học'}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl font-medium">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Khóa (Đạt ≥ 80% bài trước)</span>
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
