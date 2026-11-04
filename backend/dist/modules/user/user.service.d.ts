export declare class UserService {
    getProfile(userId: number): Promise<{
        userId: number;
        email: string;
        displayName: string;
        role: string;
        status: string;
        avatarUrl: string | null;
        createdAt: Date;
        lastLoginAt: Date | null;
        completedLessonsCount: number;
        activeRoadmap: {
            roadmapId: number;
            courseId: number;
            courseTitle: string;
            courseLevel: string;
            startingLevel: string;
            targetGoal: string;
            dailyCommitmentMins: number;
        } | null;
        notificationSettings: {
            reminderTime: string;
            notifyEmail: boolean;
            notifyWebpush: boolean;
        } | null;
    }>;
    updateProfile(userId: number, data: {
        display_name?: string;
        avatar_resource_id?: number;
    }): Promise<{
        userId: number;
        displayName: string;
        avatarUrl: string | null;
    }>;
    /**
     * UC02: Khảo sát mục tiêu và thiết lập lộ trình cá nhân
     */
    submitOnboarding(userId: number, data: {
        starting_level: string;
        target_goal: string;
        daily_commitment_mins: number;
        reminder_time: string;
        course_id?: number;
    }): Promise<{
        roadmapId: number;
        courseTitle: string;
        targetGoal: string;
        dailyCommitmentMins: number;
        reminderTime: string;
    }>;
    /**
     * UC03: Cập nhật cài đặt thông báo nhắc học
     */
    updateNotificationSettings(userId: number, data: {
        reminder_time?: string;
        notify_email?: boolean;
        notify_webpush?: boolean;
    }): Promise<{
        user_id: number;
        reminder_time: string;
        notify_email: boolean;
        notify_webpush: boolean;
        updated_at: Date;
        setting_id: number;
    }>;
    /**
     * RBAC Admin: Quản lý danh sách người dùng và phân quyền
     */
    adminListUsers(query: {
        search?: string;
        role?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        users: {
            status: string;
            email: string;
            user_id: number;
            display_name: string;
            role: string;
            created_at: Date;
            last_login_at: Date | null;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    adminUpdateUser(adminId: number, targetUserId: number, data: {
        role?: string;
        status?: string;
    }): Promise<{
        status: string;
        email: string;
        user_id: number;
        display_name: string;
        avatar_resource_id: number | null;
        role: string;
        created_at: Date;
        last_login_at: Date | null;
    }>;
}
export declare const userService: UserService;
