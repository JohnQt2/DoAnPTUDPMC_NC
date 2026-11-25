import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { examController } from './exam.controller';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';

// Đảm bảo thư mục lưu trữ uploads/exams luôn sẵn sàng
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'exams');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Cấu hình lưu trữ Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    // Sanitize tên file
    const ext = path.extname(file.originalname);
    const basename = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    cb(null, `${basename}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80MB cho audio/pdf chất lượng cao
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.mp3', '.m4a', '.wav', '.ogg', '.aac', '.png', '.jpg', '.jpeg'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Định dạng file không hỗ trợ: ${ext}. Chỉ chấp nhận PDF, MP3/Audio và ảnh.`));
    }
  },
});

const router = Router();

// ── Public / Học viên routes (kèm optional auth để lấy best_score) ─────────────
router.get('/', optionalAuthenticate, examController.listExams);
router.get('/admin/all', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.listAdminExams);
router.get('/:id', optionalAuthenticate, examController.getExamById);

// ── Nộp bài & xem kết quả bài làm (Học viên đăng nhập) ─────────────────────────
router.post('/:id/submit', authenticate, examController.submitExam);
router.get('/:id/my-attempts', authenticate, examController.getUserAttempts);
router.get('/attempts/:attemptId', authenticate, examController.getAttemptDetails);

// ── Quản lý đề thi (Giáo viên / Admin) ─────────────────────────────────────────
router.post('/', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.createExam);
router.put('/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.updateExam);
router.delete('/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.deleteExam);
router.post(
  '/:id/sections',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  examController.saveSections
);

// Upload files: file đề PDF, audio MP3, file đáp án PDF
router.post(
  '/upload',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  upload.fields([
    { name: 'exam_pdf', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'answer_pdf', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  examController.uploadFiles
);

export const examRoutes = router;
