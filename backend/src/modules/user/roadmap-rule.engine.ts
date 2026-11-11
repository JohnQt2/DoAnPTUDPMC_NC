export interface LessonCurriculumItem {
  lesson_id: number;
  chapter_id: number;
  title: string;
  order_index: number;
  estimated_duration_mins: number;
  status: string;
}

export interface ChapterCurriculumItem {
  chapter_id: number;
  course_id: number;
  title: string;
  order_index: number;
  lessons: LessonCurriculumItem[];
}

export interface CourseCurriculumItem {
  course_id: number;
  title: string;
  code: string;
  description: string | null;
  level: string;
  is_published: boolean;
  chapters: ChapterCurriculumItem[];
}

export interface RoadmapSurveyInput {
  starting_level: 'ZERO' | 'PINYIN_KNOWN' | 'ELEMENTARY';
  target_goal: 'HSK1' | 'HSK2' | 'COMMUNICATION' | 'HOBBY';
  daily_commitment_mins: number;
  reminder_time: string;
  course_id?: number;
}

export interface WeeklyMilestone {
  week: number;
  title: string;
  lessonCount: number;
  lessonIds: number[];
  lessonTitles: string[];
  focus: string;
  targetScore: number;
}

export interface MatchedRoadmapResult {
  courseId: number;
  courseTitle: string;
  courseCode: string;
  courseLevel: string;
  startingLevel: string;
  targetGoal: string;
  dailyCommitmentMins: number;
  reminderTime: string;
  recommendedFirstLessonId: number | null;
  initialUnlockedLessonIds: number[];
  estimatedDays: number;
  lessonsPerWeek: number;
  totalLessons: number;
  learningFocus: string;
  weeklyMilestones: WeeklyMilestone[];
}

