import { z } from 'zod';

export const CODE_REGEX = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

export const CATEGORIES = [
  'WORKBOOK_LESSON',
  'SKILL_PRACTICE',
  'MIXED_PRACTICE',
  'MOCK_EXAM',
  'REAL_EXAM_SIMULATION',
] as const;

export const SKILLS = [
  'LISTENING',
  'READING',
  'PHONETICS',
  'HANZI',
  'MOCK_TEST',
  'WRITING',
] as const;

export const SUPPORTED_QUESTION_TYPES = [
  'TRUE_FALSE',
  'SINGLE_CHOICE',
  'IMAGE_CHOICE',
  'LISTEN_AND_CHOOSE',
  'TONE_SELECTION',
  'CHARACTER_WRITING',
  'TEXT_INPUT',
] as const;

// 1. Collections
export const CreatePracticeCollectionSchema = z.object({
  levelId: z.number().int().positive('levelId phải là số nguyên dương'),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CODE_REGEX, 'Code phải viết hoa, chỉ chứa chữ cái, số và dấu gạch ngang (e.g. HSK1-WORKBOOK-L04)'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'category không hợp lệ' }),
  }),
  titleZh: z.string().trim().min(1, 'titleZh không được rỗng').max(200, 'titleZh tối đa 200 ký tự'),
  titlePinyin: z.string().trim().max(200, 'titlePinyin tối đa 200 ký tự').optional().nullable(),
  titleVi: z.string().trim().min(1, 'titleVi không được rỗng').max(200, 'titleVi tối đa 200 ký tự'),
  description: z.string().trim().max(5000, 'description tối đa 5000 ký tự').optional().nullable(),
  orderIndex: z.number().int().min(0, 'orderIndex phải >= 0').default(1),
});

export type CreatePracticeCollectionDto = z.infer<typeof CreatePracticeCollectionSchema>;

export const UpdatePracticeCollectionSchema = z.object({
  titleZh: z.string().trim().min(1, 'titleZh không được rỗng').max(200, 'titleZh tối đa 200 ký tự').optional(),
  titlePinyin: z.string().trim().max(200, 'titlePinyin tối đa 200 ký tự').optional().nullable(),
  titleVi: z.string().trim().min(1, 'titleVi không được rỗng').max(200, 'titleVi tối đa 200 ký tự').optional(),
  description: z.string().trim().max(5000, 'description tối đa 5000 ký tự').optional().nullable(),
  orderIndex: z.number().int().min(0, 'orderIndex phải >= 0').optional(),
  expectedUpdatedAt: z.string().datetime({ message: 'expectedUpdatedAt phải là ISO date string' }),
});

export type UpdatePracticeCollectionDto = z.infer<typeof UpdatePracticeCollectionSchema>;

export const AssignPracticeEditorSchema = z.object({
  editorId: z.number().int().positive('editorId phải là số nguyên dương'),
});

export type AssignPracticeEditorDto = z.infer<typeof AssignPracticeEditorSchema>;

export const DuplicatePracticeCollectionSchema = z.object({
  newCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CODE_REGEX, 'Mã code mới phải viết hoa, gồm ký tự chữ, số và gạch ngang'),
  titleVi: z.string().trim().min(1).max(200).optional(),
  sourceVersionId: z.number().int().positive().optional(),
});

export type DuplicatePracticeCollectionDto = z.infer<typeof DuplicatePracticeCollectionSchema>;

export const ListPracticeCollectionsQuerySchema = z.object({
  levelCode: z.string().trim().toUpperCase().optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'REVISION_REQUIRED', 'PUBLISHED', 'ARCHIVED']).optional(),
  createdBy: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPracticeCollectionsQueryDto = z.infer<typeof ListPracticeCollectionsQuerySchema>;

// 2. Versions
export const CreatePracticeVersionSchema = z.object({
  sourceVersionId: z.number().int().positive('sourceVersionId phải là số nguyên dương').optional(),
  changeSummary: z.string().trim().min(1, 'changeSummary không được rỗng').max(2000, 'changeSummary tối đa 2000 ký tự'),
});

export type CreatePracticeVersionDto = z.infer<typeof CreatePracticeVersionSchema>;

export const UpdatePracticeVersionSchema = z.object({
  changeSummary: z.string().trim().max(2000, 'changeSummary tối đa 2000 ký tự').optional(),
  expectedUpdatedAt: z.string().datetime({ message: 'expectedUpdatedAt phải là ISO date string' }),
});

