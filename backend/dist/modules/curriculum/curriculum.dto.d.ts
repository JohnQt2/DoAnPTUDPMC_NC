import { z } from 'zod';
export declare const CreateCourseDto: z.ZodObject<{
    title: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    level: z.ZodString;
    is_published: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    title: string;
    level: string;
    is_published: boolean;
    description?: string | undefined;
}, {
    code: string;
    title: string;
    level: string;
    description?: string | undefined;
    is_published?: boolean | undefined;
}>;
export declare const UpdateCourseDto: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    level: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    level?: string | undefined;
    is_published?: boolean | undefined;
}, {
    code?: string | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    level?: string | undefined;
    is_published?: boolean | undefined;
}>;
export declare const CreateChapterDto: z.ZodObject<{
    course_id: z.ZodNumber;
    title: z.ZodString;
    order_index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    course_id: number;
    title: string;
    order_index: number;
}, {
    course_id: number;
    title: string;
    order_index: number;
}>;
export declare const UpdateChapterDto: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    order_index: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    order_index?: number | undefined;
}, {
    title?: string | undefined;
    order_index?: number | undefined;
}>;
export declare const CreateLessonDto: z.ZodObject<{
    chapter_id: z.ZodNumber;
    title: z.ZodString;
    order_index: z.ZodNumber;
    estimated_duration_mins: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PUBLISHED";
    title: string;
    order_index: number;
    chapter_id: number;
    estimated_duration_mins: number;
}, {
    title: string;
    order_index: number;
    chapter_id: number;
    status?: "DRAFT" | "PUBLISHED" | undefined;
    estimated_duration_mins?: number | undefined;
}>;
export declare const UpdateLessonDto: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    order_index: z.ZodOptional<z.ZodNumber>;
    estimated_duration_mins: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "PUBLISHED" | undefined;
    title?: string | undefined;
    order_index?: number | undefined;
    estimated_duration_mins?: number | undefined;
}, {
    status?: "DRAFT" | "PUBLISHED" | undefined;
    title?: string | undefined;
    order_index?: number | undefined;
    estimated_duration_mins?: number | undefined;
}>;
export declare const CreateLessonBlockDto: z.ZodObject<{
    lesson_id: z.ZodNumber;
    block_type: z.ZodEnum<["THEORY", "PINYIN", "HANZI", "AUDIO", "EXAMPLE", "VOCABULARY"]>;
    order_index: z.ZodNumber;
    content_json: z.ZodString;
    media_resource_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    order_index: number;
    lesson_id: number;
    block_type: "THEORY" | "PINYIN" | "HANZI" | "AUDIO" | "EXAMPLE" | "VOCABULARY";
    content_json: string;
    media_resource_id?: number | null | undefined;
}, {
    order_index: number;
    lesson_id: number;
    block_type: "THEORY" | "PINYIN" | "HANZI" | "AUDIO" | "EXAMPLE" | "VOCABULARY";
    content_json: string;
    media_resource_id?: number | null | undefined;
}>;
export declare const UpdateLessonBlockDto: z.ZodObject<{
    block_type: z.ZodOptional<z.ZodEnum<["THEORY", "PINYIN", "HANZI", "AUDIO", "EXAMPLE", "VOCABULARY"]>>;
    order_index: z.ZodOptional<z.ZodNumber>;
    content_json: z.ZodOptional<z.ZodString>;
    media_resource_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    order_index?: number | undefined;
    block_type?: "THEORY" | "PINYIN" | "HANZI" | "AUDIO" | "EXAMPLE" | "VOCABULARY" | undefined;
    content_json?: string | undefined;
    media_resource_id?: number | null | undefined;
}, {
    order_index?: number | undefined;
    block_type?: "THEORY" | "PINYIN" | "HANZI" | "AUDIO" | "EXAMPLE" | "VOCABULARY" | undefined;
    content_json?: string | undefined;
    media_resource_id?: number | null | undefined;
}>;
export type CreateCourseInput = z.infer<typeof CreateCourseDto>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseDto>;
export type CreateChapterInput = z.infer<typeof CreateChapterDto>;
export type UpdateChapterInput = z.infer<typeof UpdateChapterDto>;
export type CreateLessonInput = z.infer<typeof CreateLessonDto>;
export type UpdateLessonInput = z.infer<typeof UpdateLessonDto>;
export type CreateLessonBlockInput = z.infer<typeof CreateLessonBlockDto>;
export type UpdateLessonBlockInput = z.infer<typeof UpdateLessonBlockDto>;
