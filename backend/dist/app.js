"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./shared/middleware/error.middleware");
const prisma_client_1 = require("./shared/database/prisma.client");
const redis_service_1 = require("./shared/redis/redis.service");
// Module Routes
const auth_routes_1 = require("./modules/auth/auth.routes");
const user_routes_1 = require("./modules/user/user.routes");
const curriculum_routes_1 = require("./modules/curriculum/curriculum.routes");
const learning_routes_1 = require("./modules/learning/learning.routes");
const assessment_routes_1 = require("./modules/assessment/assessment.routes");
const srs_routes_1 = require("./modules/srs/srs.routes");
exports.app = (0, express_1.default)();
// Standard Middlewares
exports.app.use((0, cors_1.default)({
    origin: [env_1.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
}));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check Endpoint (UC16)
exports.app.get('/api/v1/health', async (req, res) => {
    let dbOk = false;
    try {
        await prisma_client_1.prisma.$queryRaw `SELECT 1`;
        dbOk = true;
    }
    catch {
        dbOk = false;
    }
    res.status(dbOk ? 200 : 503).json({
        status: dbOk ? 'healthy' : 'degraded',
        service: 'ChinaEasy Backend (Modular Monolith)',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        database: dbOk ? 'UP' : 'DOWN',
        redis: redis_service_1.redisService.isReady() ? 'UP' : 'MEMORY_STORE',
        architecture: 'Modular Monolith v2026.1',
    });
});
// Mount Modular Monolith Routes
exports.app.use('/api/v1/auth', auth_routes_1.authRoutes);
exports.app.use('/api/v1/users', user_routes_1.userRoutes);
exports.app.use('/api/v1/curriculum', curriculum_routes_1.curriculumRoutes);
exports.app.use('/api/v1/learning', learning_routes_1.learningRoutes);
exports.app.use('/api/v1/assessment', assessment_routes_1.assessmentRoutes);
exports.app.use('/api/v1/srs', srs_routes_1.srsRoutes);
// Global Error Handler
exports.app.use(error_middleware_1.errorHandler);
