import { Router } from 'express';
import { learningController } from './learning.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Protected Learning & Practice Endpoints (Requires Authentication)
router.get('/pinyin', authenticate, learningController.getPinyin);
router.get('/pinyin/minimal-pairs', authenticate, learningController.getMinimalPairs);
router.get('/characters', authenticate, learningController.getCharacters);
router.get('/characters/:id', authenticate, learningController.getCharacterDetail);
router.post('/practices', authenticate, learningController.recordPractice);
router.get('/practices/stats', authenticate, learningController.getPracticeStats);

export const learningRoutes = router;
