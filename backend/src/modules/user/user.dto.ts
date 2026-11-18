import { z } from 'zod';

/**
 * Cập nhật hồ sơ cá nhân (PUT /users/me — legacy, chỉ cho display_name & avatar)
 */
export const UpdateProfileDto = z.object({
  display_name: z
    .string()
    .min(2, 'Tên hiển thị tối thiểu 2 ký tự.')
    .max(50, 'Tên hiển thị tối đa 50 ký tự.')
    .optional(),

  avatar_url: z.string().url('Đường dẫn ảnh đại diện không hợp lệ.').optional(),

  avatar_resource_id: z.number().int().positive().optional(),
});

/**
 * PATCH /users/profile hoặc PATCH /users/me
 * Cho phép cập nhật thông tin cá nhân và thông số học tập.
 * Chặn tuyệt đối các trường nhạy cảm: id, role, password_hash, is_verified, status.
 */
export const PatchProfileDto = z
  .object({
    display_name: z
      .string()
      .min(2, 'Tên hiển thị tối thiểu 2 ký tự.')
      .max(50, 'Tên hiển thị tối đa 50 ký tự.')
      .optional(),

    avatar_url: z
      .string()
      .url('Đường dẫn ảnh đại diện không hợp lệ.')
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/, 'Số điện thoại không hợp lệ.')
      .optional()
      .nullable(),

    bio: z
      .string()
      .max(500, 'Giới thiệu bản thân tối đa 500 ký tự.')
      .optional()
      .nullable(),

    // Thông số học tập có thể cập nhật qua PATCH profile
    daily_available_minutes: z
      .number()
      .int('Thời gian học mỗi ngày phải là số nguyên.')
      .min(5, 'Thời gian học tối thiểu là 5 phút mỗi ngày.')
      .max(240, 'Thời gian học tối đa là 240 phút mỗi ngày.')
      .optional(),

    target_goal: z
      .enum(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'COMMUNICATION', 'HOBBY'])
      .optional(),

    expected_duration_months: z
      .number()
      .int()
      .min(1)
      .max(36)
      .optional(),

    reminder_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ nhắc học phải có định dạng HH:mm.')
      .optional(),
  })
  .strict(); // Từ chối mọi trường không được khai báo (bảo vệ id, role, password_hash, ...)

export type PatchProfileInput = z.infer<typeof PatchProfileDto>;

/**
 * POST /users/survey — Khảo sát ban đầu (4 trường chính theo spec)
 * Tiếp nhận, validate và lưu khảo sát + tạo lộ trình trong 1 transaction.
 */
export const SurveyOnboardingDto = z
  .object({
    /**
     * Mục tiêu học tập
     */
    goal: z.enum(
      ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'COMMUNICATION', 'HOBBY'],
      { errorMap: () => ({ message: 'Mục tiêu học tập không hợp lệ.' }) }
    ),

    /**
     * Trình độ hiện tại (hỗ trợ người mới bắt đầu và HSK1–HSK6)
     */
    current_level: z.enum(
      ['ZERO', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
      { errorMap: () => ({ message: 'Trình độ hiện tại không hợp lệ. Giá trị hợp lệ: ZERO, HSK1–HSK6.' }) }
    ),

    /**
     * Thời gian học dự kiến (tháng)
     */
    expected_duration: z
      .number({
        required_error: 'Vui lòng nhập thời gian học dự kiến (tháng).',
        invalid_type_error: 'Thời gian học dự kiến phải là số nguyên.',
      })
      .int('Thời gian học dự kiến phải là số nguyên.')
      .min(1, 'Thời gian học dự kiến tối thiểu là 1 tháng.')
      .max(36, 'Thời gian học dự kiến tối đa là 36 tháng.'),

    /**
     * Thời gian rảnh mỗi ngày (phút) — số nguyên dương
     */
    daily_study_minutes: z
      .number({
        required_error: 'Vui lòng nhập thời gian rảnh mỗi ngày (phút).',
        invalid_type_error: 'Thời gian rảnh mỗi ngày phải là số nguyên dương.',
      })
      .int('Thời gian rảnh mỗi ngày phải là số nguyên.')
      .positive('Thời gian rảnh mỗi ngày phải là số nguyên dương.')
      .min(5, 'Thời gian học tối thiểu là 5 phút mỗi ngày.')
      .max(240, 'Thời gian học tối đa là 240 phút mỗi ngày.'),
  })
  .superRefine((data, ctx) => {
    // Người mới bắt đầu (ZERO) có thể chọn bất kỳ mục tiêu nào
    if (data.current_level === 'ZERO') return;

    // Chỉ kiểm tra khi mục tiêu là chứng chỉ HSK
    if (!data.goal.startsWith('HSK')) return;

    const currentNum = Number(data.current_level.replace('HSK', ''));
    const goalNum = Number(data.goal.replace('HSK', ''));

    if (goalNum <= currentNum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['goal'],
        message: 'Mục tiêu HSK phải cao hơn trình độ hiện tại.',
      });
    }
  });

