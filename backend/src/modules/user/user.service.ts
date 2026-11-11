import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';
import type {
  CreateRoadmapProposalInput,
  LearningSurveyInput,
} from './user.dto';

export class UserService {
  private formatRoadmap(roadmap: any) {
    return {
      roadmapId: roadmap.roadmap_id,
      courseId: roadmap.course_id,
      courseTitle: roadmap.course.title,
      courseCode: roadmap.course.code,
      courseLevel: roadmap.course.level,
      startingLevel: roadmap.starting_level,
      targetGoal: roadmap.target_goal,
      dailyCommitmentMins: roadmap.daily_commitment_mins,
      expectedDurationMonths: roadmap.expected_duration_months,
      status: roadmap.status,
      isActive: roadmap.is_active,
      confirmedAt: roadmap.confirmed_at,
      createdAt: roadmap.created_at,
      updatedAt: roadmap.updated_at,
    };
  }

  async getProfile(userId: number) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        notificationSettings: true,
        roadmaps: {
          where: { is_active: true },
          include: { course: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        avatarResource: true,
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng.');
    }

    const completedLessonsCount = await prisma.userLessonProgress.count({
      where: { user_id: userId, is_completed: true },
    });

    const activeRoadmap = user.roadmaps[0] ?? null;

    return {
      userId: user.user_id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarResource?.public_url ?? null,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      completedLessonsCount,
      activeRoadmap: activeRoadmap
        ? {
          roadmapId: activeRoadmap.roadmap_id,
          courseId: activeRoadmap.course_id,
          courseTitle: activeRoadmap.course.title,
          courseLevel: activeRoadmap.course.level,
          startingLevel: activeRoadmap.starting_level,
          targetGoal: activeRoadmap.target_goal,
          dailyCommitmentMins: activeRoadmap.daily_commitment_mins,
          expectedDurationMonths: activeRoadmap.expected_duration_months,
          status: activeRoadmap.status,
          confirmedAt: activeRoadmap.confirmed_at,
        }
        : null,
      notificationSettings: user.notificationSettings
        ? {
          reminderTime: user.notificationSettings.reminder_time,
          notifyEmail: user.notificationSettings.notify_email,
          notifyWebpush: user.notificationSettings.notify_webpush,
        }
        : null,
    };
  }

