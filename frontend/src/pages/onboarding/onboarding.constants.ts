export type StartingLevel =
  | 'ZERO'
  | 'PINYIN_KNOWN'
  | 'ELEMENTARY'
  | 'HSK1'
  | 'HSK2'
  | 'HSK3'
  | 'HSK4'
  | 'HSK5'
  | 'HSK6';

export type TargetGoal =
  | 'HSK1'
  | 'HSK2'
  | 'HSK3'
  | 'HSK4'
  | 'HSK5'
  | 'HSK6'
  | 'COMMUNICATION'
  | 'HOBBY';

export interface WeeklyMilestoneLesson {
  lessonId: number;
  title: string;
  orderIndex: number;
  estimatedDurationMins: number;
  chapterTitle: string;
}

export interface WeeklyMilestone {
  week: number;
  title: string;
  totalLessons: number;
  estimatedMinutes: number;
  lessons: WeeklyMilestoneLesson[];
}

export interface RoadmapPreviewData {
  recommendedCourse: {
    courseId: number;
    code: string;
    title: string;
    level: string;
    description: string | null;
    totalLessons: number;
    totalEstimatedMinutes: number;
  };
  startingLevel: string;
  targetGoal: string;
  dailyCommitmentMins: number;
  estimatedWeeks: number;
  estimatedDays: number;
  studyPace: string;
  recommendedFirstLessonId: number | null;
  initiallyUnlockedLessonIds: number[];
  weeklyMilestones: WeeklyMilestone[];
  summaryMessage: string;
}

export const HSK_LEVEL_COLORS: Record<
  string,
  { badgeBg: string; badgeText: string; border: string }