export type SurveyOnboardingInput = z.infer<typeof SurveyOnboardingDto>;

/**
 * DTO onboarding cũ.
 *
 * Tạm thời giữ lại vì ProfilePage hiện tại vẫn gọi:
 * POST /users/onboarding
 *
 * Không dùng DTO này cho API khảo sát nhu cầu học mới.
 */
export const OnboardingSurveyDto = z.object({
  starting_level: z.enum(
    ['ZERO', 'PINYIN_KNOWN', 'ELEMENTARY'],
    {
      errorMap: () => ({
        message: 'Trình độ xuất phát không hợp lệ.',
      }),
    }
  ),

  target_goal: z.enum(
    ['HSK1', 'HSK2', 'COMMUNICATION', 'HOBBY'],
    {
      errorMap: () => ({
        message: 'Mục tiêu học không hợp lệ.',
      }),
    }
  ),

  daily_commitment_mins: z
    .number()
    .int()
    .min(5)
    .max(120)
    .default(15),

  reminder_time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      'Khung giờ nhắc học phải có định dạng HH:mm, ví dụ 20:00.'
    )
    .default('20:00'),

  course_id: z.number().int().positive().optional(),
});

/**
 * Cập nhật cấu hình nhắc học
 */
export const UpdateNotificationsDto = z.object({
  reminder_time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      'Khung giờ nhắc học phải có định dạng HH:mm.'
    )
    .optional(),

  notify_email: z.boolean().optional(),

  notify_webpush: z.boolean().optional(),
});

/**
 * Quản trị viên cập nhật người dùng
 */
export const AdminUpdateUserDto = z.object({
  role: z
    .enum(['STUDENT', 'CONTENT_EDITOR', 'ADMIN'])
    .optional(),

  status: z
    .enum(['ACTIVE', 'LOCKED', 'BANNED'])
    .optional(),
});

/**
 * Trình độ tiếng Trung hiện tại.
 */
export const HskLevelDto = z.enum([
  'ZERO',
  'HSK1',
  'HSK2',
  'HSK3',
  'HSK4',
  'HSK5',
  'HSK6',
]);

/**
 * Mục tiêu học tập.
 */
export const LearningTargetDto = z.enum([
  'HSK1',
  'HSK2',
  'HSK3',
  'HSK4',
  'HSK5',
  'HSK6',
  'COMMUNICATION',
  'HOBBY',
]);

/**
 * Mục đích học tập.
 */
export const LearningPurposeDto = z.enum([
  'EXAM',
  'COMMUNICATION',
  'WORK',
  'TRAVEL',
  'STUDY_ABROAD',
  'HOBBY',
]);

/**
 * Kỹ năng người học muốn ưu tiên.
 */
export const PreferredSkillDto = z.enum([
  'LISTENING',
  'SPEAKING',
  'READING',
  'WRITING',
  'PINYIN',
  'HANZI',
]);

