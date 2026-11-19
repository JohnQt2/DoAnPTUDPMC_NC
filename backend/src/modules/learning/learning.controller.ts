import { Request, Response, NextFunction } from 'express';
import { learningService } from './learning.service';
import { RecordPracticeDto, QueryPinyinDto } from './learning.dto';

export class LearningController {
  getPinyin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = QueryPinyinDto.parse(req.query);
      const list = await learningService.getPinyinList(query.category, query.tone);
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  };

  getMinimalPairs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pairs = await learningService.getMinimalPairs();
      res.status(200).json({ success: true, data: pairs });
    } catch (err) {
      next(err);
    }
  };

  getCharacters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const characters = await learningService.getCharacters(search, limit);
      res.status(200).json({ success: true, data: characters });
    } catch (err) {
      next(err);
    }
  };

  getCharacterDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const charId = parseInt(req.params.id, 10);
      const detail = await learningService.getCharacterDetail(charId);
      res.status(200).json({ success: true, data: detail });
    } catch (err) {
      next(err);
    }
  };

  recordPractice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const dto = RecordPracticeDto.parse(req.body);
      const result = await learningService.recordPractice(userId, dto);
      res.status(201).json({
        success: true,
        data: { message: 'Đã lưu kết quả luyện tập thành công.', record: result },
      });
    } catch (err) {
      next(err);
    }
  };

  getPracticeStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const stats = await learningService.getPracticeStats(userId);
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  };
}

export const learningController = new LearningController();
