import React, { useState, useEffect, useRef, useLayoutEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { getCached, setCached } from '../../lib/cache';
import {
  GlassCard,
  ShimmerButton,
  NumberTicker,
} from '../../components/ui';
import { PathMap, TodayFloatingButton, PathNode } from '../../components/PathMap';
import {
  ArrowRight,
  Route,
  SlidersHorizontal,
  Play,
  Sparkles,
  Flame,
  Trophy,
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
    pillGradient: string;
    heroBg: string;
    heroBorder: string;
    accentText: string;
    badge: string;
    progressBar: string;
    unitBadge: string;
    spotlight: string;
    nodeHalo: string;
    nodeIdle: string;
    lineColor: string;
    currentCard: string;
    actionIdle: string;
  }
> = {
  HSK1: {
    label: 'HSK 1',
    vocab: '150 từ',
    subtitle: 'Nhập môn & Giao tiếp cơ bản',
    pillGradient: 'from-emerald-300/90 via-teal-300/90 to-cyan-200/95',
    heroBg: 'from-emerald-100/92 via-teal-50/90 to-cyan-100/90',
    heroBorder: 'border-emerald-200/80',
    accentText: 'text-emerald-800',
    badge: 'bg-emerald-100/85 text-emerald-800 border-emerald-200/80',
    progressBar: 'from-emerald-400 to-teal-400',
    unitBadge: 'from-emerald-400 to-teal-400',
    spotlight: 'rgba(52, 211, 153, 0.08)',
    nodeHalo: 'ring-4 ring-emerald-300/35',
    nodeIdle: 'bg-white/90 border-2 border-emerald-300/80 text-emerald-700',
    lineColor: 'bg-emerald-300/65',
    currentCard: 'bg-white/88 border-emerald-300/85 shadow-sm shadow-emerald-400/10',
    actionIdle: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  HSK2: {
    label: 'HSK 2',
    vocab: '300 từ',
    subtitle: 'Đời sống & Du lịch trôi chảy',
    pillGradient: 'from-sky-300/90 via-blue-300/85 to-indigo-200/95',
    heroBg: 'from-sky-100/92 via-blue-50/90 to-indigo-100/90',
    heroBorder: 'border-sky-200/80',
    accentText: 'text-sky-800',
    badge: 'bg-sky-100/85 text-sky-800 border-sky-200/80',
    progressBar: 'from-sky-400 to-indigo-400',
    unitBadge: 'from-sky-400 to-blue-400',
    spotlight: 'rgba(56, 189, 248, 0.08)',
    nodeHalo: 'ring-4 ring-sky-300/35',
    nodeIdle: 'bg-white/90 border-2 border-sky-300/80 text-sky-700',
    lineColor: 'bg-sky-300/65',
    currentCard: 'bg-white/88 border-sky-300/85 shadow-sm shadow-sky-400/10',
    actionIdle: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
  },
  HSK3: {
    label: 'HSK 3',
    vocab: '600 từ',
    subtitle: 'Trung cấp & Văn hóa xã hội',
    pillGradient: 'from-amber-300/90 via-orange-200/90 to-rose-200/95',
    heroBg: 'from-amber-100/92 via-orange-50/90 to-rose-100/88',
    heroBorder: 'border-amber-200/80',
    accentText: 'text-amber-800',
    badge: 'bg-amber-100/85 text-amber-800 border-amber-200/80',
    progressBar: 'from-amber-400 to-orange-400',
    unitBadge: 'from-amber-400 to-orange-400',
    spotlight: 'rgba(251, 191, 36, 0.08)',
    nodeHalo: 'ring-4 ring-amber-300/35',
    nodeIdle: 'bg-white/90 border-2 border-amber-300/80 text-amber-700',
    lineColor: 'bg-amber-300/65',
    currentCard: 'bg-white/88 border-amber-300/85 shadow-sm shadow-amber-400/10',
    actionIdle: 'bg-amber-50 text-amber-800 hover:bg-amber-100',
  },
  HSK4: {
    label: 'HSK 4',
    vocab: '1.200 từ',
    subtitle: 'Công sở, Phỏng vấn & Thuyết trình',
    pillGradient: 'from-rose-300/90 via-pink-200/95 to-fuchsia-200/90',
    heroBg: 'from-rose-100/92 via-pink-50/90 to-fuchsia-100/88',
    heroBorder: 'border-rose-200/80',
    accentText: 'text-rose-800',
    badge: 'bg-rose-100/85 text-rose-800 border-rose-200/80',
    progressBar: 'from-rose-400 to-pink-400',
    unitBadge: 'from-rose-400 to-pink-400',
    spotlight: 'rgba(251, 113, 133, 0.08)',
    nodeHalo: 'ring-4 ring-rose-300/35',
    nodeIdle: 'bg-white/90 border-2 border-rose-300/80 text-rose-700',
    lineColor: 'bg-rose-300/65',
    currentCard: 'bg-white/88 border-rose-300/85 shadow-sm shadow-rose-400/10',
    actionIdle: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  },
  HSK5: {
    label: 'HSK 5',
    vocab: '2.500 từ',
    subtitle: 'Báo chí, Công nghệ & Phân tích',
    pillGradient: 'from-violet-300/90 via-purple-200/95 to-fuchsia-200/90',
    heroBg: 'from-violet-100/92 via-purple-50/90 to-fuchsia-100/88',
    heroBorder: 'border-violet-200/80',
    accentText: 'text-violet-800',
    badge: 'bg-violet-100/85 text-violet-800 border-violet-200/80',
    progressBar: 'from-violet-400 to-purple-400',
    unitBadge: 'from-violet-400 to-purple-400',
    spotlight: 'rgba(167, 139, 250, 0.08)',
    nodeHalo: 'ring-4 ring-violet-300/35',
    nodeIdle: 'bg-white/90 border-2 border-violet-300/80 text-violet-700',
    lineColor: 'bg-violet-300/65',
    currentCard: 'bg-white/88 border-violet-300/85 shadow-sm shadow-violet-400/10',
    actionIdle: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
  },
  HSK6: {
    label: 'HSK 6',
    vocab: '5.000+ từ',
    subtitle: 'Thành ngữ & Học thuật bản xứ',
    pillGradient: 'from-fuchsia-300/90 via-pink-200/90 to-amber-200/95',
    heroBg: 'from-fuchsia-100/90 via-pink-50/90 to-amber-100/88',
    heroBorder: 'border-fuchsia-200/80',
    accentText: 'text-fuchsia-800',
    badge: 'bg-fuchsia-100/85 text-fuchsia-800 border-fuchsia-200/80',
    progressBar: 'from-fuchsia-400 to-amber-400',
    unitBadge: 'from-fuchsia-400 to-pink-400',
    spotlight: 'rgba(232, 121, 249, 0.08)',
    nodeHalo: 'ring-4 ring-fuchsia-300/35',
    nodeIdle: 'bg-white/90 border-2 border-fuchsia-300/80 text-fuchsia-700',
    lineColor: 'bg-fuchsia-300/65',
    currentCard: 'bg-white/88 border-fuchsia-300/85 shadow-sm shadow-fuchsia-400/10',
    actionIdle: 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100',
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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <span
              className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${meta.unitBadge} text-slate-950 flex items-center justify-center shadow-md`}
            >
              <Route className="w-5 h-5" />
            </span>
            <span>Lộ trình học HSK 1 – 6</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Học tiếng Trung từng bước theo cấp độ HSK 1 đến HSK 6, chia theo chủ đề và bài kiểm tra cuối chặng.
          </p>
        </div>

        <a
          href="#/onboarding?mode=survey"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-light hover:bg-white text-xs font-extrabold text-rose-600 transition-colors self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Khảo sát & Điều chỉnh mục tiêu</span>
        </a>
      </div>

      {/* Silky Unified HSK 1–6 Pastel Track (Single GPU-gliding Pill — Zero Jump!) */}
      <div className="relative p-1.5 rounded-[24px] glass-light grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {sliderStyle && (
          <div
            aria-hidden="true"
            style={{
              transform: `translate3d(${sliderStyle.left}px, ${sliderStyle.top}px, 0)`,
              width: sliderStyle.width,
              height: sliderStyle.height,
            }}
            className={`pointer-events-none absolute top-0 left-0 rounded-[18px] bg-gradient-to-br ${meta.pillGradient} dark:bg-none dark:bg-slate-800 border border-white/95 dark:border-slate-700 shadow-sm transition-[transform,width,height,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
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
              className={`relative z-10 rounded-[18px] px-3 py-2.5 text-left transition-colors duration-200 cursor-pointer ${
                isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-display font-extrabold tracking-tight">
                  {itemMeta.label}
                </span>
                <Sparkles
                  className={`w-3.5 h-3.5 transition-opacity duration-200 ${
                    isSelected ? 'opacity-80 text-slate-700' : 'opacity-0'
                  }`}
                />
              </div>
              <p
                className={`text-[11px] font-semibold mt-0.5 ${
                  isSelected ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {itemMeta.vocab}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dreamy Pastel Liquid Glass Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 bg-gradient-to-br ${meta.heroBg} border ${meta.heroBorder} backdrop-blur-2xl shadow-[0_14px_38px_-14px_rgba(148,163,184,0.25),inset_0_1.5px_1px_rgba(255,255,255,0.95)] transition-colors duration-300`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute right-6 -bottom-8 font-hanzi-serif font-black text-[140px] text-slate-900/[0.045] leading-none"
        >
          {selectedLevel.replace('HSK', '')}
        </span>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full border text-xs font-extrabold ${meta.badge}`}>
                {meta.label} • {meta.vocab}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/70 border border-white text-slate-700 text-xs font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                Học mới • Củng cố • Ôn lại
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              {activeCourse?.title || `${meta.label} — ${meta.subtitle}`}
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {activeCourse?.description || meta.subtitle}
            </p>

            {/* Progress Bar */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Tiến độ chinh phục {meta.label}</span>
                <span>
                  {completedCount}/{totalLessonsCount} bài (
                  <NumberTicker value={progressPercent} suffix="%" />)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/75 border border-white p-0.5 overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.max(progressPercent, 2)}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full bg-gradient-to-r ${meta.progressBar}`}
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
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/70 hover:bg-white border border-white/90 text-xs font-bold text-slate-700 transition-colors"
              >
                <BookMarked className="w-4 h-4 text-rose-500" />
                <span>Giáo trình, Từ vựng & Đề thi {meta.label}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Learning Path Units (Smooth crossfade, zero sudden skeleton collapse!) */}
      {isLoadingCourses ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl glass-card-grid animate-pulse" />
          ))}
        </div>
      ) : chapters.length === 0 && !isFetchingLevel ? (
        <GlassCard className="p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Chưa có bài học cho cấp độ {selectedLevel}
          </h3>
          <p className="text-xs text-slate-500">
            Nội dung bài học cho cấp độ này đang được cập nhật.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0.4, y: 5 }}
          animate={{ opacity: isFetchingLevel ? 0.65 : 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10 pb-20"
        >
          <div className="max-w-2xl mx-auto space-y-12">
            {chapters.map((chapter, chIdx) => {
              const fallbackGlyphs = ['基', '学', '语', '词', '句', '文'];
              const nodes: PathNode[] = chapter.lessons.map((lesson, lIdx) => {
                const hanziMatch = lesson.title.match(/[\u4e00-\u9fff]/);
                const glyph = hanziMatch ? hanziMatch[0] : fallbackGlyphs[(chIdx + lIdx) % fallbackGlyphs.length];
                const isCurrent =
                  nextActiveLesson?.lessonId === lesson.lessonId && !lesson.isCompleted;
                const status: PathNode['status'] = lesson.isCompleted
                  ? 'done'
                  : isCurrent
                    ? 'current'
                    : lesson.isUnlocked
                      ? 'done'
                      : 'locked';

                return {
                  id: lesson.lessonId,
                  label: lesson.title,
                  glyph,
                  status,
                  href: lesson.isUnlocked ? `#/lessons/${lesson.lessonId}` : undefined,
                };
              });

              return (
                <PathMap
                  key={chapter.chapterId}
                  title={`Chặng ${chIdx + 1}/${chapters.length} • ${chapter.title}`}
                  nodes={nodes}
                  onHeaderAction={() => {
                    window.location.hash = activeCourse
                      ? `#/courses/${activeCourse.courseId}`
                      : '#/vocab';
                  }}
                />
              );
            })}
          </div>

          <TodayFloatingButton
            fallbackLessonId={nextActiveLesson?.lessonId}
            label="Bài hôm nay"
          />

          {/* Level Exam Checkpoint Card */}
          <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-white/85">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-300 via-orange-300 to-rose-300 text-amber-950 flex items-center justify-center shadow-md shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
                  <Award className="w-3.5 h-3.5" />
                  Đánh giá trình độ {meta.label}
                </span>
                <h4 className="text-base sm:text-lg font-display font-extrabold text-slate-900">
                  Thử sức 5 Đề thi mô phỏng & Sách bài tập {meta.label}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
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
