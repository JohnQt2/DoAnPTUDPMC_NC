import { z } from 'zod';
export declare const CreateQuestionDto: z.ZodObject<{
    question_type: z.ZodEnum<["TONE_PICKER", "RADICAL_BUILDER", "SYNTAX_SCRAMBLE", "AUDIO_CLOZE", "SPEED_MATCH", "MULTIPLE_CHOICE"]>;
    skill_category: z.ZodEnum<["PINYIN", "TONE", "READING", "LISTENING", "WRITING"]>;
    difficulty_level: z.ZodEnum<["HSK1", "HSK2", "EASY", "MEDIUM", "HARD"]>;
    content: z.ZodString;
    options_json: z.ZodString;
    correct_answer: z.ZodString;
    explanation: z.ZodOptional<z.ZodString>;
    media_resource_id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    question_type: "TONE_PICKER" | "RADICAL_BUILDER" | "SYNTAX_SCRAMBLE" | "AUDIO_CLOZE" | "SPEED_MATCH" | "MULTIPLE_CHOICE";
    skill_category: "PINYIN" | "TONE" | "READING" | "LISTENING" | "WRITING";
    difficulty_level: "HSK1" | "HSK2" | "EASY" | "MEDIUM" | "HARD";
    content: string;
    options_json: string;
    correct_answer: string;
    media_resource_id?: number | undefined;
    explanation?: string | undefined;
}, {
    question_type: "TONE_PICKER" | "RADICAL_BUILDER" | "SYNTAX_SCRAMBLE" | "AUDIO_CLOZE" | "SPEED_MATCH" | "MULTIPLE_CHOICE";
    skill_category: "PINYIN" | "TONE" | "READING" | "LISTENING" | "WRITING";
    difficulty_level: "HSK1" | "HSK2" | "EASY" | "MEDIUM" | "HARD";
    content: string;
    options_json: string;
    correct_answer: string;
    media_resource_id?: number | undefined;
    explanation?: string | undefined;
}>;
export declare const UpdateQuestionDto: z.ZodObject<{
    question_type: z.ZodOptional<z.ZodEnum<["TONE_PICKER", "RADICAL_BUILDER", "SYNTAX_SCRAMBLE", "AUDIO_CLOZE", "SPEED_MATCH", "MULTIPLE_CHOICE"]>>;
    skill_category: z.ZodOptional<z.ZodEnum<["PINYIN", "TONE", "READING", "LISTENING", "WRITING"]>>;
    difficulty_level: z.ZodOptional<z.ZodEnum<["HSK1", "HSK2", "EASY", "MEDIUM", "HARD"]>>;
    content: z.ZodOptional<z.ZodString>;
    options_json: z.ZodOptional<z.ZodString>;
    correct_answer: z.ZodOptional<z.ZodString>;
    explanation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    media_resource_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    media_resource_id?: number | undefined;
    question_type?: "TONE_PICKER" | "RADICAL_BUILDER" | "SYNTAX_SCRAMBLE" | "AUDIO_CLOZE" | "SPEED_MATCH" | "MULTIPLE_CHOICE" | undefined;
    skill_category?: "PINYIN" | "TONE" | "READING" | "LISTENING" | "WRITING" | undefined;
    difficulty_level?: "HSK1" | "HSK2" | "EASY" | "MEDIUM" | "HARD" | undefined;
    content?: string | undefined;
    options_json?: string | undefined;
    correct_answer?: string | undefined;
    explanation?: string | undefined;
}, {
    media_resource_id?: number | undefined;
    question_type?: "TONE_PICKER" | "RADICAL_BUILDER" | "SYNTAX_SCRAMBLE" | "AUDIO_CLOZE" | "SPEED_MATCH" | "MULTIPLE_CHOICE" | undefined;
    skill_category?: "PINYIN" | "TONE" | "READING" | "LISTENING" | "WRITING" | undefined;
    difficulty_level?: "HSK1" | "HSK2" | "EASY" | "MEDIUM" | "HARD" | undefined;
    content?: string | undefined;
    options_json?: string | undefined;
    correct_answer?: string | undefined;
    explanation?: string | undefined;
}>;
export declare const CreateTestDto: z.ZodObject<{
    lesson_id: z.ZodOptional<z.ZodNumber>;
    title: z.ZodString;
    test_type: z.ZodDefault<z.ZodEnum<["QUIZ", "CHECKPOINT", "MOCK_EXAM"]>>;
    passing_score: z.ZodDefault<z.ZodNumber>;
    time_limit_mins: z.ZodDefault<z.ZodNumber>;
    is_published: z.ZodDefault<z.ZodBoolean>;
    question_ids: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    is_published: boolean;
    test_type: "QUIZ" | "CHECKPOINT" | "MOCK_EXAM";
    passing_score: number;
    time_limit_mins: number;
    lesson_id?: number | undefined;
    question_ids?: number[] | undefined;
}, {
    title: string;
    is_published?: boolean | undefined;
    lesson_id?: number | undefined;
    test_type?: "QUIZ" | "CHECKPOINT" | "MOCK_EXAM" | undefined;
    passing_score?: number | undefined;
    time_limit_mins?: number | undefined;
    question_ids?: number[] | undefined;
}>;
export declare const UpdateTestDto: z.ZodObject<{
    lesson_id: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    title: z.ZodOptional<z.ZodString>;
    test_type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["QUIZ", "CHECKPOINT", "MOCK_EXAM"]>>>;
    passing_score: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    time_limit_mins: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    is_published: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    question_ids: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    is_published?: boolean | undefined;
    lesson_id?: number | undefined;
    test_type?: "QUIZ" | "CHECKPOINT" | "MOCK_EXAM" | undefined;
    passing_score?: number | undefined;
    time_limit_mins?: number | undefined;
    question_ids?: number[] | undefined;
}, {
    title?: string | undefined;
    is_published?: boolean | undefined;
    lesson_id?: number | undefined;
    test_type?: "QUIZ" | "CHECKPOINT" | "MOCK_EXAM" | undefined;
    passing_score?: number | undefined;
    time_limit_mins?: number | undefined;
    question_ids?: number[] | undefined;
}>;
export declare const AssignQuestionsDto: z.ZodObject<{
    question_ids: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    question_ids: number[];
}, {
    question_ids: number[];
}>;
export declare const SubmitAnswerItemDto: z.ZodObject<{
    question_id: z.ZodNumber;
    user_answer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    question_id: number;
    user_answer: string;
}, {
    question_id: number;
    user_answer: string;
}>;
export declare const SubmitTestDto: z.ZodObject<{
    session_token: z.ZodOptional<z.ZodString>;
    duration_seconds: z.ZodDefault<z.ZodNumber>;
    answers: z.ZodArray<z.ZodObject<{
        question_id: z.ZodNumber;
        user_answer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        question_id: number;
        user_answer: string;
    }, {
        question_id: number;
        user_answer: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    duration_seconds: number;
    answers: {
        question_id: number;
        user_answer: string;
    }[];
    session_token?: string | undefined;
}, {
    answers: {
        question_id: number;
        user_answer: string;
    }[];
    session_token?: string | undefined;
    duration_seconds?: number | undefined;
}>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionDto>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionDto>;
export type CreateTestInput = z.infer<typeof CreateTestDto>;
export type UpdateTestInput = z.infer<typeof UpdateTestDto>;
export type SubmitTestInput = z.infer<typeof SubmitTestDto>;
