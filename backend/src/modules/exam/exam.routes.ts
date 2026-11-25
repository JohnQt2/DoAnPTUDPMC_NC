import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { examController } from './exam.controller';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/rbac.middleware';

// Đảm bảo thư mục lưu trữ uploads/exams luôn sẵn sàng
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'exams');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Cấu hình lưu trữ Multer: Tên file an toàn (Fix lỗi ký tự tiếng Trung & khoảng trắng)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    // Luôn lưu với tên an toàn tránh lỗi tiếng Trung/khoảng trắng trên hệ thống tệp
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB hỗ trợ audio HSK dài và PDF chất lượng cao
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

const uploadExamFields = upload.fields([
  { name: 'exam_pdf', maxCount: 1 },
  { name: 'examPdf', maxCount: 1 },
  { name: 'answer_pdf', maxCount: 1 },
  { name: 'answerPdf', maxCount: 1 },
  { name: 'transcript_pdf', maxCount: 1 },
  { name: 'transcriptPdf', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

const router = Router();

// ── Public / Học viên routes (kèm optional auth để lấy best_score) ─────────────
router.get('/', optionalAuthenticate, examController.listExams);
router.get('/manage', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.listAdminExams);
router.get('/admin/all', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.listAdminExams);

// ── Làm bài thi (Học viên - Tuyệt đối ẩn đáp án và file PDF đáp án) ───────────
router.get('/:examId/take', authenticate, examController.getExamForTaking);
router.get('/:id/take', authenticate, examController.getExamForTaking);

// ── Chi tiết đề thi (kèm kiểm tra đã nộp bài hay chưa) ────────────────────────
router.get('/:examId', optionalAuthenticate, examController.getExamById);
router.get('/:id', optionalAuthenticate, examController.getExamById);

// ── Nộp bài & xem kết quả bài làm (Học viên đăng nhập) ─────────────────────────
router.post('/:examId/submit', authenticate, examController.submitExam);
router.post('/:id/submit', authenticate, examController.submitExam);
router.get('/:examId/my-attempts', authenticate, examController.getUserAttempts);
router.get('/:id/my-attempts', authenticate, examController.getUserAttempts);
router.get('/attempts/:attemptId', authenticate, examController.getAttemptDetails);

// ── Quản lý đề thi & Upload file (Giáo viên / Admin) ─────────────────────────
router.post(
  '/upload-batch',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  upload.any(),
  examController.uploadBatchFiles
);
router.post(
  '/upload',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  uploadExamFields,
  examController.uploadFiles
);
router.delete(
  '/upload',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  examController.deleteUploadedFile
);
router.post(
  '/parse-files',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  uploadExamFields,
  examController.parseExamFiles
);

router.post('/', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.createExam);
router.put('/:examId', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.updateExam);
router.put('/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.updateExam);
router.patch('/:examId/publish', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.publishExam);
router.patch('/:id/publish', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.publishExam);
router.patch('/attempts/:attemptId/grade', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.gradeAttempt);
router.delete('/:examId', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.deleteExam);
router.delete('/:id', authenticate, authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'), examController.deleteExam);
router.post(
  '/:examId/sections',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  examController.saveSections
);
router.post(
  '/:id/sections',
  authenticate,
  authorize('ADMIN', 'CONTENT_EDITOR', 'TEACHER'),
  examController.saveSections
);

export const examRoutes = router;