  async updateProfile(
    userId: number,
    data: {
      display_name?: string;
      avatar_url?: string;
      avatar_resource_id?: number;
    }
  ) {
    const oldUser = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { display_name: true, avatar_resource_id: true },
    });

    if (!oldUser) {
      throw AppError.notFound('Không tìm thấy người dùng.');
    }

    let avatarResourceId = data.avatar_resource_id;

    if (data.avatar_url && !avatarResourceId) {
      const timestamp = Date.now();
      const media = await prisma.mediaResources.create({
        data: {
          file_name: `avatar_${userId}_${timestamp}.jpg`,
          storage_key: `avatars/user_${userId}_${timestamp}`,
          public_url: data.avatar_url,
          mime_type: 'image/jpeg',
          resource_type: 'IMAGE',
          uploaded_by: userId,
        },
      });
      avatarResourceId = media.resource_id;
    }

    const user = await prisma.users.update({
      where: { user_id: userId },
      data: {
        ...(data.display_name !== undefined
          ? { display_name: data.display_name }
          : {}),
        ...(avatarResourceId !== undefined
          ? { avatar_resource_id: avatarResourceId }
          : {}),
      },
      include: { avatarResource: true },
    });

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'UPDATE_PROFILE',
        target_entity: 'Users',
        target_id: userId.toString(),
        old_value: JSON.stringify(oldUser),
        new_value: JSON.stringify(data),
      },
    });

    return {
      userId: user.user_id,
      displayName: user.display_name,
      avatarUrl: user.avatarResource?.public_url ?? null,
    };
  }

  async submitOnboarding(
    userId: number,
    data: {
      starting_level: string;
      target_goal: string;
      daily_commitment_mins: number;
      reminder_time: string;
      course_id?: number;
    }
  ) {
    let targetCourseId = data.course_id;

    if (!targetCourseId) {
      const course = await prisma.courses.findFirst({
        where: { level: data.target_goal === 'HSK2' ? 'HSK2' : 'HSK1' },
      });
      targetCourseId = course?.course_id;
    }

    if (!targetCourseId) {
      const fallbackCourse = await prisma.courses.findFirst();
      targetCourseId = fallbackCourse?.course_id;
    }

    if (!targetCourseId) {
      throw AppError.notFound('Không tìm thấy khóa học để tạo lộ trình.');
    }

    const roadmap = await prisma.$transaction(async (tx) => {
      await tx.userRoadmaps.updateMany({
        where: { user_id: userId, is_active: true },
        data: { is_active: false, status: 'REPLACED' },
      });

      const created = await tx.userRoadmaps.create({
        data: {
          user_id: userId,
          course_id: targetCourseId,
          starting_level: data.starting_level,
          target_goal: data.target_goal,
          daily_commitment_mins: data.daily_commitment_mins,
          status: 'CONFIRMED',
          is_active: true,
          confirmed_at: new Date(),
        },
        include: { course: true },
      });

      await tx.notificationSettings.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          reminder_time: data.reminder_time,
          notify_email: true,
          notify_webpush: false,
        },
        update: { reminder_time: data.reminder_time },
      });

      await tx.auditLogs.create({
        data: {
          user_id: userId,
          action_type: 'ONBOARDING_SURVEY_COMPLETED',
          target_entity: 'UserRoadmaps',
          target_id: created.roadmap_id.toString(),
          new_value: JSON.stringify(data),
        },
      });

      return created;
    });

    return {
      roadmapId: roadmap.roadmap_id,
      courseTitle: roadmap.course.title,
      targetGoal: roadmap.target_goal,
      dailyCommitmentMins: roadmap.daily_commitment_mins,
      status: roadmap.status,
      isActive: roadmap.is_active,
      reminderTime: data.reminder_time,
    };
  }

  async getLearningSurvey(userId: number) {
    const survey = await prisma.userLearningSurveys.findUnique({
      where: { user_id: userId },
    });

    if (!survey) return null;

    let learningPurposes: string[] = [];
    let preferredSkills: string[] = [];

    try {
      const parsed = JSON.parse(survey.learning_purposes_json);
      learningPurposes = Array.isArray(parsed) ? parsed : [];
    } catch {
      learningPurposes = [];
    }

    try {
      const parsed = survey.preferred_skills_json
        ? JSON.parse(survey.preferred_skills_json)
        : [];
      preferredSkills = Array.isArray(parsed) ? parsed : [];
    } catch {
      preferredSkills = [];
    }

    return {
      surveyId: survey.survey_id,
      currentLevel: survey.current_level,
      targetGoal: survey.target_goal,
      expectedDurationMonths: survey.expected_duration_months,
      dailyAvailableMinutes: survey.daily_available_minutes,
      learningPurposes,
      preferredSkills,
      createdAt: survey.created_at,
      updatedAt: survey.updated_at,
    };
  }

  async upsertLearningSurvey(userId: number, data: LearningSurveyInput) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { user_id: true, status: true },
    });

    if (!user) throw AppError.notFound('Không tìm thấy người dùng.');
    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden('Tài khoản không ở trạng thái hoạt động.');
    }

    const previousSurvey = await prisma.userLearningSurveys.findUnique({
      where: { user_id: userId },
    });
    const learningPurposesJson =
      JSON.stringify(data.learning_purposes);

    const preferredSkillsJson =
      JSON.stringify(data.preferred_skills);

    const hasChanged =
      !previousSurvey ||
      previousSurvey.current_level !==
      data.current_level ||
      previousSurvey.target_goal !==
      data.target_goal ||
      previousSurvey.expected_duration_months !==
      data.expected_duration_months ||
      previousSurvey.daily_available_minutes !==
      data.daily_available_minutes ||
      previousSurvey.learning_purposes_json !==
      learningPurposesJson ||
      previousSurvey.preferred_skills_json !==
      preferredSkillsJson;

    if (previousSurvey && !hasChanged) {
      return this.getLearningSurvey(userId);
    }
    const survey = await prisma.userLearningSurveys.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        current_level: data.current_level,
        target_goal: data.target_goal,
        expected_duration_months: data.expected_duration_months,
        daily_available_minutes: data.daily_available_minutes,
        learning_purposes_json: JSON.stringify(data.learning_purposes),
        preferred_skills_json: JSON.stringify(data.preferred_skills),
      },
      update: {
        current_level: data.current_level,
        target_goal: data.target_goal,
        expected_duration_months: data.expected_duration_months,
        daily_available_minutes: data.daily_available_minutes,
        learning_purposes_json: JSON.stringify(data.learning_purposes),
        preferred_skills_json: JSON.stringify(data.preferred_skills),
      },
    });

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: previousSurvey
          ? 'UPDATE_LEARNING_SURVEY'
          : 'CREATE_LEARNING_SURVEY',
        target_entity: 'UserLearningSurveys',
        target_id: survey.survey_id.toString(),
        old_value: previousSurvey ? JSON.stringify(previousSurvey) : null,
        new_value: JSON.stringify(data),
      },
    });

    return this.getLearningSurvey(userId);
  }

  async getCurrentRoadmap(userId: number) {
    const proposedRoadmap = await prisma.userRoadmaps.findFirst({
      where: { user_id: userId, status: 'PROPOSED' },
      orderBy: { created_at: 'desc' },
      include: { course: true },
    });

    if (proposedRoadmap) return this.formatRoadmap(proposedRoadmap);

    const activeRoadmap = await prisma.userRoadmaps.findFirst({
      where: { user_id: userId, status: 'CONFIRMED', is_active: true },
      orderBy: { created_at: 'desc' },
      include: { course: true },
    });

    return activeRoadmap ? this.formatRoadmap(activeRoadmap) : null;
  }

  async createRoadmapProposal(
    userId: number,
    data: CreateRoadmapProposalInput
  ) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { user_id: true, status: true },
    });

    if (!user) throw AppError.notFound('Không tìm thấy người dùng.');
    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden('Tài khoản không ở trạng thái hoạt động.');
    }

    const survey = await prisma.userLearningSurveys.findUnique({
      where: { user_id: userId },
    });
    if (!survey) {
      throw AppError.badRequest(
        'Bạn cần hoàn thành khảo sát trước khi tạo lộ trình.'
      );
    }

    const course = await prisma.courses.findUnique({
      where: { course_id: data.course_id },
    });
    if (!course) {
      throw AppError.notFound('Không tìm thấy khóa học được đề xuất.');
    }

    const roadmap = await prisma.$transaction(async (tx) => {
      await tx.userRoadmaps.updateMany({
        where: { user_id: userId, status: 'PROPOSED' },
        data: { status: 'REPLACED', is_active: false },
      });

      const created = await tx.userRoadmaps.create({
        data: {
          user_id: userId,
          course_id: data.course_id,
          starting_level: data.starting_level,
          target_goal: data.target_goal,
          daily_commitment_mins: data.daily_commitment_mins,
          expected_duration_months: data.expected_duration_months,
          status: 'PROPOSED',
          is_active: false,
        },
        include: { course: true },
      });

      await tx.auditLogs.create({
        data: {
          user_id: userId,
          action_type: 'CREATE_ROADMAP_PROPOSAL',
          target_entity: 'UserRoadmaps',
          target_id: created.roadmap_id.toString(),
          new_value: JSON.stringify(data),
        },
      });

      return created;
    });

    return this.formatRoadmap(roadmap);
  }

  async confirmRoadmap(userId: number, roadmapId: number) {
    const proposal = await prisma.userRoadmaps.findFirst({
      where: {
        roadmap_id: roadmapId,
        user_id: userId,
        status: 'PROPOSED',
      },
    });

    if (!proposal) {
      throw AppError.notFound('Không tìm thấy lộ trình đề xuất.');
    }

    const roadmap = await prisma.$transaction(async (tx) => {
      await tx.userRoadmaps.updateMany({
        where: {
          user_id: userId,
          is_active: true,
          roadmap_id: { not: roadmapId },
        },
        data: { status: 'REPLACED', is_active: false },
      });

      const confirmed = await tx.userRoadmaps.update({
        where: { roadmap_id: roadmapId },
        data: {
          status: 'CONFIRMED',
          is_active: true,
          confirmed_at: new Date(),
        },
        include: { course: true },
      });

      await tx.auditLogs.create({
        data: {
          user_id: userId,
          action_type: 'CONFIRM_ROADMAP',
          target_entity: 'UserRoadmaps',
          target_id: roadmapId.toString(),
          old_value: JSON.stringify(proposal),
          new_value: JSON.stringify({ status: 'CONFIRMED', is_active: true }),
        },
      });

      return confirmed;
    });

    return this.formatRoadmap(roadmap);
  }

  async cancelRoadmapProposal(userId: number, roadmapId: number) {
    const proposal = await prisma.userRoadmaps.findFirst({
      where: {
        roadmap_id: roadmapId,
        user_id: userId,
        status: 'PROPOSED',
      },
    });

    if (!proposal) {
      throw AppError.notFound('Không tìm thấy lộ trình đề xuất để hủy.');
    }

    const cancelled = await prisma.userRoadmaps.update({
      where: { roadmap_id: roadmapId },
      data: { status: 'CANCELLED', is_active: false },
      include: { course: true },
    });

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'CANCEL_ROADMAP_PROPOSAL',
        target_entity: 'UserRoadmaps',
        target_id: roadmapId.toString(),
        old_value: JSON.stringify(proposal),
        new_value: JSON.stringify({ status: 'CANCELLED', is_active: false }),
      },
    });

    return this.formatRoadmap(cancelled);
  }

  async updateNotificationSettings(
    userId: number,
    data: {
      reminder_time?: string;
      notify_email?: boolean;
      notify_webpush?: boolean;
    }
  ) {
    return prisma.notificationSettings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        reminder_time: data.reminder_time ?? '20:00',
        notify_email: data.notify_email ?? true,
        notify_webpush: data.notify_webpush ?? false,
      },
      update: {
        reminder_time: data.reminder_time,
        notify_email: data.notify_email,
        notify_webpush: data.notify_webpush,
      },
    });
  }

  async adminListUsers(query: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
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

    const [
      total,
      users,
      totalUsers,
      activeUsers,
      adminCount,
      editorCount,
      lockedCount,
    ] = await Promise.all([
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

  async adminUpdateUser(
    adminId: number,
    targetUserId: number,
    data: { role?: string; status?: string }
  ) {
    if (adminId === targetUserId) {
      if (data.status === 'LOCKED' || data.status === 'BANNED') {
        throw AppError.badRequest(
          'Quản trị viên không thể tự khóa tài khoản của chính mình.'
        );
      }
      if (data.role && data.role !== 'ADMIN') {
        throw AppError.badRequest(
          'Quản trị viên không thể tự hạ quyền của chính mình.'
        );
      }
    }

    const existingTarget = await prisma.users.findUnique({
      where: { user_id: targetUserId },
      select: { role: true, status: true },
    });

    if (!existingTarget) {
      throw AppError.notFound(
        'Không tìm thấy tài khoản người dùng cần cập nhật.'
      );
    }

    const user = await prisma.users.update({
      where: { user_id: targetUserId },
      data: { role: data.role, status: data.status },
    });

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
}

export const userService = new UserService();
