import { z } from 'zod';

export const SaveAnswerSchema = z.object({
  answer: z.any(),
});

export const SubmitAttemptSchema = z.object({
  answers: z.record(z.string(), z.any()).optional(),
});

export const StartCollectionAttemptSchema = z.object({
  exerciseSetId: z.number().int().positive('exerciseSetId phải là số nguyên dương'),
});

export const ListStudentCollectionsQuerySchema = z.object({
  levelCode: z.string().trim().toUpperCase().optional(),
  category: z.enum([
    'WORKBOOK_LESSON',
    'SKILL_PRACTICE',
    'MIXED_PRACTICE',
    'MOCK_EXAM',
    'REAL_EXAM_SIMULATION',
  ]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ListStudentHistoryQuerySchema = z.object({
  levelCode: z.string().trim().toUpperCase().optional(),
  category: z.enum([
    'WORKBOOK_LESSON',
    'SKILL_PRACTICE',
    'MIXED_PRACTICE',
    'MOCK_EXAM',
    'REAL_EXAM_SIMULATION',
  ]).optional(),
  status: z.enum(['IN_PROGRESS', 'SUBMITTED', 'COMPLETED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SaveAnswerInput = z.infer<typeof SaveAnswerSchema>;
export type SubmitAttemptInput = z.infer<typeof SubmitAttemptSchema>;
export type StartCollectionAttemptInput = z.infer<typeof StartCollectionAttemptSchema>;
export type ListStudentCollectionsQuery = z.infer<typeof ListStudentCollectionsQuerySchema>;
export type ListStudentHistoryQuery = z.infer<typeof ListStudentHistoryQuerySchema>;
