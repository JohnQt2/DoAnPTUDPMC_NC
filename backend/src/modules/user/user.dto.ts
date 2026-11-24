import { z } from 'zod';

export const FORBIDDEN_PROFILE_FIELDS = [
  'id',
  'user_id',
  'role',
  'password_hash',
  'password',
  'is_verified',
  'status',
  'created_at',
  'last_login_at',
];

export const UpdateProfileDto = z
  .object({
    full_name: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(100).optional(),
    display_name: z.string().min(2, 'Tên hiển thị tối thiểu 2 ký tự.').max(100).optional(),
    avatar_url: z
      .string()
      .max(450000, 'Ảnh đại diện quá lớn (tối đa 350KB sau khi nén).')
      .refine(
        (val) =>
          val === '' ||
          /^https?:\/\/.+/i.test(val) ||
          /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(val),
        { message: 'URL hoặc dữ liệu ảnh đại diện không hợp lệ.' }
      )
      .optional()
      .nullable(),
    avatar_resource_id: z.number().int().positive().optional(),
    phone: z
      .string()
      .regex(/^[0-9+() -]{8,20}$/, 'Số điện thoại không hợp lệ.')
      .optional()
      .nullable(),
    bio: z.string().max(500, 'Giới thiệu bản thân tối đa 500 ký tự.').optional().nullable(),
    daily_study_minutes: z.coerce
      .number({ invalid_type_error: 'Thời gian học mỗi ngày phải là số nguyên dương.' })
      .int('Thời gian học mỗi ngày phải là số nguyên.')
      .positive('Thời gian học mỗi ngày phải lớn hơn 0.')
      .optional(),
    daily_commitment_mins: z.coerce.number().int().positive().optional(),
    goal: z.string().min(1, 'Mục tiêu học không được để trống.').optional(),
    target_goal: z.string().optional(),
    expected_duration: z.string().min(1, 'Thời gian học dự kiến không được để trống.').optional(),
    current_level: z.string().min(1, 'Trình độ hiện tại không được để trống.').optional(),
    starting_level: z.string().optional(),
    reminder_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Khung giờ nhắc học phải có định dạng HH:mm (ví dụ 20:00).')
      .optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Khung giờ nhắc học phải có định dạng HH:mm (ví dụ 20:00).')
      .optional(),
    target_weeks: z.coerce.number().int().min(1).max(104).optional(),
    targetWeeks: z.coerce.number().int().min(1).max(104).optional(),
    expected_weeks: z.coerce.number().int().min(1).max(104).optional(),
    expectedWeeks: z.coerce.number().int().min(1).max(104).optional(),
  })
  .superRefine((data, ctx) => {
    // Detect forbidden sensitive fields
    const rawData = data as any;
    for (const field of FORBIDDEN_PROFILE_FIELDS) {
      if (rawData[field] !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `Không được phép chỉnh sửa trường nhạy cảm: ${field}`,
        });
      }
    }
  });

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;

export const ValidLevels = [
  'BEGINNER',
  'MOI_BAT_DAU',
  'CHUA_BIET_GI',
  'NOVICE',
  'ZERO',
  'PINYIN_KNOWN',
  'ELEMENTARY',
  'HSK1',
  'HSK2',
  'HSK3',
  'HSK4',
  'HSK5',
  'HSK6',
] as const;

export const ValidGoals = [
  'HSK1',
  'HSK2',
  'HSK3',
  'HSK4',
  'HSK5',
  'HSK6',
  'COMMUNICATION',
  'HOBBY',
] as const;

export const StartingLevelEnum = z.enum(
  ['ZERO', 'PINYIN_KNOWN', 'ELEMENTARY', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
  {
    errorMap: () => ({
      message:
        'Trình độ xuất phát không hợp lệ (chọn ZERO, PINYIN_KNOWN, ELEMENTARY hoặc HSK1 - HSK6).',
    }),
  }
);
export type StartingLevel = z.infer<typeof StartingLevelEnum>;

export const TargetGoalEnum = z.enum(
  ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'COMMUNICATION', 'HOBBY'],
  {
    errorMap: () => ({
      message: 'Mục tiêu học không hợp lệ (chọn HSK1 - HSK6, COMMUNICATION hoặc HOBBY).',
    }),
  }
);
export type TargetGoal = z.infer<typeof TargetGoalEnum>;

export const DailyCommitmentMinsEnum = z.coerce
  .number({
    invalid_type_error:
      'Thời gian học mỗi ngày phải là số nguyên dương.',
  })
  .int('Thời gian học mỗi ngày phải là số nguyên.')
  .positive('Thời gian học mỗi ngày phải lớn hơn 0.')
  .default(15);
export type DailyCommitmentMins = number;

