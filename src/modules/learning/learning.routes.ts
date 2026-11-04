import { Router } from 'express';
import { learningController } from './learning.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Public Learning Endpoints
router.get('/pinyin', learningController.getPinyin);
router.get('/pinyin/minimal-pairs', learningController.getMinimalPairs);
router.get('/characters', learningController.getCharacters);
router.get('/characters/:id', learningController.getCharacterDetail);

// Protected Practice Endpoints
router.post('/practices', authenticate, learningController.recordPractice);
router.get('/practices/stats', authenticate, learningController.getPracticeStats);

export const learningRoutes = router;
