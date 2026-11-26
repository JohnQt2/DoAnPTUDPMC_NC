import express from 'express';
import path from 'path';
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
import { contentRoutes } from './modules/content/content.routes';
import { examRoutes } from './modules/exam/exam.routes';
import { userController } from './modules/user/user.controller';
import { authenticate } from './shared/middleware/auth.middleware';

import { practiceRoutes } from './modules/practice/practice.routes';
import { practiceAdminRoutes } from './modules/practice-admin/practice-admin.routes';

export const app = express();

// Security Hardening: Hide Express signature, trust Nginx proxy hop, attach standard security headers
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow framing for uploads (PDF split screen preview across different dev ports)
  if (req.path.startsWith('/uploads')) {
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
  } else {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

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

// Static Media Serving for Workbook Practice & Assets
app.use('/media', express.static(path.join(__dirname, '../public/media')));
app.use('/public', express.static(path.join(__dirname, '../public')));

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
app.use('/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/users', userRoutes);
app.get('/api/v1/progress', authenticate, userController.getUserProgressOverview);
app.get('/progress', authenticate, userController.getUserProgressOverview);
app.use('/api/v1/curriculum', curriculumRoutes);
app.use('/api/v1/learning', learningRoutes);
app.use('/api/v1/assessment', assessmentRoutes);
app.use('/api/v1/srs', srsRoutes);

// Content Module — HSK Curriculum Content APIs (Giai đoạn 4)
app.use('/api/v1/content', contentRoutes);
// Shorthand aliases (/api/courses, /api/units, /api/materials) for frontend convenience
app.use('/api', contentRoutes);

// Static file serving for uploads (PDFs, Audio MP3s with Accept-Ranges support)
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    res.removeHeader('X-Frame-Options');
    next();
  },
  express.static(path.join(process.cwd(), 'uploads'), {
    acceptRanges: true,
  })
);

// Mock Exam Module — Phân hệ Luyện thi thử HSK 1–6 (PDF + Audio)
app.use('/api/v1/exams', examRoutes);
app.use('/api/exams', examRoutes);
app.use('/exams', examRoutes);

// Workbook Practice CMS Admin Module (Must be mounted before dynamic /practice routes)
app.use('/api/v1/practice/admin', practiceAdminRoutes);

// Workbook Practice Module (HSK1-HSK6)
app.use('/api/v1/practice', practiceRoutes);
app.use('/practice', practiceRoutes);
// Global Error Handler
app.use(errorHandler);
