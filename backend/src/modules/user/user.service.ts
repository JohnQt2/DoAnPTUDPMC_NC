import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import {
  RoadmapRuleEngine,
  CourseCurriculumItem,
} from './roadmap-rule.engine';
import { OnboardingSurveyInput } from './user.dto';

export class UserService {
  async getProfile(userId: number) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        notificationSettings: true,
        roadmaps: {
          where: { is_active: true },
          include: { course: true },
          take: 1,
        },
        avatarResource: true,
        profile: true,
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng.');
    }

    // Calculate completed lessons and active streak
    const completedLessonsCount = await prisma.userLessonProgress.count({
      where: { user_id: userId, is_completed: true },
    });

    let activeRoadmapData: any = null;
    if (user.roadmaps.length > 0) {
      const activeRoadmap = user.roadmaps[0];

      // Đếm tổng số bài học đã xuất bản trong khóa học
      const totalRoadmapLessons = await prisma.lessons.count({
        where: {
          chapter: { course_id: activeRoadmap.course_id },
          status: 'PUBLISHED',
        },
      });

      // Đếm số bài học của khóa học này mà học viên đã hoàn thành
      const completedRoadmapLessons = await prisma.userLessonProgress.count({
        where: {
          user_id: userId,
          is_completed: true,
          lesson: {
            chapter: { course_id: activeRoadmap.course_id },
            status: 'PUBLISHED',
          },
        },
      });

      const roadmapCompletionPercentage =
        totalRoadmapLessons > 0
          ? Math.round((completedRoadmapLessons / totalRoadmapLessons) * 100)
          : 0;

      // Tìm bài học hiện tại cần học tiếp: Ưu tiên bài đang học dở ('IN_PROGRESS') trước; nếu chưa có, tìm bài mới mở khóa ('UNLOCKED')
      let currentProgress = await prisma.userLessonProgress.findFirst({
        where: {
          user_id: userId,
          status: 'IN_PROGRESS',
          is_completed: false,
          lesson: {
            chapter: { course_id: activeRoadmap.course_id },
            status: 'PUBLISHED',
          },
        },
        include: {
          lesson: {
            include: { chapter: true },
          },
        },
        orderBy: [
          { lesson: { chapter: { order_index: 'asc' } } },
          { lesson: { order_index: 'asc' } },
        ],
      });

      if (!currentProgress) {
        currentProgress = await prisma.userLessonProgress.findFirst({
          where: {
            user_id: userId,
            status: 'UNLOCKED',
            is_completed: false,
            lesson: {
              chapter: { course_id: activeRoadmap.course_id },
              status: 'PUBLISHED',
            },
          },
          include: {
            lesson: {
              include: { chapter: true },
            },
          },
          orderBy: [
            { lesson: { chapter: { order_index: 'asc' } } },
            { lesson: { order_index: 'asc' } },
          ],
        });
      }

      const currentLesson = currentProgress
        ? {
            lessonId: currentProgress.lesson.lesson_id,
            title: currentProgress.lesson.title,
            orderIndex: currentProgress.lesson.order_index,
            chapterTitle: currentProgress.lesson.chapter.title,
            estimatedDurationMins: currentProgress.lesson.estimated_duration_mins,
            status: currentProgress.status,
          }
        : null;

      activeRoadmapData = {
        // Giữ nguyên toàn bộ định dạng và thuộc tính cũ
        roadmapId: activeRoadmap.roadmap_id,
        roadmap_id: activeRoadmap.roadmap_id,
        courseId: activeRoadmap.course_id,
        course_id: activeRoadmap.course_id,
        courseTitle: activeRoadmap.course.title,
        courseCode: activeRoadmap.course.code,
        courseLevel: activeRoadmap.course.level,
        startingLevel: activeRoadmap.starting_level,
        starting_level: activeRoadmap.starting_level,
        targetGoal: activeRoadmap.target_goal,
        target_goal: activeRoadmap.target_goal,
        dailyCommitmentMins: activeRoadmap.daily_commitment_mins,
        daily_commitment_mins: activeRoadmap.daily_commitment_mins,
        daily_study_minutes: activeRoadmap.daily_commitment_mins,
        expected_duration: (activeRoadmap as any).expected_duration || user.profile?.expected_duration || null,
        expectedDuration: (activeRoadmap as any).expected_duration || user.profile?.expected_duration || null,
        expected_weeks: (activeRoadmap as any).expected_weeks || (user.profile as any)?.expected_weeks || null,
        expectedWeeks: (activeRoadmap as any).expected_weeks || (user.profile as any)?.expected_weeks || null,
        target_weeks: (activeRoadmap as any).expected_weeks || (user.profile as any)?.expected_weeks || null,
        targetWeeks: (activeRoadmap as any).expected_weeks || (user.profile as any)?.expected_weeks || null,
        reminder_time: user.notificationSettings?.reminder_time || '20:00',
        reminderTime: user.notificationSettings?.reminder_time || '20:00',
        daily_reminder_time: user.notificationSettings?.reminder_time || '20:00',
        // Bổ sung thêm các trường dữ liệu tiến độ thực tế (cả camelCase và snake_case)
        completed_lessons_count: completedRoadmapLessons,
        total_lessons_count: totalRoadmapLessons,
        completion_percentage: roadmapCompletionPercentage,
        completedLessonsCount: completedRoadmapLessons,
        totalLessonsCount: totalRoadmapLessons,
        completionPercentage: roadmapCompletionPercentage,
        current_lesson: currentLesson,
        currentLesson: currentLesson,
      };
    }

    const userProfile = user.profile;

    return {
      id: user.user_id,
      userId: user.user_id,
      email: user.email,
      fullName: user.display_name,
      full_name: user.display_name,
      displayName: user.display_name,
      display_name: user.display_name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarResource?.public_url || null,
      avatar_url: user.avatarResource?.public_url || null,
      createdAt: user.created_at,
      created_at: user.created_at,
      lastLoginAt: user.last_login_at,
      last_login_at: user.last_login_at,
      profile: userProfile
        ? {
            profileId: userProfile.profile_id,
            profile_id: userProfile.profile_id,
            goal: userProfile.goal,
            current_level: userProfile.current_level,
            expected_duration: userProfile.expected_duration,
            expected_weeks: (userProfile as any).expected_weeks,
            expectedWeeks: (userProfile as any).expected_weeks,
            target_weeks: (userProfile as any).expected_weeks,
            targetWeeks: (userProfile as any).expected_weeks,
            daily_study_minutes: userProfile.daily_study_minutes,
            phone: userProfile.phone,
            bio: userProfile.bio,
            createdAt: userProfile.created_at,
            updatedAt: userProfile.updated_at,
          }
        : null,
      goal: userProfile?.goal || activeRoadmapData?.targetGoal || null,
      target_goal: userProfile?.goal || activeRoadmapData?.targetGoal || null,
      targetGoal: userProfile?.goal || activeRoadmapData?.targetGoal || null,
      current_level: userProfile?.current_level || activeRoadmapData?.startingLevel || null,
      starting_level: userProfile?.current_level || activeRoadmapData?.startingLevel || null,
      startingLevel: userProfile?.current_level || activeRoadmapData?.startingLevel || null,
      expected_duration: userProfile?.expected_duration || activeRoadmapData?.expectedDuration || null,
      expectedDuration: userProfile?.expected_duration || activeRoadmapData?.expectedDuration || null,
      expected_weeks: (userProfile as any)?.expected_weeks || activeRoadmapData?.expectedWeeks || null,
      expectedWeeks: (userProfile as any)?.expected_weeks || activeRoadmapData?.expectedWeeks || null,
      target_weeks: (userProfile as any)?.expected_weeks || activeRoadmapData?.targetWeeks || null,
      targetWeeks: (userProfile as any)?.expected_weeks || activeRoadmapData?.targetWeeks || null,
      daily_study_minutes: userProfile?.daily_study_minutes || activeRoadmapData?.dailyCommitmentMins || 15,
      daily_commitment_mins: userProfile?.daily_study_minutes || activeRoadmapData?.dailyCommitmentMins || 15,
      dailyCommitmentMins: userProfile?.daily_study_minutes || activeRoadmapData?.dailyCommitmentMins || 15,
      reminder_time: user.notificationSettings?.reminder_time || '20:00',
      reminderTime: user.notificationSettings?.reminder_time || '20:00',
      daily_reminder_time: user.notificationSettings?.reminder_time || '20:00',
      dailyReminderTime: user.notificationSettings?.reminder_time || '20:00',
      phone: userProfile?.phone || null,
      bio: userProfile?.bio || null,
      completedLessonsCount,
      activeRoadmap: activeRoadmapData,
      active_roadmap: activeRoadmapData,
      notificationSettings: user.notificationSettings
        ? {
            reminderTime: user.notificationSettings.reminder_time,
            reminder_time: user.notificationSettings.reminder_time,
            notifyEmail: user.notificationSettings.notify_email,
            notify_email: user.notificationSettings.notify_email,
            notifyWebpush: user.notificationSettings.notify_webpush,
            notify_webpush: user.notificationSettings.notify_webpush,
          }
        : {
            reminderTime: '20:00',
            reminder_time: '20:00',
            notifyEmail: true,
            notify_email: true,
            notifyWebpush: false,
            notify_webpush: false,
          },
    };
  }

  /**
   * UC04: Tổng hợp bức tranh tiến độ toàn diện của học viên
   * - active_roadmap
   * - course_progress (tổng bài PUBLISHED, số bài COMPLETED, IN_PROGRESS, % hoàn thành, điểm quiz TB)
   * - lessons_progress (từng bài kèm status, highest_score, completed_at)
   * - next_recommended_lesson (bài IN_PROGRESS hoặc UNLOCKED có thứ tự nhỏ nhất)
   */
  async getUserProgressOverview(userId: number) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        roadmaps: {
          where: { is_active: true },
          include: { course: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy tài khoản người dùng.');
    }

    const activeRoadmap = user.roadmaps[0] || null;

    let targetCourseId: number | null | undefined = activeRoadmap?.course_id;

    if (!targetCourseId) {
      const firstCourse = await prisma.courses.findFirst({
        where: { is_published: true },
        orderBy: { course_id: 'asc' },
      });
      targetCourseId = firstCourse?.course_id ?? null;
    }

    if (!targetCourseId) {
      return {
        active_roadmap: null,
        activeRoadmap: null,
        course_progress: null,
        courseProgress: null,
        next_recommended_lesson: null,
        nextRecommendedLesson: null,
        lessons_progress: [],
        lessonsProgress: [],
      };
    }

    const course = await prisma.courses.findUnique({
      where: { course_id: targetCourseId },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học.');
    }

    // Flatten all published lessons in sequential order
    const orderedLessons: Array<{
      lesson_id: number;
      chapter_id: number;
      chapter_title: string;
      title: string;
      order_index: number;
      estimated_duration_mins: number;
    }> = [];

    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        orderedLessons.push({
          lesson_id: l.lesson_id,
          chapter_id: ch.chapter_id,
          chapter_title: ch.title,
          title: l.title,
          order_index: l.order_index,
          estimated_duration_mins: l.estimated_duration_mins,
        });
      }
    }

    // Fetch user lesson progress
    const lessonIds = orderedLessons.map((l) => l.lesson_id);
    const progressList = await prisma.userLessonProgress.findMany({
      where: {
        user_id: userId,
        lesson_id: { in: lessonIds },
      },
    });

    const progressMap = new Map<number, any>();
    progressList.forEach((p) => {
      progressMap.set(p.lesson_id, p);
    });

    // Fetch test submissions to compute average_quiz_score
    const submissions = await prisma.testSubmissions.findMany({
      where: {
        user_id: userId,
        test: {
          lesson_id: { in: lessonIds },
        },
      },
      select: { score: true },
    });

    const averageQuizScore =
      submissions.length > 0
        ? Number(
            (submissions.reduce((acc, cur) => acc + cur.score, 0) / submissions.length).toFixed(1)
          )
        : 0;

    // Compute progress & unlock status for each lesson
    const lessonProgressItems: Array<{
      lesson_id: number;
      lessonId: number;
      title: string;
      order_index: number;
      chapter_id: number;
      chapter_title: string;
      estimated_duration_mins: number;
      status: string;
      is_unlocked: boolean;
      is_completed: boolean;
      highest_score: number;
      completed_at: Date | null;
      last_studied_at: Date | null;
    }> = [];

    for (let i = 0; i < orderedLessons.length; i++) {
      const cur = orderedLessons[i];
      const prog = progressMap.get(cur.lesson_id);

      let isUnlocked = false;
      if (i === 0) {
        isUnlocked = true;
      } else if (
        prog?.is_completed ||
        (prog?.status && ['UNLOCKED', 'IN_PROGRESS', 'COMPLETED'].includes(prog.status.toUpperCase()))
      ) {
        isUnlocked = true;
      } else {
        const prev = orderedLessons[i - 1];
        const prevProg = progressMap.get(prev.lesson_id);
        if (prevProg?.is_completed) {
          isUnlocked = true;
        }
      }

      let computedStatus = 'LOCKED';
      if (prog?.is_completed) {
        computedStatus = 'COMPLETED';
      } else if (prog?.status === 'IN_PROGRESS') {
        computedStatus = 'IN_PROGRESS';
      } else if (prog?.status === 'UNLOCKED' || isUnlocked) {
        computedStatus = 'UNLOCKED';
      } else {
        computedStatus = 'LOCKED';
      }

      lessonProgressItems.push({
        lesson_id: cur.lesson_id,
        lessonId: cur.lesson_id,
        title: cur.title,
        order_index: cur.order_index,
        chapter_id: cur.chapter_id,
        chapter_title: cur.chapter_title,
        estimated_duration_mins: cur.estimated_duration_mins,
        status: computedStatus,
        is_unlocked: isUnlocked,
        is_completed: Boolean(prog?.is_completed),
        highest_score: prog?.highest_score || 0,
        completed_at: prog?.completed_at || null,
        last_studied_at: prog?.last_studied_at || null,
      });
    }

    const totalLessons = orderedLessons.length;
    const completedLessons = lessonProgressItems.filter((l) => l.is_completed).length;
    const inProgressLessons = lessonProgressItems.filter((l) => l.status === 'IN_PROGRESS').length;
    const completionPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Tìm bài học tiếp theo cần học ngay: bài đang ở trạng thái 'IN_PROGRESS' hoặc 'UNLOCKED' có thứ tự nhỏ nhất
    let nextRecommended = lessonProgressItems.find(
      (l) => l.status === 'IN_PROGRESS' && !l.is_completed
    );

    if (!nextRecommended) {
      nextRecommended = lessonProgressItems.find(
        (l) => l.status === 'UNLOCKED' && !l.is_completed
      );
    }

    if (!nextRecommended && lessonProgressItems.length > 0) {
      nextRecommended = lessonProgressItems[lessonProgressItems.length - 1];
    }

    const nextRecommendedLesson = nextRecommended
      ? {
          lesson_id: nextRecommended.lesson_id,
          lessonId: nextRecommended.lesson_id,
          title: nextRecommended.title,
          order_index: nextRecommended.order_index,
          chapter_id: nextRecommended.chapter_id,
          chapter_title: nextRecommended.chapter_title,
          estimated_duration_mins: nextRecommended.estimated_duration_mins,
          status: nextRecommended.status,
          highest_score: nextRecommended.highest_score,
        }
      : null;

    return {
      active_roadmap: activeRoadmap
        ? {
            roadmap_id: activeRoadmap.roadmap_id,
            roadmapId: activeRoadmap.roadmap_id,
            course_id: activeRoadmap.course_id,
            courseId: activeRoadmap.course_id,
            course_title: activeRoadmap.course.title,
            courseTitle: activeRoadmap.course.title,
            course_code: activeRoadmap.course.code,
            courseCode: activeRoadmap.course.code,
            course_level: activeRoadmap.course.level,
            courseLevel: activeRoadmap.course.level,
            starting_level: activeRoadmap.starting_level,
            target_goal: activeRoadmap.target_goal,
            daily_commitment_mins: activeRoadmap.daily_commitment_mins,
            is_active: activeRoadmap.is_active,
            created_at: activeRoadmap.created_at,
          }
        : null,
      course_progress: {
        course_id: course.course_id,
        course_title: course.title,
        total_lessons: totalLessons,
        totalLessons: totalLessons,
        completed_lessons: completedLessons,
        completedLessons: completedLessons,
        in_progress_lessons: inProgressLessons,
        inProgressLessons: inProgressLessons,
        completion_percentage: completionPercentage,
        completionPercentage: completionPercentage,
        average_quiz_score: averageQuizScore,
        averageQuizScore: averageQuizScore,
      },
      next_recommended_lesson: nextRecommendedLesson,
      nextRecommendedLesson: nextRecommendedLesson,
      lessons_progress: lessonProgressItems,
      lessonsProgress: lessonProgressItems,
    };
  }

  async updateProfile(
    userId: number,
    data: {
      full_name?: string;
      display_name?: string;
      avatar_url?: string | null;
      avatar_resource_id?: number | null;
      phone?: string | null;
      bio?: string | null;
      daily_study_minutes?: number;
      daily_commitment_mins?: number;
      goal?: string;
      target_goal?: string;
      expected_duration?: string;
      target_weeks?: number;
      targetWeeks?: number;
      expected_weeks?: number;
      expectedWeeks?: number;
      current_level?: string;
      starting_level?: string;
      reminder_time?: string;
      reminderTime?: string;
    }
  ) {
    let avatarResourceId: number | null | undefined = data.avatar_resource_id;

    if (data.avatar_url === '' || data.avatar_url === null) {
      avatarResourceId = null;
    } else if (data.avatar_url && !avatarResourceId) {
      const isDataUrl = data.avatar_url.startsWith('data:image/');
      const media = await prisma.mediaResources.create({
        data: {
          file_name: `avatar_${userId}_${Date.now()}.jpg`,
          storage_key: `avatars/user_${userId}_${Date.now()}`,
          public_url: data.avatar_url,
          mime_type: isDataUrl ? 'image/jpeg' : 'image/jpeg',
          resource_type: 'IMAGE',
          uploaded_by: userId,
        },
      });
      avatarResourceId = media.resource_id;
    }

    const nameToUpdate = data.full_name || data.display_name;

    const user = await prisma.users.update({
      where: { user_id: userId },
      data: {
        ...(nameToUpdate !== undefined ? { display_name: nameToUpdate } : {}),
        ...(avatarResourceId !== undefined ? { avatar_resource_id: avatarResourceId } : {}),
      },
      include: {
        avatarResource: true,
        profile: true,
        notificationSettings: true,
      },
    });

    const goal = data.goal || data.target_goal;
    const level = data.current_level || data.starting_level;
    const studyMins = data.daily_study_minutes ?? data.daily_commitment_mins;
    const weeks = data.expected_weeks || data.expectedWeeks || data.target_weeks || data.targetWeeks;
    const expectedDuration = data.expected_duration || (weeks ? `${weeks} tuần` : undefined);
    const reminderTime = data.reminder_time || data.reminderTime;

    let updatedReminderTime = user.notificationSettings?.reminder_time || '20:00';
    if (reminderTime !== undefined) {
      const notif = await prisma.notificationSettings.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          reminder_time: reminderTime,
          notify_email: true,
          notify_webpush: false,
        },
        update: {
          reminder_time: reminderTime,
        },
      });
      updatedReminderTime = notif.reminder_time;
    }

    const hasProfileUpdates =
      data.phone !== undefined ||
      data.bio !== undefined ||
      studyMins !== undefined ||
      goal !== undefined ||
      expectedDuration !== undefined ||
      weeks !== undefined ||
      level !== undefined;

    let updatedProfile = user.profile;
    if (hasProfileUpdates) {
      updatedProfile = await prisma.userProfiles.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          phone: data.phone || null,
          bio: data.bio || null,
          daily_study_minutes: studyMins || 15,
          goal: goal || null,
          expected_duration: expectedDuration || null,
          expected_weeks: weeks || null,
          current_level: level || null,
        },
        update: {
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(studyMins !== undefined ? { daily_study_minutes: studyMins } : {}),
          ...(goal !== undefined ? { goal } : {}),
          ...(expectedDuration !== undefined ? { expected_duration: expectedDuration } : {}),
          ...(weeks !== undefined ? { expected_weeks: weeks } : {}),
          ...(level !== undefined ? { current_level: level } : {}),
        },
      });

      // If daily study mins, goal, level, weeks, or expectedDuration was updated, also reflect in active roadmap
      if (
        studyMins !== undefined ||
        goal !== undefined ||
        level !== undefined ||
        weeks !== undefined ||
        expectedDuration !== undefined
      ) {
        await prisma.userRoadmaps.updateMany({
          where: { user_id: userId, is_active: true },
          data: {
            ...(studyMins !== undefined ? { daily_commitment_mins: studyMins } : {}),
            ...(goal !== undefined ? { target_goal: goal } : {}),
            ...(level !== undefined ? { starting_level: level } : {}),
            ...(weeks !== undefined ? { expected_weeks: weeks } : {}),
            ...(expectedDuration !== undefined ? { expected_duration: expectedDuration } : {}),
          },
        });
      }
    }

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'UPDATE_PROFILE',
        target_entity: 'Users',
        target_id: userId.toString(),
        new_value: JSON.stringify(data),
      },
    });

    return {
      id: user.user_id,
      userId: user.user_id,
      email: user.email,
      fullName: user.display_name,
      full_name: user.display_name,
      displayName: user.display_name,
      display_name: user.display_name,
      role: user.role,
      avatarUrl: user.avatarResource?.public_url || null,
      avatar_url: user.avatarResource?.public_url || null,
      phone: updatedProfile?.phone || null,
      bio: updatedProfile?.bio || null,
      goal: updatedProfile?.goal || null,
      target_goal: updatedProfile?.goal || null,
      targetGoal: updatedProfile?.goal || null,
      current_level: updatedProfile?.current_level || null,
      starting_level: updatedProfile?.current_level || null,
      startingLevel: updatedProfile?.current_level || null,
      expected_duration: updatedProfile?.expected_duration || null,
      expectedDuration: updatedProfile?.expected_duration || null,
      daily_study_minutes: updatedProfile?.daily_study_minutes || null,
      daily_commitment_mins: updatedProfile?.daily_study_minutes || null,
      dailyCommitmentMins: updatedProfile?.daily_study_minutes || null,
      reminder_time: updatedReminderTime,
      reminderTime: updatedReminderTime,
      daily_reminder_time: updatedReminderTime,
      profile: updatedProfile
        ? {
            profileId: updatedProfile.profile_id,
            profile_id: updatedProfile.profile_id,
            phone: updatedProfile.phone,
            bio: updatedProfile.bio,
            goal: updatedProfile.goal,
            current_level: updatedProfile.current_level,
            expected_duration: updatedProfile.expected_duration,
            daily_study_minutes: updatedProfile.daily_study_minutes,
            updatedAt: updatedProfile.updated_at,
          }
        : null,
    };
  }

  /**
   * UC02: Khảo sát mục tiêu và thiết lập lộ trình cá nhân hóa (RoadmapRuleEngine)
   */
  async submitOnboarding(userId: number, data: OnboardingSurveyInput) {
    // 1. Lấy danh sách khóa học, chương học và bài học đã phát hành để làm dữ liệu cho engine
    const courses = (await prisma.courses.findMany({
      where: { is_published: true },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
      orderBy: { course_id: 'asc' },
    })) as CourseCurriculumItem[];

    if (courses.length === 0) {
      throw AppError.badRequest('Hệ thống hiện chưa có khóa học nào được kích hoạt.');
    }

    // 2. Chạy thuật toán khớp lộ trình cá nhân hóa
    const matched = RoadmapRuleEngine.matchRoadmap(data, courses);

    // 3. Thực thi lưu trữ nguyên tử trong transaction
    const result = await prisma.$transaction(async (tx) => {
      // 3.0. Lưu / cập nhật (upsert) đầy đủ thông tin khảo sát vào bảng user_profiles theo userId
      const surveyWeeks = data.expected_weeks || data.target_weeks || data.expectedWeeks || data.targetWeeks;
      const durationStr = data.expected_duration || (surveyWeeks ? `${surveyWeeks} tuần` : '8 tuần');

      const surveyProfile = await tx.userProfiles.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          goal: data.goal || data.target_goal,
          current_level: data.current_level || data.starting_level,
          expected_duration: durationStr,
          expected_weeks: surveyWeeks || null,
          daily_study_minutes: data.daily_study_minutes || matched.dailyCommitmentMins,
        },
        update: {
          goal: data.goal || data.target_goal,
          current_level: data.current_level || data.starting_level,
          expected_duration: durationStr,
          ...(surveyWeeks !== undefined ? { expected_weeks: surveyWeeks } : {}),
          daily_study_minutes: data.daily_study_minutes || matched.dailyCommitmentMins,
        },
      });

      // 3.1. Vô hiệu hóa lộ trình đang hoạt động trước đó (nếu có)
      await tx.userRoadmaps.updateMany({
        where: { user_id: userId, is_active: true },
        data: { is_active: false },
      });

      // 3.2. Tạo lộ trình cá nhân hóa mới
      const roadmap = await tx.userRoadmaps.create({
        data: {
          user_id: userId,
          course_id: matched.courseId,
          starting_level: data.starting_level,
          target_goal: data.target_goal,
          daily_commitment_mins: matched.dailyCommitmentMins,
          expected_weeks: surveyWeeks || null,
          expected_duration: durationStr,
          is_active: true,
        },
        include: { course: true },
      });

      // 3.3. Cập nhật hoặc khởi tạo cài đặt nhắc học
      const notifSettings = await tx.notificationSettings.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          reminder_time: matched.reminderTime,
          notify_email: true,
          notify_webpush: false,
        },
        update: {
          reminder_time: matched.reminderTime,
        },
      });

      // 3.4. Khởi tạo trạng thái tiến độ bài học (UserLessonProgress)
      // Mở khóa các bài học ban đầu (UNLOCKED) nếu chưa COMPLETED
      for (const lessonId of matched.initialUnlockedLessonIds) {
        const existing = await tx.userLessonProgress.findUnique({
          where: {
            user_id_lesson_id: {
              user_id: userId,
              lesson_id: lessonId,
            },
          },
        });

        if (!existing) {
          await tx.userLessonProgress.create({
            data: {
              user_id: userId,
              lesson_id: lessonId,
              status: 'UNLOCKED',
              is_completed: false,
              highest_score: 0,
            },
          });
        } else if (!existing.is_completed && (existing.status === 'LOCKED' || !existing.status)) {
          await tx.userLessonProgress.update({
            where: { progress_id: existing.progress_id },
            data: { status: 'UNLOCKED' },
          });
        }
      }

      // 3.5. Ghi sự kiện vào bảng OutboxMessages (Transactional Outbox Pattern)
      await tx.outboxMessages.create({
        data: {
          aggregate_type: 'ONBOARDING',
          aggregate_id: String(userId),
          event_type: 'ROADMAP_CREATED',
          payload: JSON.stringify({
            userId,
            roadmapId: roadmap.roadmap_id,
            courseId: matched.courseId,
            courseTitle: matched.courseTitle,
            courseCode: matched.courseCode,
            courseLevel: matched.courseLevel,
            startingLevel: data.starting_level,
            targetGoal: data.target_goal,
            dailyCommitmentMins: matched.dailyCommitmentMins,
            reminderTime: matched.reminderTime,
            recommendedFirstLessonId: matched.recommendedFirstLessonId,
            initialUnlockedLessonIds: matched.initialUnlockedLessonIds,
            estimatedDays: matched.estimatedDays,
            lessonsPerWeek: matched.lessonsPerWeek,
            weeklyMilestones: matched.weeklyMilestones,
            isSkip: Boolean(data.skip),
            timestamp: new Date().toISOString(),
          }),
          status: 'PENDING',
        },
      });

      // 3.6. Ghi nhật ký kiểm toán (AuditLogs)
      await tx.auditLogs.create({
        data: {
          user_id: userId,
          action_type: 'ONBOARDING_SURVEY_COMPLETED',
          target_entity: 'UserRoadmaps',
          target_id: roadmap.roadmap_id.toString(),
          new_value: JSON.stringify({
            roadmapId: roadmap.roadmap_id,
            courseId: matched.courseId,
            recommendedFirstLessonId: matched.recommendedFirstLessonId,
            initialUnlockedLessonIds: matched.initialUnlockedLessonIds,
            estimatedDays: matched.estimatedDays,
            isSkip: Boolean(data.skip),
          }),
        },
      });

      // 3.7. Lấy chi tiết bài học khuyến nghị bắt đầu
      let recommendedFirstLessonDetail: any = null;
      if (matched.recommendedFirstLessonId) {
        const lesson = await tx.lessons.findUnique({
          where: { lesson_id: matched.recommendedFirstLessonId },
          include: { chapter: true },
        });
        if (lesson) {
          recommendedFirstLessonDetail = {
            lessonId: lesson.lesson_id,
            title: lesson.title,
            orderIndex: lesson.order_index,
            chapterId: lesson.chapter_id,
            chapterTitle: lesson.chapter.title,
            estimatedDurationMins: lesson.estimated_duration_mins,
            status: 'UNLOCKED',
          };
        }
      }

      return {
        profile: {
          profileId: surveyProfile.profile_id,
          profile_id: surveyProfile.profile_id,
          goal: surveyProfile.goal,
          current_level: surveyProfile.current_level,
          expected_duration: surveyProfile.expected_duration,
          expected_weeks: (surveyProfile as any).expected_weeks,
          expectedWeeks: (surveyProfile as any).expected_weeks,
          target_weeks: (surveyProfile as any).expected_weeks,
          targetWeeks: (surveyProfile as any).expected_weeks,
          daily_study_minutes: surveyProfile.daily_study_minutes,
        },
        roadmap: {
          roadmapId: roadmap.roadmap_id,
          roadmap_id: roadmap.roadmap_id,
          courseId: matched.courseId,
          course_id: matched.courseId,
          courseTitle: matched.courseTitle,
          courseCode: matched.courseCode,
          courseLevel: matched.courseLevel,
          startingLevel: roadmap.starting_level,
          starting_level: roadmap.starting_level,
          targetGoal: roadmap.target_goal,
          target_goal: roadmap.target_goal,
          dailyCommitmentMins: roadmap.daily_commitment_mins,
          daily_commitment_mins: roadmap.daily_commitment_mins,
          daily_study_minutes: roadmap.daily_commitment_mins,
          expected_duration: durationStr,
          expectedDuration: durationStr,
          expected_weeks: surveyWeeks || null,
          expectedWeeks: surveyWeeks || null,
          target_weeks: surveyWeeks || null,
          targetWeeks: surveyWeeks || null,
          isActive: roadmap.is_active,
          is_active: roadmap.is_active,
          createdAt: roadmap.created_at,
          estimatedDays: matched.estimatedDays,
          lessonsPerWeek: matched.lessonsPerWeek,
          totalLessons: matched.totalLessons,
          learningFocus: matched.learningFocus,
          reminder_time: notifSettings.reminder_time,
          reminderTime: notifSettings.reminder_time,
        },
        notification_settings: {
          reminderTime: notifSettings.reminder_time,
          reminder_time: notifSettings.reminder_time,
          notifyEmail: notifSettings.notify_email,
          notify_email: notifSettings.notify_email,
          notifyWebpush: notifSettings.notify_webpush,
          notify_webpush: notifSettings.notify_webpush,
        },
        reminder_time: notifSettings.reminder_time,
        reminderTime: notifSettings.reminder_time,
        daily_reminder_time: notifSettings.reminder_time,
        recommended_first_lesson: recommendedFirstLessonDetail,
        recommendedFirstLessonId: matched.recommendedFirstLessonId,
        initial_unlocked_lesson_ids: matched.initialUnlockedLessonIds,
        weekly_milestones: matched.weeklyMilestones,
      };
    });

    return result;
  }

  /**
   * Xem trước lộ trình đề xuất (Preview Onboarding Roadmap) - Không ghi vào DB
   */
  async previewOnboarding(data: OnboardingSurveyInput) {
    const courses = (await prisma.courses.findMany({
      where: { is_published: true },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
      orderBy: { course_id: 'asc' },
    })) as CourseCurriculumItem[];

    if (courses.length === 0) {
      throw AppError.badRequest('Hệ thống hiện chưa có khóa học nào được kích hoạt.');
    }

    const matched = RoadmapRuleEngine.matchRoadmap(data, courses);

    let recommendedFirstLessonDetail: any = null;
    if (matched.recommendedFirstLessonId) {
      const lesson = await prisma.lessons.findUnique({
        where: { lesson_id: matched.recommendedFirstLessonId },
        include: { chapter: true },
      });
      if (lesson) {
        recommendedFirstLessonDetail = {
          lessonId: lesson.lesson_id,
          title: lesson.title,
          orderIndex: lesson.order_index,
          chapterId: lesson.chapter_id,
          chapterTitle: lesson.chapter.title,
          estimatedDurationMins: lesson.estimated_duration_mins,
          status: 'UNLOCKED',
        };
      }
    }

    return {
      courseId: matched.courseId,
      courseTitle: matched.courseTitle,
      courseCode: matched.courseCode,
      courseLevel: matched.courseLevel,
      startingLevel: matched.startingLevel,
      targetGoal: matched.targetGoal,
      dailyCommitmentMins: matched.dailyCommitmentMins,
      reminderTime: matched.reminderTime,
      estimatedDays: matched.estimatedDays,
      lessonsPerWeek: matched.lessonsPerWeek,
      totalLessons: matched.totalLessons,
      targetWeeks: data.expected_weeks || data.target_weeks || data.expectedWeeks || data.targetWeeks || Math.ceil(matched.estimatedDays / 7),
      target_weeks: data.expected_weeks || data.target_weeks || data.expectedWeeks || data.targetWeeks || Math.ceil(matched.estimatedDays / 7),
      learningFocus: matched.learningFocus,
      initialUnlockedLessonIds: matched.initialUnlockedLessonIds,
      recommended_first_lesson: recommendedFirstLessonDetail,
      recommendedFirstLessonId: matched.recommendedFirstLessonId,
      weekly_milestones: matched.weeklyMilestones,
    };
  }

  /**
   * Truy xuất lộ trình đang hoạt động (Active Roadmap) kèm tiến độ học tập thực tế
   */
  async getActiveRoadmap(userId: number) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        profile: true,
        roadmaps: {
          where: { is_active: true },
          include: { course: true },
          take: 1,
        },
        notificationSettings: true,
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy tài khoản người dùng.');
    }

    const activeRoadmap = user.roadmaps[0];
    if (!activeRoadmap) {
      return null;
    }

    // Lấy thông tin chi tiết khóa học, chương và các bài học PUBLISHED
    const course = await prisma.courses.findUnique({
      where: { course_id: activeRoadmap.course_id },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học của lộ trình.');
    }

    // Lấy danh sách khóa học để chạy engine tính milestone chuẩn
    const courses = (await prisma.courses.findMany({
      where: { is_published: true },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
      orderBy: { course_id: 'asc' },
    })) as CourseCurriculumItem[];

    const matched = RoadmapRuleEngine.matchRoadmap(
      {
        starting_level: activeRoadmap.starting_level as any,
        target_goal: activeRoadmap.target_goal as any,
        daily_commitment_mins: activeRoadmap.daily_commitment_mins,
        reminder_time: user.notificationSettings?.reminder_time || '20:00',
        course_id: activeRoadmap.course_id,
      },
      courses
    );

    // Thu thập toàn bộ bài học theo thứ tự học
    const flatLessons: Array<{
      lesson_id: number;
      chapter_id: number;
      chapter_title: string;
      title: string;
      order_index: number;
      estimated_duration_mins: number;
    }> = [];

    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        flatLessons.push({
          lesson_id: l.lesson_id,
          chapter_id: ch.chapter_id,
          chapter_title: ch.title,
          title: l.title,
          order_index: l.order_index,
          estimated_duration_mins: l.estimated_duration_mins,
        });
      }
    }

    // Lấy tiến độ học tập thực tế của học viên trên các bài học này
    const lessonIds = flatLessons.map((l) => l.lesson_id);
    const progressList = await prisma.userLessonProgress.findMany({
      where: {
        user_id: userId,
        lesson_id: { in: lessonIds },
      },
    });

    const progressMap = new Map<
      number,
      {
        status: string;
        is_completed: boolean;
        highest_score: number | null;
        completed_at: Date | null;
        last_studied_at: Date;
      }
    >();

    progressList.forEach((p) => {
      progressMap.set(p.lesson_id, {
        status: p.status || (p.is_completed ? 'COMPLETED' : 'LOCKED'),
        is_completed: p.is_completed,
        highest_score: p.highest_score,
        completed_at: p.completed_at,
        last_studied_at: p.last_studied_at,
      });
    });

    const totalLessonsCount = flatLessons.length;
    const completedLessonsCount = flatLessons.filter(
      (l) => progressMap.get(l.lesson_id)?.is_completed
    ).length;
    const completionPercentage =
      totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    // Xác định bài học hiện tại (current_lesson): bài UNLOCKED đầu tiên chưa hoàn thành
    let currentLessonItem = flatLessons.find((l) => {
      const p = progressMap.get(l.lesson_id);
      return !p?.is_completed && p?.status === 'UNLOCKED';
    });

    if (!currentLessonItem) {
      currentLessonItem = flatLessons.find((l) => !progressMap.get(l.lesson_id)?.is_completed);
    }
    if (!currentLessonItem && flatLessons.length > 0) {
      currentLessonItem = flatLessons[flatLessons.length - 1];
    }

    const currentLesson = currentLessonItem
      ? {
          lessonId: currentLessonItem.lesson_id,
          title: currentLessonItem.title,
          orderIndex: currentLessonItem.order_index,
          chapterId: currentLessonItem.chapter_id,
          chapterTitle: currentLessonItem.chapter_title,
          estimatedDurationMins: currentLessonItem.estimated_duration_mins,
          status: progressMap.get(currentLessonItem.lesson_id)?.status || 'UNLOCKED',
          isCompleted: progressMap.get(currentLessonItem.lesson_id)?.is_completed || false,
          highestScore: progressMap.get(currentLessonItem.lesson_id)?.highest_score || 0,
        }
      : null;

    // Tiến độ theo từng chương (chapters_progress)
    const chaptersProgress = course.chapters.map((ch) => {
      const chLessons = ch.lessons;
      const chCompleted = chLessons.filter(
        (l) => progressMap.get(l.lesson_id)?.is_completed
      ).length;
      return {
        chapterId: ch.chapter_id,
        title: ch.title,
        orderIndex: ch.order_index,
        totalLessons: chLessons.length,
        completedLessons: chCompleted,
        isCompleted: chLessons.length > 0 && chCompleted === chLessons.length,
      };
    });

    // Làm giàu weekly_milestones với dữ liệu tiến độ thực tế của từng bài
    const enrichedMilestones = matched.weeklyMilestones.map((m) => {
      const milestoneLessons = m.lessonIds.map((id) => {
        const l = flatLessons.find((item) => item.lesson_id === id);
        const p = progressMap.get(id);
        return {
          lessonId: id,
          title: l?.title || '',
          chapterTitle: l?.chapter_title || '',
          estimatedDurationMins: l?.estimated_duration_mins || 15,
          status: p?.status || 'LOCKED',
          isCompleted: p?.is_completed || false,
          highestScore: p?.highest_score || 0,
        };
      });
      const compCount = milestoneLessons.filter((l) => l.isCompleted).length;
      return {
        ...m,
        completedLessonsCount: compCount,
        isCompleted: milestoneLessons.length > 0 && compCount === milestoneLessons.length,
        lessons: milestoneLessons,
      };
    });

    const activeRm = activeRoadmap as any;
    const userProf = user.profile as any;
    const chosenWeeks =
      activeRm.expected_weeks ||
      userProf?.expected_weeks ||
      (activeRm.expected_duration ? parseInt(activeRm.expected_duration, 10) : null) ||
      (userProf?.expected_duration ? parseInt(userProf.expected_duration, 10) : null) ||
      Math.ceil(matched.estimatedDays / 7);

    const durationStr =
      activeRm.expected_duration ||
      userProf?.expected_duration ||
      (chosenWeeks ? `${chosenWeeks} tuần` : `${Math.ceil(matched.estimatedDays / 7)} tuần`);
    const weeksNum = chosenWeeks;
    const reminderTime = user.notificationSettings?.reminder_time || '20:00';

    return {
      roadmapId: activeRoadmap.roadmap_id,
      roadmap_id: activeRoadmap.roadmap_id,
      courseId: activeRoadmap.course_id,
      course_id: activeRoadmap.course_id,
      courseTitle: activeRoadmap.course.title,
      courseCode: activeRoadmap.course.code,
      courseLevel: activeRoadmap.course.level,
      startingLevel: activeRoadmap.starting_level,
      starting_level: activeRoadmap.starting_level,
      targetGoal: activeRoadmap.target_goal,
      target_goal: activeRoadmap.target_goal,
      dailyCommitmentMins: activeRoadmap.daily_commitment_mins,
      daily_commitment_mins: activeRoadmap.daily_commitment_mins,
      daily_study_minutes: activeRoadmap.daily_commitment_mins,
      dailyStudyMinutes: activeRoadmap.daily_commitment_mins,
      expected_duration: durationStr,
      expectedDuration: durationStr,
      expected_weeks: weeksNum,
      expectedWeeks: weeksNum,
      target_weeks: weeksNum,
      targetWeeks: weeksNum,
      reminder_time: reminderTime,
      reminderTime: reminderTime,
      daily_reminder_time: reminderTime,
      dailyReminderTime: reminderTime,
      isActive: activeRoadmap.is_active,
      is_active: activeRoadmap.is_active,
      createdAt: activeRoadmap.created_at,
      created_at: activeRoadmap.created_at,
      completed_lessons_count: completedLessonsCount,
      total_lessons_count: totalLessonsCount,
      completion_percentage: completionPercentage,
      completedLessonsCount,
      totalLessonsCount,
      completionPercentage,
      current_lesson: currentLesson,
      currentLesson,
      estimatedDays: matched.estimatedDays,
      lessonsPerWeek: matched.lessonsPerWeek,
      learningFocus: matched.learningFocus,
      chaptersProgress,
      weekly_milestones: enrichedMilestones,
      weeklyMilestones: enrichedMilestones,
      notificationSettings: user.notificationSettings
        ? {
            reminderTime: user.notificationSettings.reminder_time,
            reminder_time: user.notificationSettings.reminder_time,
            notifyEmail: user.notificationSettings.notify_email,
            notify_email: user.notificationSettings.notify_email,
            notifyWebpush: user.notificationSettings.notify_webpush,
            notify_webpush: user.notificationSettings.notify_webpush,
          }
        : {
            reminderTime: '20:00',
            reminder_time: '20:00',
            notifyEmail: true,
            notify_email: true,
            notifyWebpush: false,
            notify_webpush: false,
          },
      roadmap: {
        roadmapId: activeRoadmap.roadmap_id,
        roadmap_id: activeRoadmap.roadmap_id,
        courseId: activeRoadmap.course_id,
        course_id: activeRoadmap.course_id,
        courseTitle: activeRoadmap.course.title,
        courseCode: activeRoadmap.course.code,
        courseLevel: activeRoadmap.course.level,
        startingLevel: activeRoadmap.starting_level,
        starting_level: activeRoadmap.starting_level,
        targetGoal: activeRoadmap.target_goal,
        target_goal: activeRoadmap.target_goal,
        dailyCommitmentMins: activeRoadmap.daily_commitment_mins,
        daily_commitment_mins: activeRoadmap.daily_commitment_mins,
        daily_study_minutes: activeRoadmap.daily_commitment_mins,
        expected_duration: durationStr,
        expectedDuration: durationStr,
        target_weeks: weeksNum,
        targetWeeks: weeksNum,
        reminder_time: reminderTime,
        reminderTime: reminderTime,
        daily_reminder_time: reminderTime,
        dailyReminderTime: reminderTime,
        isActive: activeRoadmap.is_active,
        is_active: activeRoadmap.is_active,
        createdAt: activeRoadmap.created_at,
        created_at: activeRoadmap.created_at,
      },
    };
  }

  /**
   * UC03: Cập nhật cài đặt thông báo nhắc học
   */
  async updateNotificationSettings(
    userId: number,
    data: { reminder_time?: string; notify_email?: boolean; notify_webpush?: boolean }
  ) {
    const settings = await prisma.notificationSettings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        reminder_time: data.reminder_time || '20:00',
        notify_email: data.notify_email ?? true,
        notify_webpush: data.notify_webpush ?? false,
      },
      update: {
        reminder_time: data.reminder_time,
        notify_email: data.notify_email,
        notify_webpush: data.notify_webpush,
      },
    });

    return settings;
  }

  /**
   * RBAC Admin: Quản lý danh sách người dùng và phân quyền
   */
  async adminListUsers(query: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { display_name: { contains: query.search } },
      ];
    }

    const [total, users, totalUsers, activeUsers, adminCount, editorCount, lockedCount] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          email: true,
          display_name: true,
          role: true,
          status: true,
          created_at: true,
          last_login_at: true,
        },
      }),
      prisma.users.count(),
      prisma.users.count({ where: { status: 'ACTIVE' } }),
      prisma.users.count({ where: { role: 'ADMIN' } }),
      prisma.users.count({ where: { role: 'CONTENT_EDITOR' } }),
      prisma.users.count({ where: { status: { in: ['LOCKED', 'BANNED'] } } }),
    ]);

    return {
      users,
      summary: {
        totalUsers,
        activeUsers,
        adminCount,
        editorCount,
        lockedCount,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * RBAC Admin: Truy xuất nhật ký kiểm toán bảo mật & phân quyền (Audit Logs)
   */
  async adminListAuditLogs(limit: number = 25) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const logs = await prisma.auditLogs.findMany({
      take: safeLimit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            display_name: true,
            role: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      logId: log.log_id,
      actionType: log.action_type,
      targetEntity: log.target_entity,
      targetId: log.target_id,
      oldValue: log.old_value,
      newValue: log.new_value,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
      actor: log.user
        ? {
            userId: log.user.user_id,
            email: log.user.email,
            displayName: log.user.display_name,
            role: log.user.role,
          }
        : null,
    }));
  }

  async adminUpdateUser(adminId: number, targetUserId: number, data: { role?: string; status?: string }) {
    // Prevent self-demotion or self-lockout
    if (adminId === targetUserId) {
      if (data.status === 'LOCKED' || data.status === 'BANNED') {
        throw AppError.badRequest('Quản trị viên không thể tự khóa tài khoản của chính mình.');
      }
      if (data.role && data.role !== 'ADMIN') {
        throw AppError.badRequest('Quản trị viên không thể tự hạ quyền của chính mình.');
      }
    }

    const existingTarget = await prisma.users.findUnique({
      where: { user_id: targetUserId },
      select: { role: true, status: true },
    });

    if (!existingTarget) {
      throw AppError.notFound('Không tìm thấy tài khoản người dùng cần cập nhật.');
    }

    const user = await prisma.users.update({
      where: { user_id: targetUserId },
      data: {
        role: data.role,
        status: data.status,
      },
    });

    // If account was locked or banned, revoke all their active sessions immediately
    if (data.status === 'LOCKED' || data.status === 'BANNED') {
      await prisma.userSessions.updateMany({
        where: { user_id: targetUserId },
        data: { is_revoked: true },
      });
    }

    await prisma.auditLogs.create({
      data: {
        user_id: adminId,
        action_type: 'ADMIN_UPDATE_USER',
        target_entity: 'Users',
        target_id: targetUserId.toString(),
        old_value: JSON.stringify(existingTarget),
        new_value: JSON.stringify(data),
      },
    });

    return user;
  }

  /**
   * Bảng xếp hạng tuần thực tế từ dữ liệu học tập trong DB (Thứ 2 00:00 → Chủ nhật 23:59)
   * Quy đổi XP minh bạch:
   * - Hoàn thành 1 bài học: +50 XP
   * - Làm bài kiểm tra / đề thi: +0.6 * điểm% (tối đa +60 XP, thưởng thêm +20 XP nếu đạt)
   * - Luyện viết chữ Hán / Pinyin đạt: +10 XP
   * - Ôn thẻ nhớ SRS: +5 XP / thẻ
   */
  async getWeeklyLeaderboard(currentUserId: number) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const users = await prisma.users.findMany({
      where: {
        status: 'ACTIVE',
        role: 'STUDENT',
      },
      select: {
        user_id: true,
        display_name: true,
        avatarResource: { select: { public_url: true } },
        roadmaps: {
          where: { is_active: true },
          take: 1,
          select: {
            target_goal: true,
            starting_level: true,
            course: { select: { level: true } },
          },
        },
        lessonProgress: {
          select: {
            is_completed: true,
            completed_at: true,
            last_studied_at: true,
          },
        },
        submissions: {
          select: {
            score: true,
            is_passed: true,
            submitted_at: true,
          },
        },
        practices: {
          where: { is_successful: true },
          select: {
            practiced_at: true,
          },
        },
        srsItems: {
          where: { last_reviewed_at: { not: null } },
          select: {
            last_reviewed_at: true,
          },
        },
      },
    });

    const toDateKey = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const computeStreak = (dates: Date[]): number => {
      if (dates.length === 0) return 0;
      const uniqueDays = new Set(dates.map(toDateKey));
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);

      // Allow streak to continue if user studied today OR yesterday
      if (!uniqueDays.has(toDateKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
        if (!uniqueDays.has(toDateKey(cursor))) return 0;
      }

      let streak = 0;
      while (uniqueDays.has(toDateKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return streak;
    };

    const formatLevel = (raw?: string | null): string => {
      if (!raw) return 'HSK 1';
      const upper = raw.toUpperCase();
      if (/^HSK\d$/.test(upper)) return upper.replace('HSK', 'HSK ');
      return 'HSK 1';
    };

    const ranked = users.map((u) => {
      const activityDates: Date[] = [];

      let weeklyXp = 0;
      let totalXp = 0;
      let weeklyLessons = 0;
      let totalCompletedLessons = 0;

      for (const lp of u.lessonProgress) {
        if (lp.last_studied_at) activityDates.push(lp.last_studied_at);
        if (lp.is_completed) {
          totalCompletedLessons++;
          totalXp += 50;
          const refDate = lp.completed_at || lp.last_studied_at;
          if (refDate && refDate >= weekStart) {
            weeklyLessons++;
            weeklyXp += 50;
          }
        }
      }

      for (const sub of u.submissions) {
        activityDates.push(sub.submitted_at);
        const subXp = Math.round((sub.score || 0) * 0.6) + (sub.is_passed ? 20 : 0);
        totalXp += subXp;
        if (sub.submitted_at >= weekStart) {
          weeklyXp += subXp;
        }
      }

      for (const pr of u.practices) {
        activityDates.push(pr.practiced_at);
        totalXp += 10;
        if (pr.practiced_at >= weekStart) {
          weeklyXp += 10;
        }
      }

      for (const srs of u.srsItems) {
        if (srs.last_reviewed_at) {
          activityDates.push(srs.last_reviewed_at);
          totalXp += 5;
          if (srs.last_reviewed_at >= weekStart) {
            weeklyXp += 5;
          }
        }
      }

      const activeRoadmap = u.roadmaps[0];
      const level = formatLevel(activeRoadmap?.course?.level || activeRoadmap?.target_goal);
      const streak = computeStreak(activityDates);

      return {
        userId: u.user_id,
        displayName: u.display_name,
        avatarUrl: u.avatarResource?.public_url || null,
        level,
        weeklyXp,
        totalXp,
        streak,
        weeklyLessons,
        completedLessons: totalCompletedLessons,
        isCurrentUser: u.user_id === currentUserId,
      };
    });

    ranked.sort((a, b) => {
      if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
      if (b.streak !== a.streak) return b.streak - a.streak;
      if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
      return a.userId - b.userId;
    });

    const withRanks = ranked.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

    const currentUser = withRanks.find((e) => e.userId === currentUserId) || null;
    const leaders = withRanks.slice(0, 20);

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalParticipants: withRanks.length,
      leaders,
      currentUser,
    };
  }
}

export const userService = new UserService();
