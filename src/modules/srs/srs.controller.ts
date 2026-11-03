import { Request, Response, NextFunction } from 'express';
import { srsService } from './srs.service';
import { ReviewSrsCardDto } from './srs.dto';

export class SrsController {
  getDailyQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const queue = await srsService.getDailyQueue(userId, limit);
      res.status(200).json({ success: true, data: queue });
    } catch (err) {
      next(err);
    }
  };

  submitReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const dto = ReviewSrsCardDto.parse(req.body);
      const result = await srsService.submitReview(userId, dto);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const stats = await srsService.getSrsStats(userId);
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  };

  previewIntervals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const charId = parseInt(req.params.charId, 10);
      const preview = await srsService.previewIntervalsForChar(userId, charId);
      res.status(200).json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  };
}

export const srsController = new SrsController();