export class RoadmapRuleEngine {
  /**
   * Khớp lộ trình học tập cá nhân hóa dựa trên kết quả khảo sát và giáo trình hiện có
   */
  static matchRoadmap(
    input: RoadmapSurveyInput,
    availableCourses: CourseCurriculumItem[]
  ): MatchedRoadmapResult {
    const publishedCourses = availableCourses.filter((c) => c.is_published);

    if (publishedCourses.length === 0) {
      throw new Error('Chưa có khóa học nào được phát hành trong hệ thống.');
    }

    // 1. Quy tắc chọn khóa học (course_id)
    let selectedCourse: CourseCurriculumItem | undefined;

    if (input.course_id) {
      selectedCourse = publishedCourses.find((c) => c.course_id === input.course_id);
    }

    if (!selectedCourse) {
      if (input.starting_level === 'ELEMENTARY' || input.target_goal === 'HSK2') {
        // Ưu tiên tìm khóa học HSK2
        selectedCourse = publishedCourses.find(
          (c) => c.level.toUpperCase() === 'HSK2' || c.code.toUpperCase() === 'HSK2'
        );
        // Fallback về HSK1 nếu chưa có HSK2
        if (!selectedCourse) {
          selectedCourse = publishedCourses.find(
            (c) => c.level.toUpperCase() === 'HSK1' || c.code.toUpperCase() === 'HSK1'
          );
        }
      } else {
        // ZERO hoặc PINYIN_KNOWN chọn khóa HSK1
        selectedCourse = publishedCourses.find(
          (c) => c.level.toUpperCase() === 'HSK1' || c.code.toUpperCase() === 'HSK1'
        );
      }

      // Fallback cuối cùng nếu không tìm thấy HSK1/HSK2
      if (!selectedCourse) {
        selectedCourse = publishedCourses[0];
      }
    }

    // 2. Thu thập và sắp xếp các bài học đã phát hành (PUBLISHED)
    const sortedChapters = [...selectedCourse.chapters].sort(
      (a, b) => a.order_index - b.order_index
    );

    const flatLessons: LessonCurriculumItem[] = [];
    for (const ch of sortedChapters) {
      const pubLessons = (ch.lessons || [])
        .filter((l) => l.status === 'PUBLISHED')
        .sort((a, b) => a.order_index - b.order_index);
      flatLessons.push(...pubLessons);
    }

    // 3. Quy tắc xác định bài học mở khóa ban đầu & bài học khuyến nghị bắt đầu
    let initialUnlockedLessonIds: number[] = [];
    let recommendedFirstLessonId: number | null = null;

    if (flatLessons.length > 0) {
      if (input.starting_level === 'ZERO') {
        // Mở khóa bài học đầu tiên của khóa học; bài khuyến nghị là bài đầu tiên
        const firstLesson = flatLessons[0];
        initialUnlockedLessonIds = [firstLesson.lesson_id];
        recommendedFirstLessonId = firstLesson.lesson_id;
      } else if (input.starting_level === 'PINYIN_KNOWN') {
        // Học viên đã biết Pinyin: Mở khóa các bài thuộc chương Pinyin nhập môn để ôn lại
        // Đồng thời mở khóa và đặt recommendedFirstLessonId vào bài học từ vựng/hội thoại kế tiếp
        const firstChapter = sortedChapters[0];
        const firstChapterLessonIds = (firstChapter?.lessons || [])
          .filter((l) => l.status === 'PUBLISHED')
          .map((l) => l.lesson_id);

        initialUnlockedLessonIds = [...firstChapterLessonIds];

        // Tìm bài học đầu tiên nằm ngoài chương nhập môn Pinyin (hoặc bài thuộc chapter 2)
        const nextChapter = sortedChapters.find((ch) => ch.order_index > (firstChapter?.order_index ?? 0));
        const nextChapterLessons = (nextChapter?.lessons || []).filter((l) => l.status === 'PUBLISHED');

        if (nextChapterLessons.length > 0) {
          const nextLesson = nextChapterLessons[0];
          if (!initialUnlockedLessonIds.includes(nextLesson.lesson_id)) {
            initialUnlockedLessonIds.push(nextLesson.lesson_id);
          }
          recommendedFirstLessonId = nextLesson.lesson_id;
        } else if (flatLessons.length > 1) {
          // Nếu chỉ có 1 chapter nhưng nhiều bài, gợi ý bài thứ 2
          recommendedFirstLessonId = flatLessons[1].lesson_id;
          if (!initialUnlockedLessonIds.includes(flatLessons[1].lesson_id)) {
            initialUnlockedLessonIds.push(flatLessons[1].lesson_id);
          }
        } else {
          recommendedFirstLessonId = flatLessons[0].lesson_id;
        }
      } else if (input.starting_level === 'ELEMENTARY') {
        // Học viên đã có nền tảng sơ cấp: Mở khóa chương đầu và đặt bài học bắt đầu ở chặng tương ứng
        const firstChapter = sortedChapters[0];
        const firstChapterLessonIds = (firstChapter?.lessons || [])
          .filter((l) => l.status === 'PUBLISHED')
          .map((l) => l.lesson_id);

        initialUnlockedLessonIds = [...firstChapterLessonIds];

        // Đặt bài học bắt đầu ở chương kế tiếp (hoặc bài tương ứng)
        const nextChapter = sortedChapters.find((ch) => ch.order_index > (firstChapter?.order_index ?? 0));
        const nextChapterLessons = (nextChapter?.lessons || []).filter((l) => l.status === 'PUBLISHED');

        if (nextChapterLessons.length > 0) {
          const nextLesson = nextChapterLessons[0];
          if (!initialUnlockedLessonIds.includes(nextLesson.lesson_id)) {
            initialUnlockedLessonIds.push(nextLesson.lesson_id);
          }
          recommendedFirstLessonId = nextLesson.lesson_id;
        } else {
          recommendedFirstLessonId = flatLessons[flatLessons.length - 1].lesson_id;
        }
      }
    }

    // 4. Quy tắc tính toán tiến độ & Chia chặng (Milestones)
    const dailyMins = [10, 15, 20, 30].includes(input.daily_commitment_mins)
      ? input.daily_commitment_mins
      : 15;

    const totalDurationMins = flatLessons.reduce(
      (sum, l) => sum + (l.estimated_duration_mins > 0 ? l.estimated_duration_mins : 15),
      0
    );

    const avgDurationMins = flatLessons.length > 0 ? totalDurationMins / flatLessons.length : 15;
    const weeklyAvailableMins = dailyMins * 7;
    const lessonsPerWeek = Math.max(1, Math.round(weeklyAvailableMins / avgDurationMins));
    const estimatedDays = Math.max(1, Math.ceil(totalDurationMins / dailyMins));

    // Xác định trọng tâm học tập theo target_goal
    let learningFocus = '';
    let targetScore = 80;

    switch (input.target_goal) {
      case 'HSK1':
        learningFocus =
          'Làm chủ 150 từ vựng căn bản, nắm chắc cấu trúc ngữ pháp HSK 1, quy tắc bút thuận chữ Hán và vượt qua bài kiểm tra củng cố đạt ≥ 80%.';
        targetScore = 80;
        break;
      case 'HSK2':
        learningFocus =
          'Mở rộng 300 từ vựng, củng cố mẫu câu phức, làm chủ các dạng câu hỏi HSK 2 và luyện đề checkpoint đạt ≥ 80%.';
        targetScore = 80;
        break;
      case 'COMMUNICATION':
        learningFocus =
          'Tập trung chuẩn hóa phát âm Pinyin, phân biệt chuẩn các cặp âm đối lập (Minimal Pairs), luyện thanh điệu và phản xạ hội thoại thực chiến.';
        targetScore = 75;
        break;
      case 'HOBBY':
      default:
        learningFocus =
          'Làm quen chữ Hán căn bản, ngữ điệu tự nhiên, tiếp cận tiếng Trung qua chủ đề văn hóa và sở thích hàng ngày.';
        targetScore = 70;
        break;
    }

    // Xây dựng danh sách weekly milestones
    const weeklyMilestones: WeeklyMilestone[] = [];
    const totalWeeks = Math.max(1, Math.ceil(flatLessons.length / lessonsPerWeek));

    for (let w = 1; w <= totalWeeks; w++) {
      const startIdx = (w - 1) * lessonsPerWeek;
      const weekLessons = flatLessons.slice(startIdx, startIdx + lessonsPerWeek);

      if (weekLessons.length === 0) break;

      const milestoneTitle =
        weekLessons.length === 1
          ? `Tuần ${w}: Hoàn thành "${weekLessons[0].title}"`
          : `Tuần ${w}: Chinh phục ${weekLessons.length} bài học (${weekLessons[0].title} - ${
              weekLessons[weekLessons.length - 1].title
            })`;

      weeklyMilestones.push({
        week: w,
        title: milestoneTitle,
        lessonCount: weekLessons.length,
        lessonIds: weekLessons.map((l) => l.lesson_id),
        lessonTitles: weekLessons.map((l) => l.title),
        focus: learningFocus,
        targetScore,
      });
    }

    return {
      courseId: selectedCourse.course_id,
      courseTitle: selectedCourse.title,
      courseCode: selectedCourse.code,
      courseLevel: selectedCourse.level,
      startingLevel: input.starting_level,
      targetGoal: input.target_goal,
      dailyCommitmentMins: dailyMins,
      reminderTime: input.reminder_time || '20:00',
      recommendedFirstLessonId,
      initialUnlockedLessonIds,
      estimatedDays,
      lessonsPerWeek,
      totalLessons: flatLessons.length,
      learningFocus,
      weeklyMilestones,
    };
  }
}

