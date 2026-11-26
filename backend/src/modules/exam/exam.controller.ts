import { Request, Response, NextFunction } from 'express';
import { examService } from './exam.service';
import { AppError } from '../../shared/errors/app-error';

export class ExamController {
  /**
   * GET /api/v1/exams
   * Lấy danh sách đề thi (Học viên & Giáo viên)
   */
  listExams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const level = (req.query.level || req.query.hsk_level) as string | undefined;
      const status = req.query.status as string | undefined;
      const userId = req.user?.userId;
      const isAdmin =
        req.user?.role === 'ADMIN' ||
        req.user?.role === 'CONTENT_EDITOR' ||
        (req.user?.role as string) === 'TEACHER';

      const data = await examService.listExams({
        hsk_level: level,
        status,
        userId,
        isAdmin,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/exams/admin/all
   * Lấy toàn bộ đề thi bao gồm cả DRAFT (Giáo viên / Admin)
   */
  listAdminExams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const level = (req.query.level || req.query.hsk_level) as string | undefined;
      const data = await examService.listExams({
        hsk_level: level,
        isAdmin: true,
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/exams/:id
   * Xem chi tiết đề thi và phiếu câu hỏi
   */
  getExamById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(id)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const userId = req.user?.userId;
      const isAdmin =
        req.user?.role === 'ADMIN' ||
        req.user?.role === 'CONTENT_EDITOR' ||
        (req.user?.role as string) === 'TEACHER';

      const data = await examService.getExamById(id, userId, isAdmin);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/exams/:examId/take
   * Lấy đề thi cho học viên làm bài (Tuyệt đối che giấu đáp án đúng và file PDF đáp án)
   */
  getExamForTaking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const examId = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(examId)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const userId = req.user?.userId;
      const data = await examService.getExamForTaking(examId, userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/exams
   * Tạo đề thi mới (Giáo viên / Admin)
   */
  createExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Vui lòng đăng nhập.');
      }

      const {
        code,
        title,
        description,
        hsk_level,
        exam_pdf_url,
        audio_url,
        answer_pdf_url,
        duration_minutes,
        total_score,
        pass_score,
        status,
        sections,
      } = req.body;

      if (!code || !title || !hsk_level || !exam_pdf_url) {
        throw AppError.badRequest('Thiếu thông tin bắt buộc: code, title, hsk_level, exam_pdf_url.');
      }

      const data = await examService.createExam(
        {
          code,
          title,
          description,
          hsk_level,
          exam_pdf_url,
          audio_url,
          answer_pdf_url,
          duration_minutes: duration_minutes ? Number(duration_minutes) : undefined,
          total_score: total_score ? Number(total_score) : undefined,
          pass_score: pass_score ? Number(pass_score) : undefined,
          status,
          sections,
        },
        userId
      );

      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/exams/:id hoặc /api/exams/:examId
   * Cập nhật thông tin đề thi (Giáo viên / Admin)
   */
  updateExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(id)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Vui lòng đăng nhập.');
      }

      const data = await examService.updateExam(id, req.body, userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/exams/:examId/publish
   * Chuyển trạng thái DRAFT <-> PUBLISHED (Giáo viên / Admin)
   */
  publishExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const examId = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(examId)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const status = req.body?.status;
      const result = await examService.publishExam(examId, status);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/exams/:id/sections
   * Lưu nhanh cấu trúc Phần thi & Câu hỏi kèm thang điểm (Giáo viên / Admin)
   */
  saveSections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(id)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Vui lòng đăng nhập.');
      }

      const { sections } = req.body;
      if (!Array.isArray(sections)) {
        throw AppError.badRequest('sections phải là một mảng.');
      }

      const data = await examService.saveExamStructure(id, sections, userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/exams/:id hoặc /api/exams/:examId
   * Xóa đề thi (Giáo viên / Admin)
   */
  deleteExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(id)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const result = await examService.deleteExam(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/exams/upload
   * Upload file đề PDF, audio MP3, hoặc đáp án PDF (Giáo viên / Admin)
   */
  uploadFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;

      const result: Record<string, string> = {};

      if (Array.isArray(files)) {
        for (const file of files) {
          result[file.fieldname] = `/uploads/exams/${file.filename}`;
        }
      } else if (files && typeof files === 'object') {
        for (const [key, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            result[key] = `/uploads/exams/${fileArray[0].filename}`;
          }
        }
      }

      // Single file fallback
      if (req.file) {
        result['file'] = `/uploads/exams/${req.file.filename}`;
      }

      res.json({
        success: true,
        message: 'Upload file thành công',
        urls: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/exams/:id/submit hoặc /api/exams/:examId/submit
   * Nộp bài thi thử & nhận kết quả chấm tự động
   */
  submitExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const examId = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(examId)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Vui lòng đăng nhập để nộp bài.');
      }

      const answers = req.body?.answers !== undefined ? req.body.answers : req.body;
      if (!Array.isArray(answers)) {
        throw AppError.badRequest('answers phải là một danh sách câu trả lời.');
      }

      const result = await examService.submitExam(examId, userId, { answers });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/exams/attempts/:attemptId/grade
   * Cho phép giáo viên chấm hoặc điều chỉnh điểm các câu hỏi (WRITING_ESSAY, v.v.)
   */
  gradeAttempt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attemptId = parseInt(req.params.attemptId || req.params.id, 10);
      if (isNaN(attemptId)) {
        throw AppError.badRequest('ID bài làm không hợp lệ.');
      }

      const grades = Array.isArray(req.body) ? req.body : req.body?.grades;
      if (!Array.isArray(grades)) {
        throw AppError.badRequest('grades phải là một mảng danh sách điểm câu hỏi.');
      }

      const result = await examService.gradeAttempt(attemptId, grades);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/exams/attempts/:attemptId
   * Xem kết quả bài làm chi tiết
   */
  getAttemptDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attemptId = parseInt(req.params.attemptId || req.params.id, 10);
      if (isNaN(attemptId)) {
        throw AppError.badRequest('ID bài làm không hợp lệ.');
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Vui lòng đăng nhập.');
      }

      const isAdmin =
        req.user?.role === 'ADMIN' ||
        req.user?.role === 'CONTENT_EDITOR' ||
        (req.user?.role as string) === 'TEACHER';

      const data = await examService.getAttemptDetails(attemptId, userId, isAdmin);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/exams/:id/my-attempts
   * Xem lịch sử các lần làm đề của bản thân
   */
  getUserAttempts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const examId = parseInt(req.params.examId || req.params.id, 10);
      if (isNaN(examId)) {
        throw AppError.badRequest('ID đề thi không hợp lệ.');
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Vui lòng đăng nhập.');
      }

      const data = await examService.getUserAttempts(examId, userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}

export const examController = new ExamController();
