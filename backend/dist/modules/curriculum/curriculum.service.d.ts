import { CreateCourseInput, UpdateCourseInput, CreateChapterInput, UpdateChapterInput, CreateLessonInput, UpdateLessonInput, CreateLessonBlockInput, UpdateLessonBlockInput } from './curriculum.dto';
export declare class CurriculumService {
    listCourses(publishedOnly: boolean): Promise<{
        courseId: number;
        title: string;
        code: string;
        description: string | null;
        level: string;
        isPublished: boolean;
        chaptersCount: number;
        createdAt: Date;
    }[]>;
    getCourseDetail(courseId: number, userId?: number): Promise<{
        courseId: number;
        title: string;
        code: string;
        description: string | null;
        level: string;
        isPublished: boolean;
        createdAt: Date;
        chapters: {
            chapterId: number;
            title: string;
            orderIndex: number;
            lessons: {
                isCompleted?: boolean | undefined;
                lessonId: number;
                title: string;
                orderIndex: number;
                estimatedDurationMins: number;
                status: string;
                blocksCount: number;
                vocabulariesCount: number;
                testsCount: number;
            }[];
        }[];
    }>;
    createCourse(data: CreateCourseInput): Promise<{
        courseId: number;
        title: string;
        code: string;
        level: string;
        isPublished: boolean;
        createdAt: Date;
    }>;
    updateCourse(courseId: number, data: UpdateCourseInput): Promise<{
        courseId: number;
        title: string;
        code: string;
        level: string;
        isPublished: boolean;
    }>;
    createChapter(data: CreateChapterInput): Promise<{
        chapterId: number;
        courseId: number;
        title: string;
        orderIndex: number;
    }>;
    updateChapter(chapterId: number, data: UpdateChapterInput): Promise<{
        chapterId: number;
        courseId: number;
        title: string;
        orderIndex: number;
    }>;
    deleteChapter(chapterId: number): Promise<{
        message: string;
    }>;
    createLesson(data: CreateLessonInput): Promise<{
        lessonId: number;
        chapterId: number;
        title: string;
        orderIndex: number;
        estimatedDurationMins: number;
        status: string;
    }>;
    updateLesson(lessonId: number, data: UpdateLessonInput): Promise<{
        lessonId: number;
        chapterId: number;
        title: string;
        orderIndex: number;
        estimatedDurationMins: number;
        status: string;
    }>;
    deleteLesson(lessonId: number): Promise<{
        message: string;
    }>;
    getLessonDetail(lessonId: number): Promise<{
        lessonId: number;
        title: string;
        orderIndex: number;
        estimatedDurationMins: number;
        status: string;
        chapter: {
            chapterId: number;
            title: string;
            course: {
                code: string;
                course_id: number;
                title: string;
            };
        };
        blocks: {
            blockId: number;
            blockType: string;
            orderIndex: number;
            contentJson: string;
            mediaUrl: string | null;
        }[];
        vocabularies: {
            charId: number;
            character: string;
            pinyin: string;
            sinoVietnamese: string;
            meaning: string;
            strokesCount: number;
            audioUrl: string | null;
        }[];
        tests: {
            title: string;
            test_id: number;
            test_type: string;
            passing_score: number;
            time_limit_mins: number;
        }[];
    }>;
    createLessonBlock(data: CreateLessonBlockInput): Promise<{
        blockId: number;
        lessonId: number;
        blockType: string;
        orderIndex: number;
        contentJson: string;
    }>;
    updateLessonBlock(blockId: number, data: UpdateLessonBlockInput): Promise<{
        blockId: number;
        lessonId: number;
        blockType: string;
        orderIndex: number;
        contentJson: string;
    }>;
    deleteLessonBlock(blockId: number): Promise<{
        message: string;
    }>;
    publishLesson(lessonId: number): Promise<{
        lessonId: number;
        title: string;
        status: string;
        message: string;
    }>;
    publishCourse(courseId: number): Promise<{
        courseId: number;
        title: string;
        isPublished: boolean;
        message: string;
    }>;
}
export declare const curriculumService: CurriculumService;
