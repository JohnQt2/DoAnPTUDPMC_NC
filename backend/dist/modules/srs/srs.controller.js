"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.srsController = exports.SrsController = void 0;
const srs_service_1 = require("./srs.service");
const srs_dto_1 = require("./srs.dto");
class SrsController {
    getDailyQueue = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 25;
            const queue = await srs_service_1.srsService.getDailyQueue(userId, limit);
            res.status(200).json({ success: true, data: queue });
        }
        catch (err) {
            next(err);
        }
    };
    submitReview = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const dto = srs_dto_1.ReviewSrsCardDto.parse(req.body);
            const result = await srs_service_1.srsService.submitReview(userId, dto);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    };
    getStats = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const stats = await srs_service_1.srsService.getSrsStats(userId);
            res.status(200).json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    };
    previewIntervals = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const charId = parseInt(req.params.charId, 10);
            const preview = await srs_service_1.srsService.previewIntervalsForChar(userId, charId);
            res.status(200).json({ success: true, data: preview });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.SrsController = SrsController;
exports.srsController = new SrsController();
