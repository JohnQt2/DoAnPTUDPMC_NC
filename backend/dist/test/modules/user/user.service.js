"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const prisma_client_1 = require("../../shared/database/prisma.client");
const app_error_1 = require("../../shared/errors/app-error");
class UserService {
    async getProfile(userId) {
        const user = await prisma_client_1.prisma.users.findUnique({
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
            throw app_error_1.AppError.notFound('Không tìm thấy người dùng.');
        }
        // Calculate completed lessons and active streak
        const completedLessonsCount = await prisma_client_1.prisma.userLessonProgress.count({
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
    async updateProfile(userId, data) {
        const user = await prisma_client_1.prisma.users.update({
            where: { user_id: userId },
            data: {
                display_name: data.display_name,
                avatar_resource_id: data.avatar_resource_id,
            },
            include: { avatarResource: true },
        });
        await prisma_client_1.prisma.auditLogs.create({
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
    async submitOnboarding(userId, data) {
        let targetCourseId = data.course_id;
        if (!targetCourseId) {
            const course = await prisma_client_1.prisma.courses.findFirst({
                where: {
                    level: data.target_goal === 'HSK2' ? 'HSK2' : 'HSK1',
                },
            });
            targetCourseId = course?.course_id;
        }
        if (!targetCourseId) {
            const fallbackCourse = await prisma_client_1.prisma.courses.findFirst();
            targetCourseId = fallbackCourse?.course_id || 1;
        }
        // Deactivate previous roadmaps
        await prisma_client_1.prisma.userRoadmaps.updateMany({
            where: { user_id: userId, is_active: true },
            data: { is_active: false },
        });
        // Create new active roadmap
        const roadmap = await prisma_client_1.prisma.userRoadmaps.create({
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
        await prisma_client_1.prisma.notificationSettings.upsert({
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
        await prisma_client_1.prisma.auditLogs.create({
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
    async updateNotificationSettings(userId, data) {
        const settings = await prisma_client_1.prisma.notificationSettings.upsert({
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
    async adminListUsers(query) {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(50, Math.max(1, query.limit || 10));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.role)
            where.role = query.role;
        if (query.status)
            where.status = query.status;
        if (query.search) {
            where.OR = [
                { email: { contains: query.search } },
                { display_name: { contains: query.search } },
            ];
        }
        const [total, users] = await Promise.all([
            prisma_client_1.prisma.users.count({ where }),
            prisma_client_1.prisma.users.findMany({
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
    async adminUpdateUser(adminId, targetUserId, data) {
        // Prevent self-demotion or self-lockout
        if (adminId === targetUserId) {
            if (data.status === 'LOCKED' || data.status === 'BANNED') {
                throw app_error_1.AppError.badRequest('Quản trị viên không thể tự khóa tài khoản của chính mình.');
            }
            if (data.role && data.role !== 'ADMIN') {
                throw app_error_1.AppError.badRequest('Quản trị viên không thể tự hạ quyền của chính mình.');
            }
        }
        const user = await prisma_client_1.prisma.users.update({
            where: { user_id: targetUserId },
            data: {
                role: data.role,
                status: data.status,
            },
        });
        // If account was locked or banned, revoke all their active sessions immediately
        if (data.status === 'LOCKED' || data.status === 'BANNED') {
            await prisma_client_1.prisma.userSessions.updateMany({
                where: { user_id: targetUserId },
                data: { is_revoked: true },
            });
        }
        await prisma_client_1.prisma.auditLogs.create({
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
exports.UserService = UserService;
exports.userService = new UserService();
