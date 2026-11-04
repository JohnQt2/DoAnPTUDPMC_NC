"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("./user.service");
const user_dto_1 = require("./user.dto");
class UserController {
    getProfile = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const profile = await user_service_1.userService.getProfile(userId);
            res.status(200).json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    };
    updateProfile = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const dto = user_dto_1.UpdateProfileDto.parse(req.body);
            const updated = await user_service_1.userService.updateProfile(userId, dto);
            res.status(200).json({
                success: true,
                data: { message: 'Cập nhật hồ sơ thành công.', profile: updated },
            });
        }
        catch (err) {
            next(err);
        }
    };
    submitOnboarding = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const dto = user_dto_1.OnboardingSurveyDto.parse(req.body);
            const result = await user_service_1.userService.submitOnboarding(userId, {
                starting_level: dto.starting_level,
                target_goal: dto.target_goal,
                daily_commitment_mins: dto.daily_commitment_mins,
                reminder_time: dto.reminder_time,
                course_id: dto.course_id,
            });
            res.status(200).json({
                success: true,
                data: { message: 'Thiết lập lộ trình học tập cá nhân thành công!', roadmap: result },
            });
        }
        catch (err) {
            next(err);
        }
    };
    updateNotifications = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const dto = user_dto_1.UpdateNotificationsDto.parse(req.body);
            const settings = await user_service_1.userService.updateNotificationSettings(userId, dto);
            res.status(200).json({
                success: true,
                data: { message: 'Cập nhật cài đặt thông báo thành công.', settings },
            });
        }
        catch (err) {
            next(err);
        }
    };
    adminListUsers = async (req, res, next) => {
        try {
            const search = req.query.search;
            const role = req.query.role;
            const status = req.query.status;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
            const result = await user_service_1.userService.adminListUsers({ search, role, status, page, limit });
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    adminUpdateUser = async (req, res, next) => {
        try {
            const adminId = req.user.userId;
            const targetUserId = parseInt(req.params.userId, 10);
            const dto = user_dto_1.AdminUpdateUserDto.parse(req.body);
            const updated = await user_service_1.userService.adminUpdateUser(adminId, targetUserId, dto);
            res.status(200).json({
                success: true,
                data: { message: 'Cập nhật thông tin và quyền người dùng thành công.', user: updated },
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.UserController = UserController;
exports.userController = new UserController();
