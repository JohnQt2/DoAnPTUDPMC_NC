"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpdateUserDto = exports.UpdateNotificationsDto = exports.OnboardingSurveyDto = exports.UpdateProfileDto = void 0;
const zod_1 = require("zod");
exports.UpdateProfileDto = zod_1.z.object({
    display_name: zod_1.z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(50).optional(),
    avatar_url: zod_1.z.string().url().optional(),
    avatar_resource_id: zod_1.z.number().int().positive().optional(),
});
exports.OnboardingSurveyDto = zod_1.z.object({
    starting_level: zod_1.z.enum(['ZERO', 'PINYIN_KNOWN', 'ELEMENTARY'], {
        errorMap: () => ({ message: 'Trình độ xuất phát không hợp lệ.' }),
    }),
    target_goal: zod_1.z.enum(['HSK1', 'HSK2', 'COMMUNICATION', 'HOBBY'], {
        errorMap: () => ({ message: 'Mục tiêu học không hợp lệ.' }),
    }),
    daily_commitment_mins: zod_1.z.number().min(5).max(120).default(15),
    reminder_time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Khung giờ nhắc học phải có định dạng HH:mm (ví dụ 20:00).').default('20:00'),
    course_id: zod_1.z.number().int().positive().optional(),
});
exports.UpdateNotificationsDto = zod_1.z.object({
    reminder_time: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    notify_email: zod_1.z.boolean().optional(),
    notify_webpush: zod_1.z.boolean().optional(),
});
exports.AdminUpdateUserDto = zod_1.z.object({
    role: zod_1.z.enum(['STUDENT', 'CONTENT_EDITOR', 'ADMIN']).optional(),
    status: zod_1.z.enum(['ACTIVE', 'LOCKED', 'BANNED']).optional(),
});
