import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import {
  UpdateProfileDto,
  OnboardingSurveyDto,
  UpdateNotificationsDto,
  AdminUpdateUserDto,
} from './user.dto';

export class UserController {
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const profile = await userService.getProfile(userId);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const dto = UpdateProfileDto.parse(req.body);
      const updated = await userService.updateProfile(userId, dto);
      res.status(200).json({
        success: true,
        data: { message: 'Cập nhật hồ sơ thành công.', profile: updated },
      });
    } catch (err) {
      next(err);
    }
  };

  submitOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const dto = OnboardingSurveyDto.parse(req.body);
      const result = await userService.submitOnboarding(userId, dto);
      res.status(200).json({
        success: true,
        data: {
          message: dto.skip
            ? 'Đã áp dụng lộ trình mặc định thành công (Bỏ qua khảo sát)!'
            : 'Thiết lập lộ trình học tập cá nhân thành công!',
          ...result,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  previewOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = OnboardingSurveyDto.parse(req.body);
      const preview = await userService.previewOnboarding(dto);
      res.status(200).json({
        success: true,
        data: {
          message: 'Tạo bản xem trước lộ trình đề xuất thành công.',
          ...preview,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getActiveRoadmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const roadmap = await userService.getActiveRoadmap(userId);
      res.status(200).json({
        success: true,
        data: roadmap,
      });
    } catch (err) {
      next(err);
    }
  };

  getUserProgressOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const progress = await userService.getUserProgressOverview(userId);
      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (err) {
      next(err);
    }
  };

  updateNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const dto = UpdateNotificationsDto.parse(req.body);
      const settings = await userService.updateNotificationSettings(userId, dto);
      res.status(200).json({
        success: true,
        data: { message: 'Cập nhật cài đặt thông báo thành công.', settings },
      });
    } catch (err) {
      next(err);
    }
  };

  adminListUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string;
      const role = req.query.role as string;
      const status = req.query.status as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await userService.adminListUsers({ search, role, status, page, limit });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  adminListAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const logs = await userService.adminListAuditLogs(limit);
      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  };

  adminUpdateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const targetUserId = parseInt(req.params.userId, 10);
      const dto = AdminUpdateUserDto.parse(req.body);

      const updated = await userService.adminUpdateUser(adminId, targetUserId, dto);
      res.status(200).json({
        success: true,
        data: { message: 'Cập nhật thông tin và quyền người dùng thành công.', user: updated },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
