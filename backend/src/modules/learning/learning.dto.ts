import { z } from 'zod';

export const RecordPracticeDto = z.object({
  practice_type: z.enum(['PINYIN', 'TONE', 'MINIMAL_PAIR', 'HANZI_STROKE'], {
    errorMap: () => ({ message: 'Loại bài luyện tập không hợp lệ.' }),
  }),
  char_id: z.number().int().positive().optional(),
  syllable_id: z.number().int().positive().optional(),
  is_successful: z.boolean(),
  mistakes_count: z.number().int().min(0).default(0),
  score: z.number().min(0).max(100).optional(),
});

export const QueryPinyinDto = z.object({
  category: z.enum(['INITIAL', 'FINAL', 'SYLLABLE']).optional(),
  tone: z.string().transform((v) => parseInt(v, 10)).optional(),
});

export type RecordPracticeInput = z.infer<typeof RecordPracticeDto>;
