import { prisma } from '../../shared/database/prisma.client';
import { AppError } from '../../shared/errors/app-error';

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
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng.');
    }

    // Calculate completed lessons and active streak
    const completedLessonsCount = await prisma.userLessonProgress.count({
      where: { user_id: userId, is_completed: true },
    });

    const activeRoadmap = user.roadmaps[0] || null;

    return {
      userId: user.user_id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarResource?.public_url || null,
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
    data: { display_name?: string; avatar_url?: string; avatar_resource_id?: number }
  ) {
    let avatarResourceId = data.avatar_resource_id;

    if (data.avatar_url && !avatarResourceId) {
      const media = await prisma.mediaResources.create({
        data: {
          file_name: `avatar_${userId}_${Date.now()}.jpg`,
          storage_key: `avatars/user_${userId}_${Date.now()}`,
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
        ...(data.display_name !== undefined ? { display_name: data.display_name } : {}),
        ...(avatarResourceId !== undefined ? { avatar_resource_id: avatarResourceId } : {}),
      },
      include: { avatarResource: true },
    });

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
      userId: user.user_id,
      displayName: user.display_name,
      avatarUrl: user.avatarResource?.public_url || null,
    };
  }

  /**
   * UC02: Khảo sát mục tiêu và thiết lập lộ trình cá nhân
   */
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
        where: {
          level: data.target_goal === 'HSK2' ? 'HSK2' : 'HSK1',
        },
      });
      targetCourseId = course?.course_id;
    }

    if (!targetCourseId) {
      const fallbackCourse = await prisma.courses.findFirst();
      targetCourseId = fallbackCourse?.course_id || 1;
    }

    // Deactivate previous roadmaps
    await prisma.userRoadmaps.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });

    // Create new active roadmap
    const roadmap = await prisma.userRoadmaps.create({
      data: {
        user_id: userId,
        course_id: targetCourseId,
        starting_level: data.starting_level,
        target_goal: data.target_goal,
        daily_commitment_mins: data.daily_commitment_mins,
        is_active: true,
      },
      include: { course: true },
    });

    // Upsert notification settings
    await prisma.notificationSettings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        reminder_time: data.reminder_time,
        notify_email: true,
        notify_webpush: false,
      },
      update: {
        reminder_time: data.reminder_time,
      },
    });

    await prisma.auditLogs.create({
      data: {
        user_id: userId,
        action_type: 'ONBOARDING_SURVEY_COMPLETED',
        target_entity: 'UserRoadmaps',
        target_id: roadmap.roadmap_id.toString(),
        new_value: JSON.stringify(data),
      },
    });

    return {
      roadmapId: roadmap.roadmap_id,
      courseTitle: roadmap.course.title,
      targetGoal: roadmap.target_goal,
      dailyCommitmentMins: roadmap.daily_commitment_mins,
      reminderTime: data.reminder_time,
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

    const [total, users] = await Promise.all([
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
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
        new_value: JSON.stringify(data),
      },
    });

    return user;
  }
}

export const userService = new UserService();
