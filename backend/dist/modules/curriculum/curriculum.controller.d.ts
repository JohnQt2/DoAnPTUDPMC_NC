import { Request, Response, NextFunction } from 'express';
export declare class CurriculumController {
    listCourses: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCourseDetail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createCourse: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateCourse: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    publishCourse: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createChapter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateChapter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteChapter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createLesson: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateLesson: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteLesson: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getLessonDetail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    publishLesson: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createLessonBlock: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateLessonBlock: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteLessonBlock: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const curriculumController: CurriculumController;
