"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learningController = exports.LearningController = void 0;
const learning_service_1 = require("./learning.service");
const learning_dto_1 = require("./learning.dto");
class LearningController {
    getPinyin = async (req, res, next) => {
        try {
            const query = learning_dto_1.QueryPinyinDto.parse(req.query);
            const list = await learning_service_1.learningService.getPinyinList(query.category, query.tone);
            res.status(200).json({ success: true, data: list });
        }
        catch (err) {
            next(err);
        }
    };
    getMinimalPairs = async (req, res, next) => {
        try {
            const pairs = await learning_service_1.learningService.getMinimalPairs();
            res.status(200).json({ success: true, data: pairs });
        }
        catch (err) {
            next(err);
        }
    };
    getCharacters = async (req, res, next) => {
        try {
            const search = req.query.search;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 30;
            const characters = await learning_service_1.learningService.getCharacters(search, limit);
            res.status(200).json({ success: true, data: characters });
        }
        catch (err) {
            next(err);
        }
    };
    getCharacterDetail = async (req, res, next) => {
        try {
            const charId = parseInt(req.params.id, 10);
            const detail = await learning_service_1.learningService.getCharacterDetail(charId);
            res.status(200).json({ success: true, data: detail });
        }
        catch (err) {
            next(err);
        }
    };
    recordPractice = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const dto = learning_dto_1.RecordPracticeDto.parse(req.body);
            const result = await learning_service_1.learningService.recordPractice(userId, dto);
            res.status(201).json({
                success: true,
                data: { message: 'Đã lưu kết quả luyện tập thành công.', record: result },
            });
        }
        catch (err) {
            next(err);
        }
    };
    getPracticeStats = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const stats = await learning_service_1.learningService.getPracticeStats(userId);
            res.status(200).json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.LearningController = LearningController;
exports.learningController = new LearningController();
