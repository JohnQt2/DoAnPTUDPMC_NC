"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.srsRoutes = void 0;
const express_1 = require("express");
const srs_controller_1 = require("./srs.controller");
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
// Protected SRS Endpoints
router.get('/queue', auth_middleware_1.authenticate, srs_controller_1.srsController.getDailyQueue);
router.post('/review', auth_middleware_1.authenticate, srs_controller_1.srsController.submitReview);
router.get('/stats', auth_middleware_1.authenticate, srs_controller_1.srsController.getStats);
router.get('/preview/:charId', auth_middleware_1.authenticate, srs_controller_1.srsController.previewIntervals);
exports.srsRoutes = router;
