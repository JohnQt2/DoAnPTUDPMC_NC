import { z } from 'zod';

export const UpdateProfileDto = z.object({
  display_name: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(50).optional(),
  avatar_url: z.string().url().optional(),
  avatar_resource_id: z.number().int().positive().optional(),
});

export const OnboardingSurveyDto = z.object({
  starting_level: z.enum(['ZERO', 'PINYIN_KNOWN', 'ELEMENTARY'], {
    errorMap: () => ({ message: 'Trình độ xuất phát không hợp lệ.' }),
  }),
  target_goal: z.enum(['HSK1', 'HSK2', 'COMMUNICATION', 'HOBBY'], {
    errorMap: () => ({ message: 'Mục tiêu học không hợp lệ.' }),
  }),
  daily_commitment_mins: z.number().min(5).max(120).default(15),
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Khung giờ nhắc học phải có định dạng HH:mm (ví dụ 20:00).').default('20:00'),
  course_id: z.number().int().positive().optional(),
});

export const UpdateNotificationsDto = z.object({
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  notify_email: z.boolean().optional(),
  notify_webpush: z.boolean().optional(),
});

export const AdminUpdateUserDto = z.object({
  role: z.enum(['STUDENT', 'CONTENT_EDITOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'LOCKED', 'BANNED']).optional(),
});
