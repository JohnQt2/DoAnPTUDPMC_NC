import {
  Request,
  Response,
  NextFunction,
} from 'express';

import { userService } from './user.service';

import {
  UpdateProfileDto,
  OnboardingSurveyDto,
  UpdateNotificationsDto,
  AdminUpdateUserDto,
  UpsertLearningSurveyDto,
  CreateRoadmapProposalDto,
  ConfirmRoadmapDto,
  CancelRoadmapDto,
} from './user.dto';

export class UserController {
  /**
   * Lấy hồ sơ của người dùng hiện tại.
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const profile =
        await userService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Cập nhật hồ sơ của người dùng hiện tại.
   */
  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const dto = UpdateProfileDto.parse(
        req.body
      );

      const updated =
        await userService.updateProfile(
          userId,
          dto
        );

      res.status(200).json({
        success: true,
        data: {
          message:
            'Cập nhật hồ sơ thành công.',
          profile: updated,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * UC02 cũ:
   * Gửi khảo sát onboarding và tạo roadmap trực tiếp.
   *
   * Tạm thời giữ API này để không làm hỏng
   * ProfilePage hiện tại.
   */
  submitOnboarding = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const dto = OnboardingSurveyDto.parse(
        req.body
      );

      const result =
        await userService.submitOnboarding(
          userId,
          {
            starting_level:
              dto.starting_level,

            target_goal:
              dto.target_goal,

            daily_commitment_mins:
              dto.daily_commitment_mins,

            reminder_time:
              dto.reminder_time,

            course_id:
              dto.course_id,
          }
        );

      res.status(200).json({
        success: true,
        data: {
          message:
            'Thiết lập lộ trình học tập cá nhân thành công!',

          roadmap: result,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Lấy khảo sát nhu cầu học hiện tại.
   *
   * Nếu chưa có khảo sát:
   * data sẽ trả về null.
   */
  getLearningSurvey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const survey =
        await userService.getLearningSurvey(
          userId
        );

      res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Tạo mới hoặc cập nhật khảo sát nhu cầu học.
   *
   * DTO chịu trách nhiệm kiểm tra trình độ,
   * mục tiêu, thời gian và các lựa chọn.
   */
  upsertLearningSurvey = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const dto =
        UpsertLearningSurveyDto.parse(
          req.body
        );

      const survey =
        await userService.upsertLearningSurvey(
          userId,
          dto
        );

      res.status(200).json({
        success: true,
        data: {
          message:
            'Đã lưu khảo sát nhu cầu học thành công.',

          survey,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * UC03:
   * Cập nhật cài đặt thông báo nhắc học.
   */
  updateNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const dto =
        UpdateNotificationsDto.parse(
          req.body
        );

      const settings =
        await userService
          .updateNotificationSettings(
            userId,
            dto
          );

      res.status(200).json({
        success: true,
        data: {
          message:
            'Cập nhật cài đặt thông báo thành công.',

          settings,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  /**
   * Lấy proposal mới nhất hoặc roadmap đang hoạt động.
   */
  getCurrentRoadmap = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const roadmap =
        await userService.getCurrentRoadmap(
          userId
        );

      res.status(200).json({
        success: true,
        data: roadmap,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lưu lộ trình được đề xuất.
   */
  createRoadmapProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const dto =
        CreateRoadmapProposalDto.parse(
          req.body
        );

      const roadmap =
        await userService.createRoadmapProposal(
          userId,
          dto
        );

      res.status(201).json({
        success: true,
        data: {
          message:
            'Đã lưu lộ trình đề xuất.',
          roadmap,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Xác nhận và kích hoạt roadmap đề xuất.
   */
  confirmRoadmap = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const dto =
        ConfirmRoadmapDto.parse(
          req.body
        );

      const roadmap =
        await userService.confirmRoadmap(
          userId,
          dto.roadmap_id
        );

      res.status(200).json({
        success: true,
        data: {
          message:
            'Đã xác nhận lộ trình học tập.',
          roadmap,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Hủy roadmap đang ở trạng thái PROPOSED.
   */
  cancelRoadmapProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const dto =
        CancelRoadmapDto.parse(
          req.body
        );

      const roadmap =
        await userService.cancelRoadmapProposal(
          userId,
          dto.roadmap_id
        );

      res.status(200).json({
        success: true,
        data: {
          message:
            'Đã hủy lộ trình đề xuất.',
          roadmap,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  /**
   * Admin:
   * Lấy danh sách người dùng và thống kê.
   */
  adminListUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const search =
        req.query.search as string;

      const role =
        req.query.role as string;

      const status =
        req.query.status as string;

      const page = req.query.page
        ? parseInt(
          req.query.page as string,
          10
        )
        : 1;

      const limit = req.query.limit
        ? parseInt(
          req.query.limit as string,
          10
        )
        : 10;

      const result =
        await userService.adminListUsers({
          search,
          role,
          status,
          page,
          limit,
        });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Admin:
   * Lấy danh sách Audit Log.
   */
  adminListAuditLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = req.query.limit
        ? parseInt(
          req.query.limit as string,
          10
        )
        : 25;

      const logs =
        await userService
          .adminListAuditLogs(limit);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Admin:
   * Cập nhật vai trò hoặc trạng thái người dùng.
   */
  adminUpdateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = req.user!.userId;

      const targetUserId = parseInt(
        req.params.userId,
        10
      );

      const dto =
        AdminUpdateUserDto.parse(
          req.body
        );

      const updated =
        await userService.adminUpdateUser(
          adminId,
          targetUserId,
          dto
        );

      res.status(200).json({
        success: true,
        data: {
          message:
            'Cập nhật thông tin và quyền người dùng thành công.',

          user: updated,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const userController =
  new UserController();