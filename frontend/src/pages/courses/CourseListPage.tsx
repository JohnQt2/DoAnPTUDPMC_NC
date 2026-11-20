import React, { useState, useEffect, useRef, useLayoutEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { getCached, setCached } from '../../lib/cache';
import {
  GlassCard,
  ShimmerButton,
  SpotlightCard,
  NumberTicker,
} from '../../components/ui';
import {
  BookOpen,
  ArrowRight,
  Route,
  SlidersHorizontal,
  Play,
  CheckCircle2,
  Lock,
  Sparkles,
  Flame,
  Trophy,
  Clock,
  Layers,
  Award,
  BookMarked,
} from 'lucide-react';

interface CourseItem {
  courseId: number;
  title: string;
  code: string;
  description: string | null;
  level: string;
  isPublished: boolean;
  chaptersCount?: number;
  lessonsCount?: number;
}

interface LessonNode {
  lessonId: number;
  title: string;
  orderIndex: number;
  estimatedDurationMins: number;
  blocksCount: number;
  vocabulariesCount: number;
  testsCount: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  highestScore: number;
}

interface ChapterStation {
  chapterId: number;
  title: string;
  orderIndex: number;
  lessons: LessonNode[];
}

const HSK_META: Record<
  string,
  {
    label: string;
    vocab: string;
    subtitle: string;
  }
> = {
  HSK1: {
    label: 'HSK 1',
    vocab: '150 từ',
    subtitle: 'Nhập môn & Giao tiếp cơ bản',
  },
  HSK2: {
    label: 'HSK 2',
    vocab: '300 từ',
    subtitle: 'Đời sống & Du lịch trôi chảy',
  },
  HSK3: {
    label: 'HSK 3',
    vocab: '600 từ',
    subtitle: 'Trung cấp & Văn hóa xã hội',
  },
  HSK4: {
    label: 'HSK 4',
    vocab: '1.200 từ',
    subtitle: 'Công sở, Phỏng vấn & Thuyết trình',
  },
  HSK5: {
    label: 'HSK 5',
    vocab: '2.500 từ',
    subtitle: 'Báo chí, Công nghệ & Phân tích',
  },
  HSK6: {
    label: 'HSK 6',
    vocab: '5.000+ từ',
    subtitle: 'Thành ngữ & Học thuật bản xứ',
  },
};

const HSK_KEYS = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const;

function readLevelFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash || '';
  if (!raw.includes('?')) return null;
  const level = new URLSearchParams(raw.split('?')[1]).get('level');
  if (!level) return null;
  const normalized = level.toUpperCase().replace(/\s+/g, '');
  return HSK_META[normalized] ? normalized : null;
}

function normalizeChapters(detail: any): ChapterStation[] {
  return (detail?.chapters || []).map((ch: any) => ({
    chapterId: ch.chapterId || ch.chapter_id,
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
      isUnlocked: l.isUnlocked ?? l.is_unlocked ?? true,
      isCompleted: l.isCompleted ?? l.is_completed ?? false,
      highestScore: l.highestScore ?? l.highest_score ?? 0,
    })),
  }));
}

