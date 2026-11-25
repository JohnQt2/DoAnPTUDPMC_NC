import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { examService } from './exam.service';
import { examParserService } from './exam-parser.service';
import { AppError } from '../../shared/errors/app-error';
import { UploadedFileMetadata } from './exam.dto';

function decodeOriginalName(rawName: string): string {
  try {
    const decoded = Buffer.from(rawName, 'latin1').toString('utf8');
    if (!decoded.includes('') && decoded !== rawName) {
      return decoded;
    }
  } catch {
    // fallback
  }
  return rawName;
}

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
      const isAdminRole =
        req.user?.role === 'ADMIN' ||
        req.user?.role === 'CONTENT_EDITOR' ||
        (req.user?.role as string) === 'TEACHER';

      // GET /api/exams mặc định chỉ trả về đề PUBLISHED cho học viên, chỉ trả về DRAFT nếu truyền cờ manage=true
      const includeManage = isAdminRole && (req.query.manage === 'true' || req.query.includeDrafts === 'true');

      const data = await examService.listExams({
        hsk_level: level,
        status,
        userId,
        isAdmin: includeManage,
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
   * Chuẩn hóa tên file an toàn và trả về metadata đầy đủ
   */
  uploadFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;

      const result: Record<string, string> = {};
      const filesMeta: Record<string, UploadedFileMetadata> = {};

      const processFile = (fieldName: string, file: Express.Multer.File) => {
        const url = `/uploads/exams/${file.filename}`;
        const decodedOriginal = decodeOriginalName(file.originalname);
        result[fieldName] = url;

        // Alias snake_case <-> camelCase
        if (fieldName === 'examPdf') result['exam_pdf'] = url;
        if (fieldName === 'exam_pdf') result['examPdf'] = url;
        if (fieldName === 'answerPdf') result['answer_pdf'] = url;
        if (fieldName === 'answer_pdf') result['answerPdf'] = url;
        if (fieldName === 'transcriptPdf') result['transcript_pdf'] = url;
        if (fieldName === 'transcript_pdf') result['transcriptPdf'] = url;

        filesMeta[fieldName] = {
          url,
          filename: file.filename,
          originalName: decodedOriginal,
          size: file.size,
          mimetype: file.mimetype,
        };
      };

      if (Array.isArray(files)) {
        for (const file of files) {
          processFile(file.fieldname, file);
        }
      } else if (files && typeof files === 'object') {
        for (const [key, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            processFile(key, fileArray[0]);
          }
        }
      }

      // Single file fallback
      if (req.file) {
        processFile(req.file.fieldname || 'file', req.file);
      }

      res.json({
        success: true,
        message: 'Upload file thành công',
        urls: result,
        files: filesMeta,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/exams/upload
   * Xóa file đã tải lên trong thư mục uploads/exams (Giáo viên / Admin)
   * Kiểm tra an toàn đường dẫn, chống path traversal
   */
  deleteUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileUrl = req.body?.fileUrl || req.body?.url || (req.query?.fileUrl as string);
      if (!fileUrl || typeof fileUrl !== 'string') {
        throw AppError.badRequest('Vui lòng cung cấp fileUrl cần xóa.');
      }

      // Chuẩn hóa tên file, chống path traversal
      const fileName = path.basename(fileUrl.trim());
      if (!fileName || fileName === '.' || fileName === '..') {
        throw AppError.badRequest('Tên file không hợp lệ.');
      }

      const uploadsDir = path.resolve(process.cwd(), 'uploads', 'exams');
      const targetPath = path.resolve(uploadsDir, fileName);

      // Đảm bảo targetPath nằm chặt trong uploadsDir
      if (!targetPath.startsWith(uploadsDir)) {
        throw AppError.forbidden('Đường dẫn file không hợp lệ.');
      }

      // Xóa file vật lý nếu tồn tại
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }

      res.json({
        success: true,
        message: `Đã xóa file ${fileName} thành công.`,
        deletedFile: fileName,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/exams/upload-batch
   * Nhận nhiều file cùng lúc (upload.any() hoặc array('files', 10))
   * Tự động phân loại vai trò (examPdf, answerPdf, transcriptPdf, audio), decode tên tiếng Trung/Việt
   */
  uploadBatchFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let rawFiles: Express.Multer.File[] = [];
      if (Array.isArray(req.files)) {
        rawFiles = req.files;
      } else if (req.files && typeof req.files === 'object') {
        for (const fileList of Object.values(req.files)) {
          if (Array.isArray(fileList)) rawFiles.push(...fileList);
        }
      } else if (req.file) {
        rawFiles = [req.file];
      }

      if (rawFiles.length === 0) {
        throw AppError.badRequest('Vui lòng chọn ít nhất 1 file để tải lên.');
      }

      const decodedFiles = rawFiles.map((file) => {
        const decodedOriginal = decodeOriginalName(file.originalname);
        const ext = path.extname(decodedOriginal).toLowerCase();
        return {
          file,
          decodedOriginal,
          ext,
          url: `/uploads/exams/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
        };
      });

      // Phân loại từ khóa
      const isAnswerPdf = (name: string) => /答案|dap[\s\-_]?an|answer|key/i.test(name);
      const isTranscriptPdf = (name: string) => /听力材料|transcript|script|tai[\s\-_]?lieu/i.test(name);

      const pdfFiles = decodedFiles.filter((f) => f.ext === '.pdf');

      // Tạm gán vai trò cho PDF dựa vào từ khóa
      const categorizedPdfs = pdfFiles.map((f) => {
        let role: 'examPdf' | 'answerPdf' | 'transcriptPdf' = 'examPdf';
        let hasKeyword = false;
        if (isAnswerPdf(f.decodedOriginal)) {
          role = 'answerPdf';
          hasKeyword = true;
        } else if (isTranscriptPdf(f.decodedOriginal)) {
          role = 'transcriptPdf';
          hasKeyword = true;
        }
        return { ...f, role, hasKeyword };
      });

      // Nếu có các file PDF không chứa từ khóa nhận diện
      const unassignedPdfs = categorizedPdfs.filter((f) => !f.hasKeyword);
      if (unassignedPdfs.length === 2) {
        // File đầu tiên (hoặc dung lượng lớn hơn) là Đề thi, file thứ hai là Đáp án
        unassignedPdfs.sort((a, b) => b.size - a.size);
        unassignedPdfs[0].role = 'examPdf';
        unassignedPdfs[1].role = 'answerPdf';
      } else if (unassignedPdfs.length > 0) {
        unassignedPdfs[0].role = 'examPdf';
      }

      const results = decodedFiles.map((df) => {
        let role: 'examPdf' | 'answerPdf' | 'transcriptPdf' | 'audio' = 'examPdf';
        if (['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'].includes(df.ext)) {
          role = 'audio';
        } else {
          const matched = categorizedPdfs.find((cp) => cp.file.filename === df.file.filename);
          if (matched) role = matched.role;
        }

        return {
          role,
          url: df.url,
          filename: df.file.filename,
          originalName: df.decodedOriginal,
          size: df.size,
          mimetype: df.mimetype,
        };
      });

      const urls: Record<string, string> = {};
      const filesMeta: Record<string, any> = {};

      for (const item of results) {
        urls[item.role] = item.url;
        filesMeta[item.role] = item;
      }

      res.json({
        success: true,
        message: `Tải lên và tự động phân loại ${results.length} file thành công.`,
        data: results,
        files: filesMeta,
        urls,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/exams/parse-files
   * Bóc tách tự động cấu trúc đề thi, phân chia phần và danh sách câu hỏi từ bộ file upload
   */
  parseExamFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
      const filesMeta: Record<string, UploadedFileMetadata> = {};

      let answerPdfPath: string | undefined;
      let examPdfPath: string | undefined;
      let transcriptPdfPath: string | undefined;
      let audioPath: string | undefined;

      const registerFile = (field: string, file: Express.Multer.File) => {
        const decodedOriginal = decodeOriginalName(file.originalname);
        const url = `/uploads/exams/${file.filename}`;
        filesMeta[field] = {
          url,
          filename: file.filename,
          originalName: decodedOriginal,
          size: file.size,
          mimetype: file.mimetype,
        };

        if (['answerPdf', 'answer_pdf'].includes(field)) {
          answerPdfPath = file.path;
        } else if (['examPdf', 'exam_pdf'].includes(field)) {
          examPdfPath = file.path;
        } else if (['transcriptPdf', 'transcript_pdf'].includes(field)) {
          transcriptPdfPath = file.path;
        } else if (['audio'].includes(field)) {
          audioPath = file.path;
        }
      };

      if (Array.isArray(files)) {
        for (const f of files) {
          registerFile(f.fieldname, f);
        }
      } else if (files && typeof files === 'object') {
        for (const [key, arr] of Object.entries(files)) {
          if (arr && arr.length > 0) {
            registerFile(key, arr[0]);
          }
        }
      }

      if (req.file) {
        registerFile(req.file.fieldname || 'file', req.file);
      }

      // Hỗ trợ trường hợp truyền URL đã upload sẵn từ trước trong req.body
      const resolveDiskPath = (url?: string): string | undefined => {
        if (!url) return undefined;
        const clean = url.replace(/^\/?uploads\/exams\//, '');
        return path.join(process.cwd(), 'uploads', 'exams', clean);
      };

      if (!answerPdfPath && (req.body.answer_pdf_url || req.body.answerPdfUrl)) {
        answerPdfPath = resolveDiskPath(req.body.answer_pdf_url || req.body.answerPdfUrl);
      }
      if (!examPdfPath && (req.body.exam_pdf_url || req.body.examPdfUrl)) {
        examPdfPath = resolveDiskPath(req.body.exam_pdf_url || req.body.examPdfUrl);
      }
      if (!transcriptPdfPath && (req.body.transcript_pdf_url || req.body.transcriptPdfUrl)) {
        transcriptPdfPath = resolveDiskPath(req.body.transcript_pdf_url || req.body.transcriptPdfUrl);
      }
      if (!audioPath && req.body.audio_url) {
        audioPath = resolveDiskPath(req.body.audio_url);
      }

      const userHskLevel = req.body.hsk_level || req.body.hskLevel;

      const parsedExam = await examParserService.parseExamFiles({
        answerPdfPath,
        examPdfPath,
        transcriptPdfPath,
        audioPath,
        userHskLevel,
        filesMetadata: filesMeta,
      });

      res.json({
        success: true,
        message: `Phân tích đề thi thành công: Bóc tách được ${parsedExam.metadata.detectedQuestionsCount} câu hỏi`,
        data: parsedExam,
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
