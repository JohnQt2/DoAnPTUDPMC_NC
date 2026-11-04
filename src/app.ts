import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './shared/middleware/error.middleware';
import { prisma } from './shared/database/prisma.client';
import { redisService } from './shared/redis/redis.service';

// Module Routes
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { curriculumRoutes } from './modules/curriculum/curriculum.routes';
import { learningRoutes } from './modules/learning/learning.routes';
import { assessmentRoutes } from './modules/assessment/assessment.routes';
import { srsRoutes } from './modules/srs/srs.routes';

export const app = express();

// Standard Middlewares
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint (UC16)
app.get('/api/v1/health', async (req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'ChinaEasy Backend (Modular Monolith)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: dbOk ? 'UP' : 'DOWN',
    redis: redisService.isReady() ? 'UP' : 'MEMORY_STORE',
    architecture: 'Modular Monolith v2026.1',
  });
});

// Mount Modular Monolith Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/curriculum', curriculumRoutes);
app.use('/api/v1/learning', learningRoutes);
app.use('/api/v1/assessment', assessmentRoutes);
app.use('/api/v1/srs', srsRoutes);

// Global Error Handler
app.use(errorHandler);
