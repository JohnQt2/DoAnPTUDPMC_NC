import { Router } from 'express';
import { srsController } from './srs.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Protected SRS Endpoints
router.get('/queue', authenticate, srsController.getDailyQueue);
router.post('/review', authenticate, srsController.submitReview);
router.get('/stats', authenticate, srsController.getStats);
router.get('/preview/:charId', authenticate, srsController.previewIntervals);

export const srsRoutes = router;
