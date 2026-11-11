import { z } from 'zod';

export const UpdateProfileDto = z.object({
  display_name: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(50).optional(),
  avatar_url: z.string().url().optional(),
  avatar_resource_id: z.number().int().positive().optional(),
});

export const StartingLevelEnum = z.enum(['ZERO', 'PINYIN_KNOWN', 'ELEMENTARY'], {
  errorMap: () => ({ message: 'Trình độ xuất phát không hợp lệ (chọn ZERO, PINYIN_KNOWN hoặc ELEMENTARY).' }),
});
export type StartingLevel = z.infer<typeof StartingLevelEnum>;

export const TargetGoalEnum = z.enum(['HSK1', 'HSK2', 'COMMUNICATION', 'HOBBY'], {
  errorMap: () => ({ message: 'Mục tiêu học không hợp lệ (chọn HSK1, HSK2, COMMUNICATION hoặc HOBBY).' }),
});
export type TargetGoal = z.infer<typeof TargetGoalEnum>;

export const DailyCommitmentMinsEnum = z
  .coerce
  .number({ invalid_type_error: 'Thời gian học mỗi ngày phải là số nguyên (10, 15, 20, 30).' })
  .int()
  .refine((val) => [10, 15, 20, 30].includes(val), {
    message: 'Thời gian học mỗi ngày phải là 10, 15, 20 hoặc 30 phút.',
  })
  .default(15);
export type DailyCommitmentMins = 10 | 15 | 20 | 30;

export const OnboardingSurveyDto = z
  .object({
    skip: z.boolean().optional().default(false),
    starting_level: StartingLevelEnum.optional(),
    target_goal: TargetGoalEnum.optional(),
    daily_commitment_mins: DailyCommitmentMinsEnum.optional(),
    reminder_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Khung giờ nhắc học phải có định dạng HH:mm (ví dụ 20:00).')
      .optional(),
    course_id: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.skip) {
      if (!data.starting_level) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['starting_level'],
          message: 'Vui lòng chọn trình độ xuất phát (ZERO, PINYIN_KNOWN, ELEMENTARY) hoặc chọn skip.',
        });
      }
      if (!data.target_goal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['target_goal'],
          message: 'Vui lòng chọn mục tiêu học tập (HSK1, HSK2, COMMUNICATION, HOBBY) hoặc chọn skip.',
        });
      }
    }
  })
  .transform((data) => {
    const isSkip = Boolean(data.skip);
    return {
      skip: isSkip,
      starting_level: (isSkip && !data.starting_level ? 'ZERO' : data.starting_level!) as StartingLevel,
      target_goal: (isSkip && !data.target_goal ? 'HSK1' : data.target_goal!) as TargetGoal,
      daily_commitment_mins: (data.daily_commitment_mins ?? 15) as DailyCommitmentMins,
      reminder_time: data.reminder_time ?? '20:00',
      course_id: data.course_id,
    };
  });
export type OnboardingSurveyInput = z.infer<typeof OnboardingSurveyDto>;

export const PreviewOnboardingDto = OnboardingSurveyDto;
export type PreviewOnboardingInput = OnboardingSurveyInput;

export const UpdateNotificationsDto = z.object({
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  notify_email: z.boolean().optional(),
  notify_webpush: z.boolean().optional(),
});

export const AdminUpdateUserDto = z.object({
  role: z.enum(['STUDENT', 'CONTENT_EDITOR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'LOCKED', 'BANNED']).optional(),
});