export const CourseListPage: React.FC = () => {
  const cachedCourses = getCached<CourseItem[]>('courses:list');
  const [selectedLevel, setSelectedLevel] = useState<string>(() => readLevelFromHash() || 'HSK1');
  const [courses, setCourses] = useState<CourseItem[]>(cachedCourses || []);
  const [chapters, setChapters] = useState<ChapterStation[]>(() => {
    if (!cachedCourses) return [];
    const match = cachedCourses.find((c) => (c.level || '').toUpperCase() === (readLevelFromHash() || 'HSK1'));
    const cid = match?.courseId || (match as any)?.course_id;
    return cid ? getCached<ChapterStation[]>(`course:chapters:${cid}`) || [] : [];
  });
  const [activeCourse, setActiveCourse] = useState<CourseItem | null>(() => {
    if (!cachedCourses) return null;
    return cachedCourses.find((c) => (c.level || '').toUpperCase() === (readLevelFromHash() || 'HSK1')) || cachedCourses[0] || null;
  });
  const [isLoadingCourses, setIsLoadingCourses] = useState(!cachedCourses);
  const [isFetchingLevel, setIsFetchingLevel] = useState(false);
  const [, startTransition] = useTransition();

  // Silky GPU sliding tab indicator (measured via local offsetLeft / offsetWidth — 0 layoutId jump!)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [sliderStyle, setSliderStyle] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const measureSlider = () => {
    const el = tabRefs.current[selectedLevel];
    if (el) {
      setSliderStyle({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
  };

  useLayoutEffect(() => {
    measureSlider();
    window.addEventListener('resize', measureSlider);
    return () => window.removeEventListener('resize', measureSlider);
  }, [selectedLevel]);

  // Sync selectedLevel if user navigates via breadcrumb link like #/courses?level=HSK2
  useEffect(() => {
    const syncLevel = () => {
      const lvl = readLevelFromHash();
      if (lvl) setSelectedLevel(lvl);
    };
    window.addEventListener('hashchange', syncLevel);
    return () => window.removeEventListener('hashchange', syncLevel);
  }, []);

  // Load all HSK 1–6 courses (instant from SWR cache when revisited)
  useEffect(() => {
    if (cachedCourses) {
      setIsLoadingCourses(false);
      return;
    }
    api
      .get<CourseItem[]>('/curriculum/courses')
      .then((data) => {
        const list = data || [];
        setCached('courses:list', list);
        setCourses(list);
        const fromHash = readLevelFromHash();
        if (fromHash) {
          setSelectedLevel(fromHash);
        } else {
          const defaultCourse =
            list.find((c) => (c.level || '').toUpperCase() === 'HSK1') || list[0] || null;
          if (defaultCourse) {
            setSelectedLevel((defaultCourse.level || 'HSK1').toUpperCase());
          }
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setIsLoadingCourses(false));
  }, []);

  // Load course chapters with instant cache hit (no layout collapse on switch!)
  useEffect(() => {
    if (courses.length === 0) return;
    const match =
      courses.find((c) => (c.level || '').toUpperCase() === selectedLevel) || courses[0];
    setActiveCourse(match || null);
    if (!match) return;

    const cid = match.courseId || (match as any).course_id;
    const cacheKey = `course:chapters:${cid}`;
    const hit = getCached<ChapterStation[]>(cacheKey);

    if (hit) {
      setChapters(hit);
      setIsFetchingLevel(false);
      return;
    }

    let cancelled = false;
    setIsFetchingLevel(true);
    api
      .get<any>(`/curriculum/courses/${cid}`)
      .then((detail) => {
        if (cancelled) return;
        const normalized = normalizeChapters(detail);
        setCached(cacheKey, normalized);
        setChapters(normalized);
      })
      .catch(() => {
        if (!cancelled) setChapters([]);
      })
      .finally(() => {
        if (!cancelled) setIsFetchingLevel(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLevel, courses]);

  const meta = HSK_META[selectedLevel] || HSK_META.HSK1;
  const allLessons = chapters.flatMap((c) => c.lessons);
  const completedCount = allLessons.filter((l) => l.isCompleted).length;
  const totalLessonsCount = allLessons.length;
  const progressPercent =
    totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;
  const nextActiveLesson =
    allLessons.find((l) => l.isUnlocked && !l.isCompleted) || allLessons[0] || null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-5 sm:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400">
            Giáo trình chuẩn HSK
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 flex items-center gap-2.5 tracking-tight mt-1">
            <span className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
              <Route className="w-4 h-4" />
            </span>
            <span>Lộ trình học HSK 1 – 6</span>
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Học tiếng Trung từng bước theo cấp độ HSK 1 đến HSK 6, chia theo chủ đề và bài kiểm tra cuối chặng.
          </p>
        </div>

        <a
          href="#/onboarding?mode=survey"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
          <span>Khảo sát & Điều chỉnh mục tiêu</span>
        </a>
      </div>

      {/* Crisp Monochrome HSK 1–6 Segmented Control */}
      <div className="relative p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 grid grid-cols-3 sm:grid-cols-6 gap-1">
        {sliderStyle && (
          <div
            aria-hidden="true"
            style={{
              transform: `translate3d(${sliderStyle.left}px, ${sliderStyle.top}px, 0)`,
              width: sliderStyle.width,
              height: sliderStyle.height,
            }}
            className="pointer-events-none absolute top-0 left-0 rounded-lg bg-zinc-900 shadow-xs transition-[transform,width,height] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
        )}

        {HSK_KEYS.map((lvl) => {
          const itemMeta = HSK_META[lvl];
          const isSelected = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              ref={(el) => {
                tabRefs.current[lvl] = el;
              }}
              type="button"
              onClick={() => startTransition(() => setSelectedLevel(lvl))}
              className={`relative z-10 rounded-lg px-3 py-2 text-left transition-colors duration-150 cursor-pointer ${
                isSelected ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-display font-bold tracking-tight">
                  {itemMeta.label}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-opacity duration-150 ${
                    isSelected ? 'opacity-100 bg-[#BE123C]' : 'opacity-0'
                  }`}
                />
              </div>
              <p
                className={`text-[11px] font-mono mt-0.5 ${
                  isSelected ? 'text-zinc-300' : 'text-zinc-400'
                }`}
              >
                {itemMeta.vocab}
              </p>
            </button>
          );
        })}
      </div>

      {/* Architectural Course Overview Card */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 ios-hero-glass">
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute right-6 -bottom-7 font-hanzi-serif font-bold text-[128px] text-zinc-950/[0.035] leading-none"
        >
          {selectedLevel.replace('HSK', '')}
        </span>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-white text-[11px] font-mono font-semibold">
                {meta.label} · {meta.vocab}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 text-[11px] font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#BE123C]" />
                Học mới · Củng cố · Ôn lại
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-950 tracking-tight">
              {activeCourse?.title || `${meta.label} — ${meta.subtitle}`}
            </h2>
            <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
              {activeCourse?.description || meta.subtitle}
            </p>

            {/* Progress Bar */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                <span>Tiến độ chinh phục {meta.label}</span>
                <span className="font-mono font-semibold text-zinc-900 tabular-nums">
                  {completedCount}/{totalLessonsCount} bài (
                  <NumberTicker value={progressPercent} suffix="%" />)
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.max(progressPercent, 2)}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-zinc-900"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:items-end">
            {nextActiveLesson && (
              <ShimmerButton
                href={`#/lessons/${nextActiveLesson.lessonId}`}
                size="lg"
                className="w-full lg:w-auto"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tiếp tục chặng hiện tại</span>
              </ShimmerButton>
            )}
            {activeCourse && (
              <a
                href={`#/courses/${activeCourse.courseId}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors"
              >
                <BookMarked className="w-3.5 h-3.5 text-[#BE123C]" />
                <span>Giáo trình, Từ vựng & Đề thi {meta.label}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Learning Path Units */}
      {isLoadingCourses ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl glass-card-grid animate-pulse" />
          ))}
        </div>
      ) : chapters.length === 0 && !isFetchingLevel ? (
        <GlassCard className="p-12 text-center space-y-3">
          <Layers className="w-9 h-9 text-zinc-300 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-900">
            Chưa có bài học cho cấp độ {selectedLevel}
          </h3>
          <p className="text-xs text-zinc-500">
            Nội dung bài học cho cấp độ này đang được cập nhật.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: isFetchingLevel ? 0.65 : 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          {chapters.map((chapter, chIdx) => {
            const unitDone = chapter.lessons.filter((l) => l.isCompleted).length;
            const unitTotal = chapter.lessons.length;

            return (
              <SpotlightCard key={chapter.chapterId} className="p-6">
                {/* Unit Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-zinc-950 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-mono uppercase text-zinc-400 leading-none">
                        Unit
                      </span>
                      <span className="text-base font-bold leading-tight tabular-nums">
                        {chIdx + 1}
                      </span>
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/80 text-[11px] font-mono font-medium">
                        Chặng {chIdx + 1} · {unitDone}/{unitTotal} hoàn thành
                      </span>
                      <h3 className="text-base sm:text-lg font-display font-bold text-zinc-950 mt-1">
                        {chapter.title}
                      </h3>
                    </div>
                  </div>

                  <a
                    href={activeCourse ? `#/courses/${activeCourse.courseId}?tab=vocab` : '#/vocab'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-700 hover:text-zinc-950 transition-colors self-start sm:self-auto"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Từ vựng cấp độ này</span>
                  </a>
                </div>

                {/* Centered Timeline Rail */}
                <div className="mt-4">
                  {chapter.lessons.map((lesson, lIdx) => {
                    const isCurrent =
                      nextActiveLesson?.lessonId === lesson.lessonId && !lesson.isCompleted;
                    const isFirst = lIdx === 0;
                    const isLast = lIdx === chapter.lessons.length - 1;

                    return (
                      <div key={lesson.lessonId} className="flex items-stretch gap-3.5 sm:gap-4">
                        <div className="w-9 shrink-0 flex flex-col items-center">
                          <div
                            aria-hidden="true"
                            className={`w-[1.5px] flex-1 ${isFirst ? 'bg-transparent' : 'bg-zinc-200'}`}
                          />
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono font-semibold text-xs ${
                              lesson.isCompleted
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                  ? 'bg-[#BE123C] text-white ring-4 ring-rose-100'
                                  : lesson.isUnlocked
                                    ? 'bg-white border border-zinc-300 text-zinc-700'
                                    : 'bg-zinc-50 border border-zinc-200 text-zinc-400'
                            }`}
                          >
                            {lesson.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : !lesson.isUnlocked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              lIdx + 1
                            )}
                          </div>
                          <div
                            aria-hidden="true"
                            className={`w-[1.5px] flex-1 ${isLast ? 'bg-transparent' : 'bg-zinc-200'}`}
                          />
                        </div>

                        <div className="flex-1 py-1.5 min-w-0">
                          <a
                            href={lesson.isUnlocked ? `#/lessons/${lesson.lessonId}` : undefined}
                            onClick={(e) => {
                              if (!lesson.isUnlocked) e.preventDefault();
                            }}
                            className={`rounded-xl p-4 border transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isCurrent
                                ? 'bg-zinc-50/90 border-zinc-900 shadow-[0_1px_2px_rgba(9,9,11,0.04)]'
                                : lesson.isUnlocked
                                  ? 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                                  : 'bg-zinc-50/50 border-zinc-200/70 opacity-65 cursor-not-allowed'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded bg-[#BE123C] text-white text-[10px] font-semibold uppercase tracking-wide">
                                    Đang học
                                  </span>
                                )}
                                {lesson.isCompleted && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold uppercase">
                                    Hoàn thành {lesson.highestScore ? `· ${lesson.highestScore}%` : ''}
                                  </span>
                                )}
                                <h4 className="text-sm sm:text-[15px] font-display font-semibold text-zinc-950">
                                  {lesson.title}
                                </h4>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                  {lesson.estimatedDurationMins} phút
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                                  {lesson.vocabulariesCount || 4} từ trọng tâm
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                                  {lesson.blocksCount || 2} phần nội dung
                                </span>
                              </div>
                            </div>

                            {lesson.isUnlocked ? (
                              <span
                                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs shrink-0 transition-colors ${
                                  isCurrent
                                    ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                    : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                                }`}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{lesson.isCompleted ? 'Ôn lại' : 'Vào học'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 shrink-0">
                                <Lock className="w-3.5 h-3.5" />
                                Hoàn thành bài trước
                              </span>
                            )}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SpotlightCard>
            );
          })}

          {/* Level Exam Checkpoint Card */}
          <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#BE123C]">
                  <Award className="w-3.5 h-3.5" />
                  Đánh giá trình độ {meta.label}
                </span>
                <h4 className="text-base font-display font-bold text-zinc-950 mt-0.5">
                  Thử sức 5 Đề thi mô phỏng & Sách bài tập {meta.label}
                </h4>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Kiểm tra năng lực tổng hợp để xác nhận độ vững kiến thức trước khi lên cấp tiếp theo.
                </p>
              </div>
            </div>

            <ShimmerButton href="#/exams" className="shrink-0">
              <span>Vào phòng thi {meta.label}</span>
              <ArrowRight className="w-4 h-4" />
            </ShimmerButton>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};