export type UpdatePracticeVersionDto = z.infer<typeof UpdatePracticeVersionSchema>;

export const SubmitPracticeReviewSchema = z.object({
  reviewNotes: z.string().trim().max(2000).optional(),
});

export type SubmitPracticeReviewDto = z.infer<typeof SubmitPracticeReviewSchema>;

export const RequestPracticeChangesSchema = z.object({
  reviewNote: z
    .string()
    .trim()
    .min(5, 'Lý do yêu cầu sửa tối thiểu 5 ký tự')
    .max(2000, 'Lý do yêu cầu sửa tối đa 2000 ký tự'),
});

export type RequestPracticeChangesDto = z.infer<typeof RequestPracticeChangesSchema>;

export const PublishPracticeVersionSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

export type PublishPracticeVersionDto = z.infer<typeof PublishPracticeVersionSchema>;

// 3. Exercise Sets
export const CreatePracticeExerciseSetSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CODE_REGEX, 'Code exercise set phải viết hoa, gồm ký tự chữ, số và gạch ngang'),
  skill: z.enum(SKILLS, { errorMap: () => ({ message: 'skill không hợp lệ' }) }),
  titleZh: z.string().trim().min(1, 'titleZh không được rỗng').max(200),
  titleVi: z.string().trim().max(200).optional().nullable(),
  instructions: z.string().trim().max(5000).optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(300).default(15),
  audioUrl: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(1).optional(),
});

export type CreatePracticeExerciseSetDto = z.infer<typeof CreatePracticeExerciseSetSchema>;

export const UpdatePracticeExerciseSetSchema = z.object({
  titleZh: z.string().trim().min(1).max(200).optional(),
  titleVi: z.string().trim().max(200).optional().nullable(),
  instructions: z.string().trim().max(5000).optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(300).optional(),
  audioUrl: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(1).optional(),
  expectedUpdatedAt: z.string().datetime({ message: 'expectedUpdatedAt phải là ISO date string' }).optional(),
});

export type UpdatePracticeExerciseSetDto = z.infer<typeof UpdatePracticeExerciseSetSchema>;

export const ReorderPracticeItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive('id phải là số nguyên dương'),
        sortOrder: z.number().int().min(1, 'sortOrder phải >= 1'),
      })
    )
    .min(1, 'Danh sách sắp xếp không được rỗng'),
});

export type ReorderPracticeItemsDto = z.infer<typeof ReorderPracticeItemsSchema>;

// 4. Questions
export const CreatePracticeQuestionSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CODE_REGEX, 'Code question phải viết hoa, gồm chữ cái, số và dấu gạch ngang'),
  type: z.enum(SUPPORTED_QUESTION_TYPES, {
    errorMap: () => ({ message: 'type câu hỏi không thuộc tập hỗ trợ' }),
  }),
  prompt: z.record(z.unknown()),
  answer: z.record(z.unknown()),
  explanation: z.union([z.string(), z.record(z.unknown())]).optional().nullable(),
  score: z.number().int().min(1, 'score phải >= 1').max(100, 'score tối đa 100').default(1),
  sortOrder: z.number().int().min(1).optional(),
  sourcePage: z.number().int().positive().optional().nullable(),
  sourceAudio: z.string().trim().max(1000).optional().nullable(),
});

export type CreatePracticeQuestionDto = z.infer<typeof CreatePracticeQuestionSchema>;

export const UpdatePracticeQuestionSchema = z.object({
  type: z.enum(SUPPORTED_QUESTION_TYPES).optional(),
  prompt: z.record(z.unknown()).optional(),
  answer: z.record(z.unknown()).optional(),
  explanation: z.union([z.string(), z.record(z.unknown())]).optional().nullable(),
  score: z.number().int().min(1).max(100).optional(),
  sortOrder: z.number().int().min(1).optional(),
  sourcePage: z.number().int().positive().optional().nullable(),
  sourceAudio: z.string().trim().max(1000).optional().nullable(),
  expectedUpdatedAt: z.string().datetime({ message: 'expectedUpdatedAt phải là ISO date string' }).optional(),
});

export type UpdatePracticeQuestionDto = z.infer<typeof UpdatePracticeQuestionSchema>;

export const DuplicatePracticeQuestionSchema = z.object({
  newCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CODE_REGEX, 'Code mới phải hợp lệ')
    .optional(),
});

export type DuplicatePracticeQuestionDto = z.infer<typeof DuplicatePracticeQuestionSchema>;
