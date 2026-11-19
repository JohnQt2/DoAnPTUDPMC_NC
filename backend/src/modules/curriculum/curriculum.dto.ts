import { z } from 'zod';

export const CreateCourseDto = z.object({
  title: z.string().min(1, 'Tiêu đề khóa học không được để trống.').max(200),
  code: z.string().min(1, 'Mã khóa học không được để trống.').max(20).toUpperCase(),
  description: z.string().max(2000).optional(),
  level: z.string().min(1, 'Cấp độ không được để trống.'),
  is_published: z.boolean().default(false),
});

export const UpdateCourseDto = z.object({
  title: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(20).toUpperCase().optional(),
  description: z.string().max(2000).optional().nullable(),
  level: z.string().min(1).optional(),
  is_published: z.boolean().optional(),
});

export const CreateChapterDto = z.object({
  course_id: z.number().int().positive('ID khóa học không hợp lệ.'),
  title: z.string().min(1, 'Tiêu đề chương không được để trống.').max(200),
  order_index: z.number().int().min(0, 'Thứ tự không được âm.'),
});

export const UpdateChapterDto = z.object({
  title: z.string().min(1).max(200).optional(),
  order_index: z.number().int().min(0).optional(),
});

export const CreateLessonDto = z.object({
  chapter_id: z.number().int().positive('ID chương không hợp lệ.'),
  title: z.string().min(1, 'Tiêu đề bài học không được để trống.').max(200),
  order_index: z.number().int().min(0, 'Thứ tự không được âm.'),
  estimated_duration_mins: z.number().int().min(1).max(180).default(10),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export const UpdateLessonDto = z.object({
  title: z.string().min(1).max(200).optional(),
  order_index: z.number().int().min(0).optional(),
  estimated_duration_mins: z.number().int().min(1).max(180).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export const CreateLessonBlockDto = z.object({
  lesson_id: z.number().int().positive('ID bài học không hợp lệ.'),
  block_type: z.enum(['THEORY', 'PINYIN', 'HANZI', 'AUDIO', 'EXAMPLE', 'VOCABULARY'], {
    errorMap: () => ({ message: 'Loại block không hợp lệ. Chấp nhận: THEORY, PINYIN, HANZI, AUDIO, EXAMPLE, VOCABULARY.' }),
  }),
  order_index: z.number().int().min(0, 'Thứ tự không được âm.'),
  content_json: z.string().min(1, 'Nội dung JSON không được để trống.'),
  media_resource_id: z.number().int().positive().optional().nullable(),
});

export const UpdateLessonBlockDto = z.object({
  block_type: z.enum(['THEORY', 'PINYIN', 'HANZI', 'AUDIO', 'EXAMPLE', 'VOCABULARY']).optional(),
  order_index: z.number().int().min(0).optional(),
  content_json: z.string().min(1).optional(),
  media_resource_id: z.number().int().positive().optional().nullable(),
});

export type CreateCourseInput = z.infer<typeof CreateCourseDto>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseDto>;
export type CreateChapterInput = z.infer<typeof CreateChapterDto>;
export type UpdateChapterInput = z.infer<typeof UpdateChapterDto>;
export type CreateLessonInput = z.infer<typeof CreateLessonDto>;
export type UpdateLessonInput = z.infer<typeof UpdateLessonDto>;
export type CreateLessonBlockInput = z.infer<typeof CreateLessonBlockDto>;
export type UpdateLessonBlockInput = z.infer<typeof UpdateLessonBlockDto>;
