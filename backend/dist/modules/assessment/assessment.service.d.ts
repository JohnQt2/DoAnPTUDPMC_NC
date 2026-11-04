import { CreateQuestionInput, UpdateQuestionInput, CreateTestInput, UpdateTestInput, SubmitTestInput } from './assessment.dto';
export declare class AssessmentService {
    listQuestions(query: {
        question_type?: string;
        skill_category?: string;
        difficulty_level?: string;
        search?: string;
        limit?: number;
    }): Promise<({
        mediaResource: {
            created_at: Date;
            resource_id: number;
            file_name: string;
            storage_key: string;
            public_url: string;
            mime_type: string;
            file_size_bytes: number;
            resource_type: string;
            uploaded_by: number | null;
        } | null;
    } & {
        created_at: Date;
        media_resource_id: number | null;
        question_type: string;
        skill_category: string;
        difficulty_level: string;
        content: string;
        options_json: string;
        correct_answer: string;
        explanation: string | null;
        question_id: number;
    })[]>;
    createQuestion(data: CreateQuestionInput): Promise<{
        created_at: Date;
        media_resource_id: number | null;
        question_type: string;
        skill_category: string;
        difficulty_level: string;
        content: string;
        options_json: string;
        correct_answer: string;
        explanation: string | null;
        question_id: number;
    }>;
    updateQuestion(questionId: number, data: UpdateQuestionInput): Promise<{
        created_at: Date;
        media_resource_id: number | null;
        question_type: string;
        skill_category: string;
        difficulty_level: string;
        content: string;
        options_json: string;
        correct_answer: string;
        explanation: string | null;
        question_id: number;
    }>;
    deleteQuestion(questionId: number): Promise<{
        created_at: Date;
        media_resource_id: number | null;
        question_type: string;
        skill_category: string;
        difficulty_level: string;
        content: string;
        options_json: string;
        correct_answer: string;
        explanation: string | null;
        question_id: number;
    }>;
    createTest(data: CreateTestInput): Promise<{
        created_at: Date;
        title: string;
        is_published: boolean;
        lesson_id: number | null;
        test_id: number;
        test_type: string;
        passing_score: number;
        time_limit_mins: number;
    }>;
    getTestDetail(testId: number, includeAnswers?: boolean): Promise<{
        testId: number;
        title: string;
        testType: string;
        passingScore: number;
        timeLimitMins: number;
        isPublished: boolean;
        lessonId: number | null;
        lessonTitle: string | undefined;
        questionsCount: number;
        questions: {
            questionId: number;
            orderIndex: number;
            questionType: string;
            skillCategory: string;
            difficultyLevel: string;
            content: string;
            options: any;
            mediaUrl: string | null;
            correctAnswer: string | undefined;
            explanation: string | null | undefined;
        }[];
    }>;
    updateTest(testId: number, data: UpdateTestInput): Promise<{
        created_at: Date;
        title: string;
        is_published: boolean;
        lesson_id: number | null;
        test_id: number;
        test_type: string;
        passing_score: number;
        time_limit_mins: number;
    }>;
    assignQuestions(testId: number, questionIds: number[]): Promise<{
        assignedCount: number;
    }>;
    /**
     * Tạo phiên làm bài với cơ chế Snapshot câu hỏi:
     * Chụp lại toàn bộ câu hỏi, phương án và trọng số tại thời điểm làm bài
     * để đảm bảo tính bất biến nếu ngân hàng câu hỏi bị sửa đổi sau này.
     */
    startTestSession(userId: number, testId: number): Promise<{
        sessionToken: string;
        testId: number;
        title: string;
        timeLimitMins: number;
        passingScore: number;
        questionsCount: number;
        questions: {
            questionId: number;
            questionType: string;
            skillCategory: string;
            content: string;
            options: any;
            mediaUrl: string | null;
        }[];
    }>;
    /**
     * Nộp bài kiểm tra, chấm điểm, áp dụng Idempotency-Key và xử lý trong Prisma Transaction.
     * Đồng thời kiểm tra điều kiện hoàn thành 80% để mở khóa bài học tiếp theo (UC06).
     */
    submitTest(userId: number, testId: number, data: SubmitTestInput, idempotencyKey?: string): Promise<{
        submissionId: number;
        score: number;
        isPassed: boolean;
        passingScore: number;
        durationSeconds: number;
        nextLessonUnlocked: boolean;
        nextLessonId: number | null;
        details: {
            question_id: number;
            user_answer: string;
            correct_answer: string;
            is_correct: boolean;
            explanation: string | null;
        }[];
    } | {
        isIdempotentReplay: boolean;
        submissionId: number;
        score: number;
        isPassed: boolean;
        durationSeconds: number;
        submittedAt: Date;
        details: {
            questionId: number;
            userAnswer: string;
            correctAnswer: string;
            isCorrect: boolean;
            explanation: string | null;
        }[];
    }>;
    /**
     * Kiểm tra điều kiện mở khóa bài học:
     * Bài học đầu tiên luôn mở. Các bài học sau chỉ mở khi bài học trước đạt >= 80% điểm hoặc đã hoàn thành.
     */
    checkLessonUnlockStatus(userId: number, lessonId: number): Promise<{
        isUnlocked: boolean;
        reason?: string;
        requiredScore?: number;
        previousLesson?: {
            lessonId: number;
            title: string;
        };
    }>;
    getUserSubmissions(userId: number, testId?: number): Promise<({
        test: {
            title: string;
            lesson_id: number | null;
            test_id: number;
            passing_score: number;
        };
    } & {
        user_id: number;
        test_id: number;
        score: number;
        duration_seconds: number;
        submission_id: number;
        is_passed: boolean;
        idempotency_key: string | null;
        snapshot_data: string | null;
        submitted_at: Date;
    })[]>;
    getSubmissionDetail(userId: number, submissionId: number): Promise<{
        submissionId: number;
        testTitle: string;
        score: number;
        isPassed: boolean;
        passingScore: number;
        durationSeconds: number;
        submittedAt: Date;
        details: {
            questionId: number;
            content: string;
            options: any;
            userAnswer: string;
            correctAnswer: string;
            isCorrect: boolean;
            explanation: string | null;
            mediaUrl: string | null;
        }[];
    }>;
}
export declare const assessmentService: AssessmentService;