> = {
  ZERO: {
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    border: 'border-gray-200',
  },
  PINYIN_KNOWN: {
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    border: 'border-teal-200',
  },
  HSK1: {
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  HSK2: {
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    border: 'border-sky-200',
  },
  HSK3: {
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    border: 'border-amber-200',
  },
  HSK4: {
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    border: 'border-orange-200',
  },
  HSK5: {
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    border: 'border-rose-200',
  },
  HSK6: {
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    border: 'border-purple-200',
  },
};

export const STARTING_LEVEL_OPTIONS: {
  id: StartingLevel;
  badge: string;
  title: string;
  subtitle: string;
  vocabCount: string;
}[] = [
  {
    id: 'ZERO',
    badge: 'Nhập môn',
    title: 'Mới bắt đầu',
    subtitle: 'Chưa biết tiếng Trung, học từ Pinyin và nét cơ bản',
    vocabCount: '0 từ',
  },
  {
    id: 'PINYIN_KNOWN',
    badge: 'Cơ bản',
    title: 'Đã biết Pinyin',
    subtitle: 'Đã đọc được phiên âm, bắt đầu học từ vựng & hội thoại',
    vocabCount: '~30 từ',
  },
  {
    id: 'HSK1',
    badge: 'HSK 1',
    title: 'Sơ cấp HSK 1',
    subtitle: 'Giao tiếp chào hỏi, giới thiệu bản thân cơ bản',
    vocabCount: '150 từ',
  },
  {
    id: 'HSK2',
    badge: 'HSK 2',
    title: 'Sơ trung cấp HSK 2',
    subtitle: 'Giao tiếp sinh hoạt hằng ngày, mua sắm, thời gian',
    vocabCount: '300 từ',
  },
  {
    id: 'HSK3',
    badge: 'HSK 3',
    title: 'Trung cấp HSK 3',
    subtitle: 'Giao tiếp độc lập trong học tập, du lịch và công việc',
    vocabCount: '600 từ',
  },
  {
    id: 'HSK4',
    badge: 'HSK 4',
    title: 'Trung cao cấp HSK 4',
    subtitle: 'Đọc hiểu đoạn văn dài, thảo luận đa chủ đề',
    vocabCount: '1.200 từ',
  },
  {
    id: 'HSK5',
    badge: 'HSK 5',
    title: 'Cao cấp HSK 5',
    subtitle: 'Đọc báo chí, xem phim ảnh và thuyết trình',
    vocabCount: '2.500 từ',
  },
  {
    id: 'HSK6',
    badge: 'HSK 6',
    title: 'Thành thạo HSK 6',
    subtitle: 'Sử dụng tiếng Trung học thuật & chuyên ngành lưu loát',
    vocabCount: '5.000+ từ',
  },
];

export const TARGET_GOAL_OPTIONS: {
  id: TargetGoal;
  badge: string;
  title: string;
  description: string;
  recommendedWeeks: number;
}[] = [
  {
    id: 'HSK1',
    badge: 'HSK 1',
    title: 'Đạt chứng chỉ HSK 1',
    description: 'Nắm vững phát âm Pinyin và 150 từ vựng nền tảng',
    recommendedWeeks: 4,
  },
  {
    id: 'HSK2',
    badge: 'HSK 2',
    title: 'Đạt chứng chỉ HSK 2',
    description: 'Làm chủ 300 từ vựng và mẫu câu giao tiếp thông dụng',
    recommendedWeeks: 8,
  },
  {
    id: 'HSK3',
    badge: 'HSK 3',
    title: 'Đạt chứng chỉ HSK 3',
    description: 'Làm chủ 600 từ vựng, chuẩn đầu ra ngoại ngữ cơ sở',
    recommendedWeeks: 12,
  },
  {
    id: 'HSK4',
    badge: 'HSK 4',
    title: 'Đạt chứng chỉ HSK 4',
    description: 'Làm chủ 1.200 từ vựng phục vụ du học & làm việc',
    recommendedWeeks: 16,
  },
  {
    id: 'HSK5',
    badge: 'HSK 5',
    title: 'Đạt chứng chỉ HSK 5',
    description: 'Làm chủ 2.500 từ vựng và kỹ năng đọc viết nâng cao',
    recommendedWeeks: 24,
  },
  {
    id: 'HSK6',
    badge: 'HSK 6',
    title: 'Đạt chứng chỉ HSK 6',
    description: 'Chinh phục 5.000+ từ vựng và ngữ pháp học thuật',
    recommendedWeeks: 36,
  },
  {
    id: 'COMMUNICATION',
    badge: 'Giao tiếp',
    title: 'Giao tiếp Đời sống & Du lịch',
    description: 'Tập trung nghe nói phản xạ thực tế hằng ngày',
    recommendedWeeks: 8,
  },
  {
    id: 'HOBBY',
    badge: 'Sở thích',
    title: 'Học theo Sở thích',
    description: 'Học nhẹ nhàng mỗi ngày qua từ vựng & chữ Hán',
    recommendedWeeks: 12,
  },
];

export const TARGET_TIMELINE_OPTIONS = [
  { weeks: 4, label: '1 tháng (4 tuần)', subtitle: 'Lộ trình ngắn hạn, tập trung cao' },
  { weeks: 8, label: '2 tháng (8 tuần)', subtitle: 'Tốc độ tiêu chuẩn, cân bằng lý thuyết & luyện tập' },
  { weeks: 12, label: '3 tháng (12 tuần)', subtitle: 'Lộ trình vững chắc, ôn tập sâu chữ Hán' },
  { weeks: 24, label: '6 tháng (24 tuần)', subtitle: 'Lộ trình dài hạn cho cấp độ trung - cao cấp' },
];

export const DAILY_COMMITMENT_OPTIONS = [
  { mins: 15, hoursLabel: '15 phút', title: '15 phút / ngày', tag: 'Nhẹ nhàng', pace: '~1 bài / 2 ngày' },
  { mins: 30, hoursLabel: '30 phút', title: '30 phút / ngày', tag: 'Khuyên dùng', pace: '1–2 bài / ngày' },
  { mins: 45, hoursLabel: '45 phút', title: '45 phút / ngày', tag: 'Tăng tốc', pace: '2–3 bài / ngày' },
  { mins: 60, hoursLabel: '1 giờ', title: '60 phút / ngày', tag: 'Chuyên tâm', pace: '3–4 bài / ngày' },
  { mins: 90, hoursLabel: '1.5 giờ', title: '90 phút / ngày', tag: 'Luyện thi', pace: '4–5 bài / ngày' },
  { mins: 120, hoursLabel: '2 giờ', title: '120 phút / ngày', tag: 'Cấp tốc', pace: '5–6 bài / ngày' },
];