export const OnboardingSurveyDto = z
  .object({
    skip: z.boolean().optional().default(false),
    goal: z.string().optional(),
    target_goal: z.string().optional(),
    current_level: z.string().optional(),
    starting_level: z.string().optional(),
    expected_duration: z.union([z.string(), z.number()]).optional(),
    target_weeks: z.coerce.number().int().min(1).max(104).optional(),
    targetWeeks: z.coerce.number().int().min(1).max(104).optional(),
    expected_weeks: z.coerce.number().int().min(1).max(104).optional(),
    expectedWeeks: z.coerce.number().int().min(1).max(104).optional(),
    daily_study_minutes: z.coerce
      .number({ invalid_type_error: 'Thời gian rảnh mỗi ngày phải là số nguyên dương tính theo phút.' })
      .int('Thời gian rảnh mỗi ngày phải là số nguyên.')
      .positive('Thời gian rảnh mỗi ngày phải lớn hơn 0.')
      .optional(),
    daily_commitment_mins: z.coerce.number().int().positive().optional(),
    reminder_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Khung giờ nhắc học phải có định dạng HH:mm (ví dụ 20:00).')
      .optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Khung giờ nhắc học phải có định dạng HH:mm (ví dụ 20:00).')
      .optional(),
    course_id: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.skip) {
      const level = (data.current_level || data.starting_level || '').trim().toUpperCase();
      if (!level) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['current_level'],
          message: 'Vui lòng cung cấp trình độ hiện tại (current_level).',
        });
      }

      const goal = (data.goal || data.target_goal || '').trim().toUpperCase();
      if (!goal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['goal'],
          message: 'Vui lòng cung cấp mục tiêu học tập (goal).',
        });
      }

      const studyMins = data.daily_study_minutes ?? data.daily_commitment_mins;
      if (studyMins === undefined || studyMins === null || studyMins <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['daily_study_minutes'],
          message: 'Thời gian rảnh mỗi ngày (daily_study_minutes) phải là số nguyên dương.',
        });
      }
    }
  })
  .transform((data) => {
    const isSkip = Boolean(data.skip);

    // Normalize Level
    const rawLevel = (data.current_level || data.starting_level || '').trim().toUpperCase();
    let normalizedStartingLevel: StartingLevel = 'ZERO';
    let normalizedCurrentLevelStr = 'BEGINNER';

    if (rawLevel === 'BEGINNER' || rawLevel === 'ZERO' || rawLevel === 'MOI_BAT_DAU' || rawLevel === 'CHUA_BIET_GI' || rawLevel === 'NOVICE') {
      normalizedStartingLevel = 'ZERO';
      normalizedCurrentLevelStr = 'BEGINNER';
    } else if (rawLevel === 'PINYIN_KNOWN') {
      normalizedStartingLevel = 'PINYIN_KNOWN';
      normalizedCurrentLevelStr = 'PINYIN_KNOWN';
    } else if (rawLevel === 'ELEMENTARY') {
      normalizedStartingLevel = 'ELEMENTARY';
      normalizedCurrentLevelStr = 'ELEMENTARY';
    } else if (['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].includes(rawLevel)) {
      normalizedStartingLevel = rawLevel as StartingLevel;
      normalizedCurrentLevelStr = rawLevel;
    } else if (isSkip) {
      normalizedStartingLevel = 'ZERO';
      normalizedCurrentLevelStr = 'BEGINNER';
    }

    // Normalize Goal
    const rawGoal = (data.goal || data.target_goal || '').trim().toUpperCase();
    let normalizedTargetGoal: TargetGoal = 'HSK1';
    let normalizedGoalStr = 'HSK1';

    if (['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'COMMUNICATION', 'HOBBY'].includes(rawGoal)) {
      normalizedTargetGoal = rawGoal as TargetGoal;
      normalizedGoalStr = rawGoal;
    } else if (isSkip) {
      normalizedTargetGoal = 'HSK1';
      normalizedGoalStr = 'HSK1';
    }

    // Normalize Daily Minutes
    const mins = data.daily_study_minutes ?? data.daily_commitment_mins ?? 15;

    // Normalize Expected Duration
    let weeks = data.target_weeks || data.targetWeeks || data.expected_weeks || data.expectedWeeks;
    let durationStr = '8 tuần';
    if (data.expected_duration !== undefined && data.expected_duration !== null) {
      durationStr = typeof data.expected_duration === 'number' ? `${data.expected_duration} tuần` : String(data.expected_duration).trim();
      if (!weeks) {
        const match = durationStr.match(/(\d+)\s*(tuần|tháng|weeks|months)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          weeks = match[2].includes('tháng') || match[2].includes('month') ? num * 4 : num;
        }
      }
    } else if (weeks) {
      durationStr = `${weeks} tuần`;
    }

    const reminderTimeVal = data.reminder_time || data.reminderTime || '20:00';

    return {
      skip: isSkip,
      goal: normalizedGoalStr,
      target_goal: normalizedTargetGoal,
      current_level: normalizedCurrentLevelStr,
      starting_level: normalizedStartingLevel,
      daily_study_minutes: mins,
      daily_commitment_mins: mins,
      expected_duration: durationStr,
      expectedDuration: durationStr,
      target_weeks: weeks,
      targetWeeks: weeks,
      expected_weeks: weeks,
      expectedWeeks: weeks,
      reminder_time: reminderTimeVal,
      reminderTime: reminderTimeVal,
      course_id: data.course_id,
    };
  });

export type OnboardingSurveyInput = z.infer<typeof OnboardingSurveyDto>;

export const SurveyDto = OnboardingSurveyDto;
export type SurveyInput = OnboardingSurveyInput;

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
