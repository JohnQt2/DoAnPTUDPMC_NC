import { Router } from 'express';
import { practiceController } from './practice.controller';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Student Collection & History routes
router.get('/collections', optionalAuthenticate, practiceController.getPublishedCollections);
router.get('/collections/:collectionId', optionalAuthenticate, practiceController.getPublishedCollectionDetail);
router.post('/collections/:collectionId/attempts', authenticate, practiceController.startCollectionAttempt);
router.get('/history', authenticate, practiceController.getStudentHistory);

// Public / student catalog
router.get('/levels', practiceController.getLevels);
router.get('/levels/:levelCode', practiceController.getLevelByCode);
router.get('/levels/:levelCode/lessons', practiceController.getLessonsByLevel);
router.get('/lessons/:lessonId', practiceController.getLessonDetail);
router.get('/lessons/:lessonId/exercise-sets', practiceController.getExerciseSetsByLesson);
router.get('/exercise-sets/:exerciseSetId', practiceController.getExerciseSet);

// Practice Session & Submission (Authenticated)
router.post('/attempts', authenticate, practiceController.startAttempt);
router.get('/attempts/:attemptId', authenticate, practiceController.getAttemptDetail);
router.put('/attempts/:attemptId/answers/:questionId', authenticate, practiceController.saveAnswer);
router.post('/attempts/:attemptId/answers/:questionId', authenticate, practiceController.saveAnswer);
router.post('/attempts/:attemptId/submit', authenticate, practiceController.submitAttempt);
router.get('/attempts/:attemptId/result', authenticate, practiceController.getAttemptResult);

// Progress Tracking (Authenticated)
router.get('/progress', authenticate, practiceController.getOverallProgress);
router.get('/progress/levels/:levelCode', authenticate, practiceController.getLevelProgress);
router.get('/progress/lessons/:lessonId', authenticate, practiceController.getLessonProgress);

export const practiceRoutes = router;
