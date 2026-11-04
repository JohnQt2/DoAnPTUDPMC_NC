"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitTestDto = exports.SubmitAnswerItemDto = exports.AssignQuestionsDto = exports.UpdateTestDto = exports.CreateTestDto = exports.UpdateQuestionDto = exports.CreateQuestionDto = void 0;
const zod_1 = require("zod");
exports.CreateQuestionDto = zod_1.z.object({
    question_type: zod_1.z.enum([
        'TONE_PICKER',
        'RADICAL_BUILDER',
        'SYNTAX_SCRAMBLE',
        'AUDIO_CLOZE',
        'SPEED_MATCH',
        'MULTIPLE_CHOICE',
    ]),
    skill_category: zod_1.z.enum(['PINYIN', 'TONE', 'READING', 'LISTENING', 'WRITING']),
    difficulty_level: zod_1.z.enum(['HSK1', 'HSK2', 'EASY', 'MEDIUM', 'HARD']),
    content: zod_1.z.string().min(1, 'Nội dung câu hỏi không được để trống.'),
    options_json: zod_1.z.string().min(2, 'Các lựa chọn phải là JSON mảng hợp lệ.'),
    correct_answer: zod_1.z.string().min(1, 'Đáp án đúng không được để trống.'),
    explanation: zod_1.z.string().optional(),
    media_resource_id: zod_1.z.number().int().positive().optional(),
});
exports.UpdateQuestionDto = exports.CreateQuestionDto.partial();
exports.CreateTestDto = zod_1.z.object({
    lesson_id: zod_1.z.number().int().positive().optional(),
    title: zod_1.z.string().min(1, 'Tiêu đề bài kiểm tra không được để trống.'),
    test_type: zod_1.z.enum(['QUIZ', 'CHECKPOINT', 'MOCK_EXAM']).default('QUIZ'),
    passing_score: zod_1.z.number().int().min(0).max(100).default(80),
    time_limit_mins: zod_1.z.number().int().min(1).max(180).default(15),
    is_published: zod_1.z.boolean().default(false),
    question_ids: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
});
exports.UpdateTestDto = exports.CreateTestDto.partial();
exports.AssignQuestionsDto = zod_1.z.object({
    question_ids: zod_1.z.array(zod_1.z.number().int().positive()).min(1, 'Danh sách câu hỏi không được rỗng.'),
});
exports.SubmitAnswerItemDto = zod_1.z.object({
    question_id: zod_1.z.number().int().positive(),
    user_answer: zod_1.z.string(),
});
exports.SubmitTestDto = zod_1.z.object({
    session_token: zod_1.z.string().optional(),
    duration_seconds: zod_1.z.number().int().min(0).default(0),
    answers: zod_1.z.array(exports.SubmitAnswerItemDto),
});
