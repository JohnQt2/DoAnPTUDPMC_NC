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
    pillGradient: 'from-[#D97706] to-[#B45309]',
    heroBg: 'from-[#FCFBF8]/95 via-[#FBF5EA]/92 to-[#F8F0DF]/88',
    heroBorder: 'border-[#D97706]/20',
    accentText: 'text-[#92400E]',
    badge: 'bg-[#D97706]/10 text-[#92400E] border-[#D97706]/25',
    progressBar: 'from-[#D97706] to-[#F59E0B]',
    unitBadge: 'from-[#D97706] to-[#B45309]',
    spotlight: 'rgba(217, 119, 6, 0.08)',
    nodeHalo: 'ring-4 ring-[#D97706]/20',
    nodeIdle: 'bg-white/90 border-2 border-[#D97706]/35 text-[#92400E]',
    lineColor: 'bg-[#D97706]/35',
    currentCard: 'bg-white/90 border-[#D97706]/35 shadow-sm shadow-[#D97706]/10',
    actionIdle: 'bg-[#D97706]/8 text-[#92400E] hover:bg-[#D97706]/14',
  },
  HSK2: {
    label: 'HSK 2',
    vocab: '300 từ',
    subtitle: 'Đời sống & Du lịch trôi chảy',
    pillGradient: 'from-[#157A57] to-[#116145]',
    heroBg: 'from-[#FCFBF8]/95 via-[#F1F8F5]/92 to-[#F6F3EC]/88',
    heroBorder: 'border-[#157A57]/20',
    accentText: 'text-[#157A57]',
    badge: 'bg-[#157A57]/10 text-[#157A57] border-[#157A57]/25',
    progressBar: 'from-[#157A57] to-[#1F9B70]',
    unitBadge: 'from-[#157A57] to-[#116145]',
    spotlight: 'rgba(21, 122, 87, 0.08)',
    nodeHalo: 'ring-4 ring-[#157A57]/20',
    nodeIdle: 'bg-white/90 border-2 border-[#157A57]/35 text-[#157A57]',
    lineColor: 'bg-[#157A57]/35',
    currentCard: 'bg-white/90 border-[#157A57]/35 shadow-sm shadow-[#157A57]/10',
    actionIdle: 'bg-[#157A57]/8 text-[#157A57] hover:bg-[#157A57]/14',
  },
  HSK3: {
    label: 'HSK 3',
    vocab: '600 từ',
    subtitle: 'Trung cấp & Văn hóa xã hội',
    pillGradient: 'from-[#D95B18] to-[#B4460E]',
    heroBg: 'from-[#FCFBF8]/95 via-[#FBF3EC]/92 to-[#F8EFE5]/88',
    heroBorder: 'border-[#D95B18]/20',
    accentText: 'text-[#B4460E]',
    badge: 'bg-[#D95B18]/10 text-[#B4460E] border-[#D95B18]/25',
    progressBar: 'from-[#D95B18] to-[#E67E22]',
    unitBadge: 'from-[#D95B18] to-[#B4460E]',
    spotlight: 'rgba(217, 91, 24, 0.08)',
    nodeHalo: 'ring-4 ring-[#D95B18]/20',
    nodeIdle: 'bg-white/90 border-2 border-[#D95B18]/35 text-[#B4460E]',
    lineColor: 'bg-[#D95B18]/35',
    currentCard: 'bg-white/90 border-[#D95B18]/35 shadow-sm shadow-[#D95B18]/10',
    actionIdle: 'bg-[#D95B18]/8 text-[#B4460E] hover:bg-[#D95B18]/14',
  },
  HSK4: {
    label: 'HSK 4',
    vocab: '1.200 từ',
    subtitle: 'Công sở, Phỏng vấn & Thuyết trình',
    pillGradient: 'from-[#C41E3A]/90 via-[#C41E3A]/80 to-[#D4A017]/80',
    heroBg: 'from-[#FCFBF8]/95 via-[#FBF2F3]/92 to-[#FAF3E6]/88',
    heroBorder: 'border-[#C41E3A]/20',
    accentText: 'text-[#A51730]',
    badge: 'bg-[#C41E3A]/10 text-[#A51730] border-[#C41E3A]/20',
    progressBar: 'from-[#C41E3A] to-[#D4A017]',
    unitBadge: 'from-[#C41E3A] to-[#A51730]',
    spotlight: 'rgba(196, 30, 58, 0.08)',
    nodeHalo: 'ring-4 ring-[#C41E3A]/20',
    nodeIdle: 'bg-white/90 border-2 border-[#C41E3A]/35 text-[#A51730]',
    lineColor: 'bg-[#C41E3A]/35',
    currentCard: 'bg-white/90 border-[#C41E3A]/35 shadow-sm shadow-[#C41E3A]/10',
    actionIdle: 'bg-[#C41E3A]/8 text-[#A51730] hover:bg-[#C41E3A]/14',
  },
  HSK5: {
    label: 'HSK 5',
    vocab: '2.500 từ',
    subtitle: 'Báo chí, Công nghệ & Phân tích',
    pillGradient: 'from-[#184375]/90 via-[#1E4F8A]/85 to-[#2D629F]/85',
    heroBg: 'from-[#FCFBF8]/95 via-[#F2F5FA]/92 to-[#F7F3EC]/88',
    heroBorder: 'border-[#184375]/20',
    accentText: 'text-[#184375]',
    badge: 'bg-[#184375]/10 text-[#184375] border-[#184375]/20',
    progressBar: 'from-[#184375] to-[#2B6CB0]',
    unitBadge: 'from-[#184375] to-[#12325A]',
    spotlight: 'rgba(24, 67, 117, 0.08)',
    nodeHalo: 'ring-4 ring-[#184375]/20',
    nodeIdle: 'bg-white/90 border-2 border-[#184375]/35 text-[#184375]',
    lineColor: 'bg-[#184375]/35',
    currentCard: 'bg-white/90 border-[#184375]/35 shadow-sm shadow-[#184375]/10',
    actionIdle: 'bg-[#184375]/8 text-[#184375] hover:bg-[#184375]/14',
  },
  HSK6: {
    label: 'HSK 6',
    vocab: '5.000+ từ',
    subtitle: 'Thành ngữ & Học thuật bản xứ',
    pillGradient: 'from-[#5A1063]/90 via-[#6E1A78]/85 to-[#C29940]/85',
    heroBg: 'from-[#FCFBF8]/95 via-[#F8F2F9]/92 to-[#FAF3E6]/88',
    heroBorder: 'border-[#5A1063]/20',
    accentText: 'text-[#5A1063]',
    badge: 'bg-[#5A1063]/10 text-[#5A1063] border-[#5A1063]/20',
    progressBar: 'from-[#5A1063] to-[#C29940]',
    unitBadge: 'from-[#5A1063] to-[#7A2085]',
    spotlight: 'rgba(90, 16, 99, 0.08)',
    nodeHalo: 'ring-4 ring-[#5A1063]/20',
    nodeIdle: 'bg-white/90 border-2 border-[#5A1063]/35 text-[#5A1063]',
    lineColor: 'bg-[#5A1063]/35',
    currentCard: 'bg-white/90 border-[#5A1063]/35 shadow-sm shadow-[#5A1063]/10',
    actionIdle: 'bg-[#5A1063]/8 text-[#5A1063] hover:bg-[#5A1063]/14',
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

      {/* Silky Unified HSK 1–6 Track (Single GPU-gliding Pill — Zero Jump!) */}
      <div className="relative p-1.5 rounded-[24px] glass-light grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {sliderStyle && (
          <div
            aria-hidden="true"
            style={{
              transform: `translate3d(${sliderStyle.left}px, ${sliderStyle.top}px, 0)`,
              width: sliderStyle.width,
              height: sliderStyle.height,
            }}
            className={`pointer-events-none absolute top-0 left-0 rounded-[18px] bg-gradient-to-br ${meta.pillGradient} dark:bg-none dark:bg-slate-800 border border-white/25 dark:border-slate-700 shadow-md transition-[transform,width,height,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
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
                isSelected ? 'text-white' : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-display font-extrabold tracking-tight">
                  {itemMeta.label}
                </span>
                <Sparkles
                  className={`w-3.5 h-3.5 transition-opacity duration-200 ${
                    isSelected ? 'opacity-95 text-[#FDE68A]' : 'opacity-0'
                  }`}
                />
              </div>
              <p
                className={`text-[11px] font-semibold mt-0.5 ${
                  isSelected ? 'text-white/85' : 'text-[#78716C]'
                }`}
              >
                {itemMeta.vocab}
              </p>
            </button>
          );
        })}
      </div>

      {/* Warm Porcelain Frosted Liquid Glass Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 bg-gradient-to-br ${meta.heroBg} border ${meta.heroBorder} backdrop-blur-2xl shadow-[0_14px_38px_-14px_rgba(28,25,23,0.12),inset_0_1.5px_1px_rgba(255,255,255,0.95)] transition-colors duration-300`}
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