/**
 * Tạo mới hoặc cập nhật khảo sát nhu cầu học.
 */
export const UpsertLearningSurveyDto = z
  .object({
    current_level: HskLevelDto,

    target_goal: LearningTargetDto,

    expected_duration_months: z
      .number()
      .int('Thời gian dự kiến phải là số nguyên.')
      .min(
        1,
        'Thời gian dự kiến tối thiểu là 1 tháng.'
      )
      .max(
        36,
        'Thời gian dự kiến tối đa là 36 tháng.'
      ),

    daily_available_minutes: z
      .number()
      .int('Thời gian học mỗi ngày phải là số nguyên.')
      .min(
        5,
        'Thời gian học tối thiểu là 5 phút mỗi ngày.'
      )
      .max(
        240,
        'Thời gian học tối đa là 240 phút mỗi ngày.'
      ),

    learning_purposes: z
      .array(LearningPurposeDto)
      .min(
        1,
        'Phải chọn ít nhất một mục đích học.'
      )
      .max(
        6,
        'Chỉ được chọn tối đa 6 mục đích học.'
      ),

    preferred_skills: z
      .array(PreferredSkillDto)
      .max(
        6,
        'Chỉ được chọn tối đa 6 kỹ năng.'
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    // Người mới bắt đầu có thể chọn bất kỳ mục tiêu nào.
    if (data.current_level === 'ZERO') {
      return;
    }

    // Không so sánh cấp độ nếu mục tiêu không phải chứng chỉ HSK.
    if (!data.target_goal.startsWith('HSK')) {
      return;
    }

    const currentLevel = Number(
      data.current_level.replace('HSK', '')
    );

    const targetLevel = Number(
      data.target_goal.replace('HSK', '')
    );

    if (targetLevel <= currentLevel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_goal'],
        message:
          'Mục tiêu HSK phải cao hơn trình độ hiện tại.',
      });
    }
  });

/**
 * Kiểu dữ liệu TypeScript được suy luận trực tiếp từ DTO.
 */
export type LearningSurveyInput = z.infer<
  typeof UpsertLearningSurveyDto
>;
export const CreateRoadmapProposalDto =
  z
    .object({
      course_id: z
        .number()
        .int()
        .positive(
          'Mã khóa học không hợp lệ.'
        ),

      starting_level: HskLevelDto,

      target_goal: LearningTargetDto,

      daily_commitment_mins: z
        .number()
        .int()
        .min(
          5,
          'Thời gian học tối thiểu là 5 phút mỗi ngày.'
        )
        .max(
          240,
          'Thời gian học tối đa là 240 phút mỗi ngày.'
        ),

      expected_duration_months: z
        .number()
        .int()
        .min(
          1,
          'Thời gian dự kiến tối thiểu là 1 tháng.'
        )
        .max(
          36,
          'Thời gian dự kiến tối đa là 36 tháng.'
        ),
    })
    .superRefine((data, ctx) => {
      if (
        data.starting_level === 'ZERO' ||
        !data.target_goal.startsWith(
          'HSK'
        )
      ) {
        return;
      }

      const startingLevel = Number(
        data.starting_level.replace(
          'HSK',
          ''
        )
      );

      const targetLevel = Number(
        data.target_goal.replace(
          'HSK',
          ''
        )
      );

      if (targetLevel <= startingLevel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['target_goal'],
          message:
            'Mục tiêu HSK phải cao hơn trình độ hiện tại.',
        });
      }
    });

export const ConfirmRoadmapDto =
  z.object({
    roadmap_id: z
      .number()
      .int()
      .positive(
        'Mã lộ trình không hợp lệ.'
      ),
  });

export const CancelRoadmapDto =
  ConfirmRoadmapDto;

export type CreateRoadmapProposalInput =
  z.infer<
    typeof CreateRoadmapProposalDto
  >;