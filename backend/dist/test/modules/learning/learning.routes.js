"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learningRoutes = void 0;
const express_1 = require("express");
const learning_controller_1 = require("./learning.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public Learning Endpoints
router.get('/pinyin', learning_controller_1.learningController.getPinyin);
router.get('/pinyin/minimal-pairs', learning_controller_1.learningController.getMinimalPairs);
router.get('/characters', learning_controller_1.learningController.getCharacters);
router.get('/characters/:id', learning_controller_1.learningController.getCharacterDetail);
// Protected Practice Endpoints
router.post('/practices', auth_middleware_1.authenticate, learning_controller_1.learningController.recordPractice);
router.get('/practices/stats', auth_middleware_1.authenticate, learning_controller_1.learningController.getPracticeStats);
exports.learningRoutes = router;
