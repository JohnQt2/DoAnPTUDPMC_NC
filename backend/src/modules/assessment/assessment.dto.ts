import { z } from 'zod';

export const CreateQuestionDto = z.object({
  question_type: z.enum([
    'TONE_PICKER',
    'RADICAL_BUILDER',
    'SYNTAX_SCRAMBLE',
    'AUDIO_CLOZE',
    'SPEED_MATCH',
    'MULTIPLE_CHOICE',
  ]),
  skill_category: z.enum(['PINYIN', 'TONE', 'READING', 'LISTENING', 'WRITING']),
  difficulty_level: z.enum(['HSK1', 'HSK2', 'EASY', 'MEDIUM', 'HARD']),
  content: z.string().min(1, 'Nội dung câu hỏi không được để trống.'),
  options_json: z.string().min(2, 'Các lựa chọn phải là JSON mảng hợp lệ.'),
  correct_answer: z.string().min(1, 'Đáp án đúng không được để trống.'),
  explanation: z.string().optional(),
  media_resource_id: z.number().int().positive().optional(),
});

export const UpdateQuestionDto = CreateQuestionDto.partial();

export const CreateTestDto = z.object({
  lesson_id: z.number().int().positive().optional(),
  title: z.string().min(1, 'Tiêu đề bài kiểm tra không được để trống.'),
  test_type: z.enum(['QUIZ', 'CHECKPOINT', 'MOCK_EXAM']).default('QUIZ'),
  passing_score: z.number().int().min(0).max(100).default(80),
  time_limit_mins: z.number().int().min(1).max(180).default(15),
  is_published: z.boolean().default(false),
  question_ids: z.array(z.number().int().positive()).optional(),
});

export const UpdateTestDto = CreateTestDto.partial();

export const AssignQuestionsDto = z.object({
  question_ids: z.array(z.number().int().positive()).min(1, 'Danh sách câu hỏi không được rỗng.'),
});

export const SubmitAnswerItemDto = z.object({
  question_id: z.number().int().positive(),
  user_answer: z.string(),
});

export const SubmitTestDto = z.object({
  session_token: z.string().optional(),
  duration_seconds: z.number().int().min(0).default(0),
  answers: z.array(SubmitAnswerItemDto),
});

export type CreateQuestionInput = z.infer<typeof CreateQuestionDto>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionDto>;
export type CreateTestInput = z.infer<typeof CreateTestDto>;
export type UpdateTestInput = z.infer<typeof UpdateTestDto>;
export type SubmitTestInput = z.infer<typeof SubmitTestDto>;
