"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLessonBlockDto = exports.CreateLessonBlockDto = exports.UpdateLessonDto = exports.CreateLessonDto = exports.UpdateChapterDto = exports.CreateChapterDto = exports.UpdateCourseDto = exports.CreateCourseDto = void 0;
const zod_1 = require("zod");
exports.CreateCourseDto = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Tiêu đề khóa học không được để trống.').max(200),
    code: zod_1.z.string().min(1, 'Mã khóa học không được để trống.').max(20).toUpperCase(),
    description: zod_1.z.string().max(2000).optional(),
    level: zod_1.z.string().min(1, 'Cấp độ không được để trống.'),
    is_published: zod_1.z.boolean().default(false),
});
exports.UpdateCourseDto = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    code: zod_1.z.string().min(1).max(20).toUpperCase().optional(),
    description: zod_1.z.string().max(2000).optional().nullable(),
    level: zod_1.z.string().min(1).optional(),
    is_published: zod_1.z.boolean().optional(),
});
exports.CreateChapterDto = zod_1.z.object({
    course_id: zod_1.z.number().int().positive('ID khóa học không hợp lệ.'),
    title: zod_1.z.string().min(1, 'Tiêu đề chương không được để trống.').max(200),
    order_index: zod_1.z.number().int().min(0, 'Thứ tự không được âm.'),
});
exports.UpdateChapterDto = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
});
exports.CreateLessonDto = zod_1.z.object({
    chapter_id: zod_1.z.number().int().positive('ID chương không hợp lệ.'),
    title: zod_1.z.string().min(1, 'Tiêu đề bài học không được để trống.').max(200),
    order_index: zod_1.z.number().int().min(0, 'Thứ tự không được âm.'),
    estimated_duration_mins: zod_1.z.number().int().min(1).max(180).default(10),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});
exports.UpdateLessonDto = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
    estimated_duration_mins: zod_1.z.number().int().min(1).max(180).optional(),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED']).optional(),
});
exports.CreateLessonBlockDto = zod_1.z.object({
    lesson_id: zod_1.z.number().int().positive('ID bài học không hợp lệ.'),
    block_type: zod_1.z.enum(['THEORY', 'PINYIN', 'HANZI', 'AUDIO', 'EXAMPLE', 'VOCABULARY'], {
        errorMap: () => ({ message: 'Loại block không hợp lệ. Chấp nhận: THEORY, PINYIN, HANZI, AUDIO, EXAMPLE, VOCABULARY.' }),
    }),
    order_index: zod_1.z.number().int().min(0, 'Thứ tự không được âm.'),
    content_json: zod_1.z.string().min(1, 'Nội dung JSON không được để trống.'),
    media_resource_id: zod_1.z.number().int().positive().optional().nullable(),
});
exports.UpdateLessonBlockDto = zod_1.z.object({
    block_type: zod_1.z.enum(['THEORY', 'PINYIN', 'HANZI', 'AUDIO', 'EXAMPLE', 'VOCABULARY']).optional(),
    order_index: zod_1.z.number().int().min(0).optional(),
    content_json: zod_1.z.string().min(1).optional(),
    media_resource_id: zod_1.z.number().int().positive().optional().nullable(),
});
