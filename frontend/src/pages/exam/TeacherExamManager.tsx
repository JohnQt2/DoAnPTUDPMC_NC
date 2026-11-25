import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, resolveMediaUrl } from '../../lib/api';
import {
  StudentExamSplitScreen,
  ExamDetail,
  SectionItem,
  QuestionItem,
} from './StudentExamSplitScreen';
import {
  FileText,
  Headphones,
  Upload,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Layers,
  Eye,
  RefreshCw,
  Play,
  PlayCircle,
  Pause,
  Send,
  ExternalLink,
  X,
  Volume2,
  FileCheck,
  Loader2,
  Pencil,
  UploadCloud,
} from 'lucide-react';

export type QuestionType =
  | 'TRUE_FALSE'
  | 'MCQ_ABC'
  | 'MCQ_ABCD'
  | 'MCQ_ABCDEF'
  | 'WRITING_FILL'
  | 'WRITING_ESSAY';

interface QuestionConfig {
  id?: number;
  question_number: number;
  question_type: QuestionType;
  prompt_text?: string;
  options?: string[];
  correct_answer?: string;
  sample_answer?: string;
  points: number;
  explanation?: string;
  needsReview?: boolean;
  reviewReason?: string;
}

interface SectionConfig {
  id?: number;
  section_type: 'LISTENING' | 'READING' | 'WRITING';
  title: string;
  instructions?: string;
  audio_url?: string;
  questions: QuestionConfig[];
}

export const TeacherExamManager: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hskLevel, setHskLevel] = useState<string>('HSK1');
  const [durationMinutes, setDurationMinutes] = useState<number>(35);
  const [passScore, setPassScore] = useState<number>(60);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

  // File URLs (URLs đã lưu trên server)
  const [examPdfUrl, setExamPdfUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [answerPdfUrl, setAnswerPdfUrl] = useState('');
  const [transcriptPdfUrl, setTranscriptPdfUrl] = useState('');

  // Unified File Selection State (File mới chọn từ máy tính)
  const [examPdfFile, setExamPdfFile] = useState<File | null>(null);
  const [answerPdfFile, setAnswerPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptPdfFile, setTranscriptPdfFile] = useState<File | null>(null);
  const [audioPreviewBlobUrl, setAudioPreviewBlobUrl] = useState<string | null>(null);

  // File Names State (Tên file gốc hiển thị đẹp, chuẩn tiếng Việt/Trung)
  const [examPdfName, setExamPdfName] = useState<string>('');
  const [answerPdfName, setAnswerPdfName] = useState<string>('');
  const [audioName, setAudioName] = useState<string>('');
  const [transcriptPdfName, setTranscriptPdfName] = useState<string>('');

  // File Sizes State (Dung lượng byte)
  const [examPdfSize, setExamPdfSize] = useState<number>(0);
  const [answerPdfSize, setAnswerPdfSize] = useState<number>(0);
  const [audioSize, setAudioSize] = useState<number>(0);
  const [transcriptPdfSize, setTranscriptPdfSize] = useState<number>(0);

  // Multi-File Dropzone & Batch Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);

  // File Input Refs để reset inputRef.current.value = "" khi bấm xóa (cho phép chọn lại chính file đó)
  const examPdfInputRef = useRef<HTMLInputElement | null>(null);
  const answerPdfInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const transcriptPdfInputRef = useRef<HTMLInputElement | null>(null);

  // Ẩn danh sách file tạm khỏi khu vực Upload sau khi Lưu nháp thành công (vẫn giữ URL đã lưu cho Xem Demo / Xuất bản)
  const [clearedFromUploadBox, setClearedFromUploadBox] = useState<Partial<Record<FileRole, boolean>>>({});

  const clearUploadStagingFiles = () => {
    setExamPdfFile(null);
    setAnswerPdfFile(null);
    setAudioFile(null);
    setTranscriptPdfFile(null);
    setAudioPreviewBlobUrl(null);
    setExamPdfSize(0);
    setAnswerPdfSize(0);
    setAudioSize(0);
    setTranscriptPdfSize(0);
    if (examPdfInputRef.current) examPdfInputRef.current.value = '';
    if (answerPdfInputRef.current) answerPdfInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (transcriptPdfInputRef.current) transcriptPdfInputRef.current.value = '';
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
  };

  const [parsingFiles, setParsingFiles] = useState(false);
  const [parsedReviewNotice, setParsedReviewNotice] = useState<{ count: number } | null>(null);

  // Preview modal state
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');

  // Delete Exam confirmation modal state
  const [examToDelete, setExamToDelete] = useState<{ id: number; code: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audio test player in teacher view
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewAudioPlaying, setIsPreviewAudioPlaying] = useState(false);

  // Sections State
  const [sections, setSections] = useState<SectionConfig[]>([
    {
      section_type: 'LISTENING',
      title: 'Phần 1: Nghe hiểu (听力)',
      instructions: 'Thí sinh nghe đoạn âm thanh và làm theo hướng dẫn trong đề PDF.',
      questions: [],
    },
    {
      section_type: 'READING',
      title: 'Phần 2: Đọc hiểu (阅读)',
      instructions: 'Thí sinh đọc đề thi PDF và điền đáp án tương ứng.',
      questions: [],
    },
  ]);

  const [activeSectionTab, setActiveSectionTab] = useState<number>(0);
  const teacherQuestionsListRef = useRef<HTMLDivElement | null>(null);
  const handleSwitchTeacherSection = (newIdx: number) => {
    setActiveSectionTab(newIdx);
    requestAnimationFrame(() => {
      if (teacherQuestionsListRef.current) {
        teacherQuestionsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(
    null
  );

  // Demo Preview & Quick Publish State
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isDemoFromForm, setIsDemoFromForm] = useState(true);
  const [tableDemoExamData, setTableDemoExamData] = useState<ExamDetail | null>(null);
  const [demoExamStatus, setDemoExamStatus] = useState<'DRAFT' | 'PUBLISHED' | null>(null);
  const [demoBlobUrls, setDemoBlobUrls] = useState<{ examPdf?: string; answerPdf?: string }>({});
  const [publishingExamId, setPublishingExamId] = useState<number | null>(null);
  const [demoNotice, setDemoNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const examListRef = useRef<HTMLDivElement | null>(null);

  const showDemoNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setDemoNotice({ text, type });
    window.setTimeout(() => {
      setDemoNotice((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  const fetchExams = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get<any[]>('/exams/manage');
      setExams(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách đề thi:', err);
      if (!silent) {
        setMessage({ text: err.message || 'Không thể tải danh sách đề thi.', type: 'error' });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Khóa thanh cuộn trang nền khi mở Màn hình Xem Demo
  useEffect(() => {
    if (isDemoOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDemoOpen]);

  // Audio Play/Pause helper
  const togglePlayAudioPreview = () => {
    const audio = audioPreviewRef.current;
    if (!audio) return;
    if (isPreviewAudioPlaying) {
      audio.pause();
      setIsPreviewAudioPlaying(false);
    } else {
      audio.play().then(() => setIsPreviewAudioPlaying(true)).catch(console.error);
    }
  };

  // Tính tổng điểm từng phần và toàn bộ đề thi
  const sectionScores = sections.map((sec) =>
    sec.questions.reduce((sum, q) => sum + Number(q.points || 0), 0)
  );

  const totalCalculatedScore = sectionScores.reduce((sum, s) => sum + s, 0);
  const totalQuestionsCount = sections.reduce((sum, sec) => sum + sec.questions.length, 0);

  // Helper chuẩn hóa tên file từ URL (hỗ trợ decode ký tự tiếng Trung/Việt)
  const extractFileNameFromUrl = (url?: string | null, fallback?: string): string => {
    if (!url) return '';
    try {
      const raw = decodeURIComponent(url.split('/').pop() || '');
      if (/^\d+-[0-9a-fA-F-]+\.\w+$/.test(raw) && fallback) {
        return fallback;
      }
      return raw || fallback || 'file';
    } catch {
      return url.split('/').pop() || fallback || 'file';
    }
  };

  // Helper format dung lượng file
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  type FileRole = 'examPdf' | 'answerPdf' | 'transcriptPdf' | 'audio';

  // ── TỰ ĐỘNG PHÂN LOẠI VAI TRÒ TỪNG FILE DỰA VÀO ĐỊNH DẠNG & TỪ KHÓA ──────────
  const autoClassifyFiles = (files: File[]): Record<FileRole, File | undefined> => {
    const result: Partial<Record<FileRole, File>> = {};

    const isAnswerPdf = (name: string) => /答案|dap[\s\-_]?an|answer|key/i.test(name);
    const isTranscriptPdf = (name: string) => /听力材料|transcript|script|tai[\s\-_]?lieu/i.test(name);

    const audioExts = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];
    const audioList: File[] = [];
    const pdfList: File[] = [];

    for (const f of files) {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      if (audioExts.includes(ext)) {
        audioList.push(f);
      } else if (ext === '.pdf') {
        pdfList.push(f);
      }
    }

    // 1. File âm thanh -> File nghe Audio
    if (audioList.length > 0) {
      result.audio = audioList[0];
    }

    // 2. File PDF theo từ khóa nhận diện
    const unassignedPdfs: File[] = [];
    for (const f of pdfList) {
      if (isAnswerPdf(f.name) && !result.answerPdf) {
        result.answerPdf = f;
      } else if (isTranscriptPdf(f.name) && !result.transcriptPdf) {
        result.transcriptPdf = f;
      } else {
        unassignedPdfs.push(f);
      }
    }

    // 3. Xử lý các file PDF còn lại không chứa từ khóa:
    // Nếu có đúng 2 file PDF không từ khóa: file đầu tiên (hoặc dung lượng lớn hơn) gán vào Đề thi, file thứ hai gán vào Đáp án
    if (unassignedPdfs.length === 2 && !result.examPdf && !result.answerPdf) {
      unassignedPdfs.sort((a, b) => b.size - a.size);
      result.examPdf = unassignedPdfs[0];
      result.answerPdf = unassignedPdfs[1];
    } else {
      for (const f of unassignedPdfs) {
        if (!result.examPdf) {
          result.examPdf = f;
        } else if (!result.answerPdf) {
          result.answerPdf = f;
        } else if (!result.transcriptPdf) {
          result.transcriptPdf = f;
        }
      }
    }

    return result as Record<FileRole, File | undefined>;
  };

  // ── XỬ LÝ CHỌN HOẶC KÉO THẢ NHIỀU FILE CÙNG LÚC (BATCH UPLOAD) ────────────
  const handleBatchFilesSelect = async (filesToProcess: FileList | File[]) => {
    const filesArray = Array.from(filesToProcess);
    if (filesArray.length === 0) return;

    const classified = autoClassifyFiles(filesArray);

    // Cập nhật state cục bộ ngay lập tức để UI hiển thị tức thì
    setClearedFromUploadBox((prev) => ({
      ...prev,
      ...(classified.examPdf ? { examPdf: false } : {}),
      ...(classified.answerPdf ? { answerPdf: false } : {}),
      ...(classified.audio ? { audio: false } : {}),
      ...(classified.transcriptPdf ? { transcriptPdf: false } : {}),
    }));
    if (classified.examPdf) {
      setExamPdfFile(classified.examPdf);
      setExamPdfName(classified.examPdf.name);
      setExamPdfSize(classified.examPdf.size);
    }
    if (classified.answerPdf) {
      setAnswerPdfFile(classified.answerPdf);
      setAnswerPdfName(classified.answerPdf.name);
      setAnswerPdfSize(classified.answerPdf.size);
    }
    if (classified.audio) {
      setAudioFile(classified.audio);
      setAudioName(classified.audio.name);
      setAudioSize(classified.audio.size);
      setAudioPreviewBlobUrl(URL.createObjectURL(classified.audio));
    }
    if (classified.transcriptPdf) {
      setTranscriptPdfFile(classified.transcriptPdf);
      setTranscriptPdfName(classified.transcriptPdf.name);
      setTranscriptPdfSize(classified.transcriptPdf.size);
    }

    // Tải lên hàng loạt lên server qua API POST /api/exams/upload-batch
    try {
      setIsUploadingBatch(true);
      const formData = new FormData();
      filesArray.forEach((f) => formData.append('files', f));

      const res = await api.upload<any>('/exams/upload-batch', formData);
      if (res?.data && Array.isArray(res.data)) {
        for (const item of res.data) {
          if (item.role === 'examPdf') {
            setExamPdfUrl(item.url);
            setExamPdfName(item.originalName);
            setExamPdfSize(item.size);
          } else if (item.role === 'answerPdf') {
            setAnswerPdfUrl(item.url);
            setAnswerPdfName(item.originalName);
            setAnswerPdfSize(item.size);
          } else if (item.role === 'audio') {
            setAudioUrl(item.url);
            setAudioName(item.originalName);
            setAudioSize(item.size);
          } else if (item.role === 'transcriptPdf') {
            setTranscriptPdfUrl(item.url);
            setTranscriptPdfName(item.originalName);
            setTranscriptPdfSize(item.size);
          }
        }
        setMessage({
          text: `Đã tải lên và tự động phân loại ${res.data.length} file thành công! Bấm "Tự động bóc tách bảng đáp án" để trích xuất đề thi.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi tải file hàng loạt:', err);
      setMessage({
        text: err.response?.data?.message || err.message || 'Lỗi khi tải file hàng loạt.',
        type: 'warning',
      });
    } finally {
      setIsUploadingBatch(false);
      if (batchFileInputRef.current) {
        batchFileInputRef.current.value = '';
      }
    }
  };

  // ── ĐỔI PHÂN LOẠI FILE (REASSIGN ROLE) TRONG 1 CLICK ───────────────────────
  const handleReassignRole = (sourceRole: FileRole, targetRole: FileRole) => {
    if (sourceRole === targetRole) return;

    const sourceData = {
      file: sourceRole === 'examPdf' ? examPdfFile : sourceRole === 'answerPdf' ? answerPdfFile : sourceRole === 'audio' ? audioFile : transcriptPdfFile,
      url: sourceRole === 'examPdf' ? examPdfUrl : sourceRole === 'answerPdf' ? answerPdfUrl : sourceRole === 'audio' ? audioUrl : transcriptPdfUrl,
      name: sourceRole === 'examPdf' ? examPdfName : sourceRole === 'answerPdf' ? answerPdfName : sourceRole === 'audio' ? audioName : transcriptPdfName,
      size: sourceRole === 'examPdf' ? examPdfSize : sourceRole === 'answerPdf' ? answerPdfSize : sourceRole === 'audio' ? audioSize : transcriptPdfSize,
      blobUrl: sourceRole === 'audio' ? audioPreviewBlobUrl : null,
    };

    const targetData = {
      file: targetRole === 'examPdf' ? examPdfFile : targetRole === 'answerPdf' ? answerPdfFile : targetRole === 'audio' ? audioFile : transcriptPdfFile,
      url: targetRole === 'examPdf' ? examPdfUrl : targetRole === 'answerPdf' ? answerPdfUrl : targetRole === 'audio' ? audioUrl : transcriptPdfUrl,
      name: targetRole === 'examPdf' ? examPdfName : targetRole === 'answerPdf' ? answerPdfName : targetRole === 'audio' ? audioName : transcriptPdfName,
      size: targetRole === 'examPdf' ? examPdfSize : targetRole === 'answerPdf' ? answerPdfSize : targetRole === 'audio' ? audioSize : transcriptPdfSize,
      blobUrl: targetRole === 'audio' ? audioPreviewBlobUrl : null,
    };

    const applyDataToRole = (role: FileRole, d: typeof sourceData) => {
      if (role === 'examPdf') {
        setExamPdfFile(d.file);
        setExamPdfUrl(d.url || '');
        setExamPdfName(d.name || '');
        setExamPdfSize(d.size || 0);
      } else if (role === 'answerPdf') {
        setAnswerPdfFile(d.file);
        setAnswerPdfUrl(d.url || '');
        setAnswerPdfName(d.name || '');
        setAnswerPdfSize(d.size || 0);
      } else if (role === 'audio') {
        setAudioFile(d.file);
        setAudioUrl(d.url || '');
        setAudioName(d.name || '');
        setAudioSize(d.size || 0);
        setAudioPreviewBlobUrl(d.blobUrl);
      } else if (role === 'transcriptPdf') {
        setTranscriptPdfFile(d.file);
        setTranscriptPdfUrl(d.url || '');
        setTranscriptPdfName(d.name || '');
        setTranscriptPdfSize(d.size || 0);
      }
    };

    applyDataToRole(targetRole, sourceData);
    applyDataToRole(sourceRole, targetData);

    setMessage({
      text: `Đã đổi phân loại file "${sourceData.name || sourceData.url}" thành công.`,
      type: 'success',
    });
  };

  // ── XỬ LÝ XÓA TỪNG FILE ĐỘC LẬP & RESET INPUT REF ─────────────────────────
  const handleRemoveExamPdf = async () => {
    const urlToDelete = examPdfUrl;
    setExamPdfFile(null);
    setExamPdfUrl('');
    setExamPdfName('');
    setExamPdfSize(0);
    if (examPdfInputRef.current) {
      examPdfInputRef.current.value = '';
    }
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
    if (urlToDelete && urlToDelete.startsWith('/uploads/exams/') && !editingExamId) {
      try {
        await api.delete('/exams/upload', {
          body: JSON.stringify({ fileUrl: urlToDelete }),
          params: { fileUrl: urlToDelete },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleRemoveAnswerPdf = async () => {
    const urlToDelete = answerPdfUrl;
    setAnswerPdfFile(null);
    setAnswerPdfUrl('');
    setAnswerPdfName('');
    setAnswerPdfSize(0);
    if (answerPdfInputRef.current) {
      answerPdfInputRef.current.value = '';
    }
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
    if (urlToDelete && urlToDelete.startsWith('/uploads/exams/') && !editingExamId) {
      try {
        await api.delete('/exams/upload', {
          body: JSON.stringify({ fileUrl: urlToDelete }),
          params: { fileUrl: urlToDelete },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleRemoveAudio = async () => {
    const urlToDelete = audioUrl;
    setAudioFile(null);
    setAudioUrl('');
    setAudioName('');
    setAudioSize(0);
    if (audioPreviewBlobUrl) {
      URL.revokeObjectURL(audioPreviewBlobUrl);
      setAudioPreviewBlobUrl(null);
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPreviewAudioPlaying(false);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
    if (urlToDelete && urlToDelete.startsWith('/uploads/exams/') && !editingExamId) {
      try {
        await api.delete('/exams/upload', {
          body: JSON.stringify({ fileUrl: urlToDelete }),
          params: { fileUrl: urlToDelete },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleRemoveTranscriptPdf = async () => {
    const urlToDelete = transcriptPdfUrl;
    setTranscriptPdfFile(null);
    setTranscriptPdfUrl('');
    setTranscriptPdfName('');
    setTranscriptPdfSize(0);
    if (transcriptPdfInputRef.current) {
      transcriptPdfInputRef.current.value = '';
    }
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
    if (urlToDelete && urlToDelete.startsWith('/uploads/exams/') && !editingExamId) {
      try {
        await api.delete('/exams/upload', {
          body: JSON.stringify({ fileUrl: urlToDelete }),
          params: { fileUrl: urlToDelete },
        });
      } catch {
        // ignore
      }
    }
  };

  // ── LUỒNG TẠO ĐỀ: TỰ ĐỘNG BÓC TÁCH TỪ BỘ FILE HSK ĐÃ CHỌN ────────────────
  const handleAutoParseFiles = async () => {
    const hasAnswer = Boolean(answerPdfFile || answerPdfUrl.trim());
    const hasExam = Boolean(examPdfFile || examPdfUrl.trim());

    if (!hasAnswer && !hasExam) {
      setMessage({
        text: 'Vui lòng chọn File Đáp Án PDF (hoặc File Đề PDF) để hệ thống tự động bóc tách.',
        type: 'error',
      });
      return;
    }

    try {
      setParsingFiles(true);
      setMessage(null);
      setParsedReviewNotice(null);

      const formData = new FormData();
      if (examPdfFile) {
        formData.append('examPdf', examPdfFile);
      } else if (examPdfUrl.trim()) {
        formData.append('exam_pdf_url', examPdfUrl.trim());
      }

      if (answerPdfFile) {
        formData.append('answerPdf', answerPdfFile);
      } else if (answerPdfUrl.trim()) {
        formData.append('answer_pdf_url', answerPdfUrl.trim());
      }

      if (audioFile) {
        formData.append('audio', audioFile);
      } else if (audioUrl.trim()) {
        formData.append('audio_url', audioUrl.trim());
      }

      if (transcriptPdfFile) {
        formData.append('transcriptPdf', transcriptPdfFile);
      } else if (transcriptPdfUrl.trim()) {
        formData.append('transcript_pdf_url', transcriptPdfUrl.trim());
      }

      formData.append('hskLevel', hskLevel);

      const res = await api.upload<any>('/exams/parse-files', formData);
      const parsedData = res?.data || res;

      if (!parsedData || !parsedData.sections) {
        throw new Error('Không nhận được cấu trúc đề thi từ bộ phân tích.');
      }

      // Tự động điền thông tin đề thi vào form (tuyệt đối không tự lưu xuống DB)
      if (parsedData.code) setCode(parsedData.code);
      if (parsedData.title) setTitle(parsedData.title);
      if (parsedData.description) setDescription(parsedData.description);
      if (parsedData.hsk_level) setHskLevel(parsedData.hsk_level);
      if (parsedData.duration_minutes) setDurationMinutes(parsedData.duration_minutes);
      if (parsedData.pass_score) setPassScore(parsedData.pass_score);

      // Điền URL các file vừa upload lên server
      if (parsedData.exam_pdf_url) setExamPdfUrl(parsedData.exam_pdf_url);
      if (parsedData.answer_pdf_url) setAnswerPdfUrl(parsedData.answer_pdf_url);
      if (parsedData.audio_url) setAudioUrl(parsedData.audio_url);
      if (parsedData.transcript_pdf_url) setTranscriptPdfUrl(parsedData.transcript_pdf_url);

      // Lưu trữ tên file gốc (originalName) hiển thị đẹp
      if (parsedData.metadata?.files) {
        const fMeta = parsedData.metadata.files;
        if (fMeta.examPdf?.originalName || fMeta.exam_pdf?.originalName) {
          setExamPdfName(fMeta.examPdf?.originalName || fMeta.exam_pdf?.originalName);
        }
        if (fMeta.answerPdf?.originalName || fMeta.answer_pdf?.originalName) {
          setAnswerPdfName(fMeta.answerPdf?.originalName || fMeta.answer_pdf?.originalName);
        }
        if (fMeta.audio?.originalName) {
          setAudioName(fMeta.audio.originalName);
        }
        if (fMeta.transcriptPdf?.originalName || fMeta.transcript_pdf?.originalName) {
          setTranscriptPdfName(fMeta.transcriptPdf?.originalName || fMeta.transcript_pdf?.originalName);
        }
      }

      // Điền danh sách câu hỏi theo các phần
      if (Array.isArray(parsedData.sections) && parsedData.sections.length > 0) {
        setSections(parsedData.sections);
        setActiveSectionTab(0);
      }

      // Đã upload thành công lên server, dọn sạch file object tạm
      setExamPdfFile(null);
      setAnswerPdfFile(null);
      setAudioFile(null);
      setTranscriptPdfFile(null);
      setAudioPreviewBlobUrl(null);
      setClearedFromUploadBox({});

      // Kiểm tra cảnh báo câu hỏi bị mất font / mờ ký tự
      if (parsedData.metadata?.hasMissingChars) {
        setParsedReviewNotice({ count: parsedData.metadata.reviewQuestionsCount });
        setMessage({
          text: `Đã tự động tạo bảng câu hỏi! Phát hiện ${parsedData.metadata.reviewQuestionsCount} câu bị mờ/khuyết ký tự trong PDF gốc (đã đánh dấu viền vàng). Vui lòng rà soát trên form và bấm 'Lưu & Xuất bản đề thi' ở góc trên để lưu.`,
          type: 'warning',
        });
      } else {
        setMessage({
          text: `Phân tích trọn bộ đề thi thành công! Đã tự động điền ${parsedData.metadata?.detectedQuestionsCount || 0} câu hỏi vào form. Bạn hãy kiểm tra lại và bấm 'Lưu & Xuất bản đề thi' ở góc trên để lưu vào cơ sở dữ liệu.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi phân tích bộ file HSK:', err);
      setMessage({
        text: err.response?.data?.message || err.message || 'Lỗi khi phân tích file đề thi.',
        type: 'error',
      });
    } finally {
      setParsingFiles(false);
    }
  };

  // Thêm phần Viết (书写) nếu chưa có
  const handleAddWritingSection = () => {
    if (sections.some((s) => s.section_type === 'WRITING')) {
      alert('Đề thi đã có Phần 3: Viết (书写).');
      return;
    }
    setSections([
      ...sections,
      {
        section_type: 'WRITING',
        title: 'Phần 3: Viết (书写)',
        instructions: 'Thí sinh sắp xếp câu hoặc viết chữ Hán theo đề thi PDF.',
        questions: [],
      },
    ]);
    setActiveSectionTab(sections.length);
  };

  // Xóa phần thi
  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) {
      alert('Đề thi phải có ít nhất 1 phần thi.');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa "${sections[index].title}"?`)) {
      const updated = sections.filter((_, idx) => idx !== index);
      setSections(updated);
      setActiveSectionTab(Math.max(0, index - 1));
    }
  };

  // Đóng màn hình Xem Demo & thu hồi blob URL tạm
  const handleCloseDemoPreview = () => {
    setIsDemoOpen(false);
    setTableDemoExamData(null);
    setDemoExamStatus(null);
    Object.values(demoBlobUrls).forEach((u) => {
      if (u) {
        try {
          URL.revokeObjectURL(u);
        } catch {
          // ignore
        }
      }
    });
    setDemoBlobUrls({});
  };

  // Dữ liệu Demo đồng bộ 2 chiều trực tiếp từ form đang soạn thảo (Single Source of Truth)
  const liveFormDemoData: ExamDetail = useMemo(
    () => ({
      id: editingExamId || 0,
      code: code.trim().toUpperCase() || 'DEMO-HSK',
      title: title.trim() || `Xem trước đề thi ${hskLevel}`,
      description: description.trim(),
      hsk_level: hskLevel,
      exam_pdf_url: examPdfUrl.trim() || demoBlobUrls.examPdf || '',
      audio_url: audioPreviewBlobUrl || audioUrl.trim() || undefined,
      answer_pdf_url: answerPdfUrl.trim() || demoBlobUrls.answerPdf || null,
      duration_minutes: Number(durationMinutes) || 35,
      total_score: totalCalculatedScore > 0 ? totalCalculatedScore : 0,
      pass_score: Number(passScore) || 60,
      sections: sections.map((sec, sIdx) => ({
        id: sec.id || sIdx + 1,
        section_type: sec.section_type,
        title: sec.title,
        instructions: sec.instructions,
        audio_url: sec.audio_url,
        questions: sec.questions.map((q, qIdx) => ({
          id: q.id || -((sIdx + 1) * 1000 + qIdx + 1),
          section_id: sec.id || sIdx + 1,
          question_number: q.question_number,
          question_type: q.question_type,
          prompt_text: q.prompt_text,
          options: q.options,
          correct_answer: q.correct_answer,
          sample_answer: q.sample_answer,
          explanation: q.explanation,
          points: Number(q.points) || 0,
          order_index: qIdx,
          needsReview: q.needsReview,
          reviewReason: q.reviewReason,
        })),
      })),
    }),
    [
      editingExamId,
      code,
      title,
      description,
      hskLevel,
      examPdfUrl,
      demoBlobUrls,
      audioPreviewBlobUrl,
      audioUrl,
      answerPdfUrl,
      durationMinutes,
      totalCalculatedScore,
      passScore,
      sections,
    ]
  );

  // Mở màn hình Xem Demo trực tiếp từ dữ liệu đang nhập trên form (không cần lưu DB trước)
  const handleOpenDemoPreview = () => {
    const hasExamPdf = Boolean(examPdfUrl.trim() || examPdfFile);
    if (!hasExamPdf && totalQuestionsCount === 0) {
      setMessage({
        text: 'Vui lòng chọn File Đề PDF hoặc thêm ít nhất 1 câu hỏi trước khi xem Demo.',
        type: 'warning',
      });
      return;
    }

    const nextBlobs: { examPdf?: string; answerPdf?: string } = {};
    if (!examPdfUrl.trim() && examPdfFile) {
      nextBlobs.examPdf = URL.createObjectURL(examPdfFile);
    }
    if (!answerPdfUrl.trim() && answerPdfFile) {
      nextBlobs.answerPdf = URL.createObjectURL(answerPdfFile);
    }

    // Đảm bảo mỗi câu hỏi trong state form đều có ID duy nhất tạm thời để hỗ trợ Inline Edit & Auto-Regrade
    setSections((prev) =>
      prev.map((sec, sIdx) => ({
        ...sec,
        questions: sec.questions.map((q, qIdx) => ({
          ...q,
          id: q.id || -((sIdx + 1) * 1000 + qIdx + 1),
        })),
      }))
    );

    setDemoBlobUrls(nextBlobs);
    setDemoExamStatus(editingExamId ? status : 'DRAFT');
    setIsDemoFromForm(true);
    setIsDemoOpen(true);
  };

  // Mở Xem Demo cho một đề thi đã lưu trong bảng danh sách
  const handleOpenDemoFromTable = async (examId: number) => {
    try {
      setLoading(true);
      const data = await api.get<ExamDetail & { status?: 'DRAFT' | 'PUBLISHED' }>(`/exams/${examId}`);
      if (!data) throw new Error('Không tải được dữ liệu đề thi.');
      setDemoExamStatus(data.status || 'PUBLISHED');
      setTableDemoExamData(data);
      setIsDemoFromForm(false);
      setIsDemoOpen(true);
    } catch (err: any) {
      setMessage({ text: err.message || 'Không thể mở xem Demo đề thi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Đồng bộ 2 chiều cập nhật Meta (Tiêu đề, Cấp độ, Thời gian, Điểm đạt) từ màn hình Demo
  const handleDemoUpdateMeta = (patch: {
    title?: string;
    hsk_level?: string;
    duration_minutes?: number;
    pass_score?: number;
  }) => {
    if (isDemoFromForm) {
      if (patch.title !== undefined) setTitle(patch.title);
      if (patch.hsk_level !== undefined) setHskLevel(patch.hsk_level);
      if (patch.duration_minutes !== undefined) setDurationMinutes(patch.duration_minutes);
      if (patch.pass_score !== undefined) setPassScore(patch.pass_score);
    } else {
      setTableDemoExamData((prev) => (prev ? { ...prev, ...patch } : null));
    }
  };

  // Đồng bộ 2 chiều cập nhật Sections & Questions từ màn hình Demo
  const handleDemoUpdateSections = (updater: (prev: SectionItem[]) => SectionItem[]) => {
    if (isDemoFromForm) {
      setSections((prevSections) => {
        const mappedPrev: SectionItem[] = prevSections.map((s, sIdx) => ({
          id: s.id || sIdx + 1,
          section_type: s.section_type,
          title: s.title,
          instructions: s.instructions,
          audio_url: s.audio_url,
          questions: s.questions.map((q, qIdx) => ({
            id: q.id || -((sIdx + 1) * 1000 + qIdx + 1),
            section_id: s.id || sIdx + 1,
            question_number: q.question_number,
            question_type: q.question_type,
            prompt_text: q.prompt_text,
            options: q.options,
            correct_answer: q.correct_answer,
            sample_answer: q.sample_answer,
            explanation: q.explanation,
            points: Number(q.points) || 0,
            order_index: qIdx,
            needsReview: q.needsReview,
            reviewReason: q.reviewReason,
          })),
        }));

        const updatedItems = updater(mappedPrev);
        return updatedItems.map((sec, sIdx) => ({
          ...prevSections[sIdx],
          id: sec.id,
          section_type: sec.section_type,
          title: sec.title,
          instructions: sec.instructions,
          audio_url: sec.audio_url,
          questions: sec.questions.map((q: QuestionItem) => ({
            id: q.id,
            question_number: q.question_number,
            question_type: q.question_type,
            prompt_text: q.prompt_text,
            options: q.options,
            correct_answer: q.correct_answer || undefined,
            sample_answer: q.sample_answer || undefined,
            explanation: q.explanation || undefined,
            points: Number(q.points) || 0,
            needsReview: q.needsReview,
            reviewReason: q.reviewReason,
          })),
        }));
      });
    } else {
      setTableDemoExamData((prev) => {
        if (!prev) return null;
        const nextSections = updater(prev.sections);
        const nextTotal = nextSections.reduce(
          (sum, s) => sum + s.questions.reduce((qs, q) => qs + Number(q.points || 0), 0),
          0
        );
        return {
          ...prev,
          sections: nextSections,
          total_score: Math.round(nextTotal * 10) / 10,
        };
      });
    }
  };

  // Lưu thay đổi từ Demo đối với đề thi mở từ bảng danh sách
  const handleSaveTableDemoExam = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!tableDemoExamData) return;
    try {
      setPublishingExamId(tableDemoExamData.id);
      const totalPts = tableDemoExamData.sections.reduce(
        (sum, s) => sum + s.questions.reduce((qs, q) => qs + Number(q.points || 0), 0),
        0
      );
      if (targetStatus === 'PUBLISHED' && (tableDemoExamData.sections.length === 0 || totalPts <= 0)) {
        setMessage({
          text: 'Đề thi phải có ít nhất 1 câu hỏi và tổng điểm lớn hơn 0 trước khi xuất bản.',
          type: 'error',
        });
        setPublishingExamId(null);
        return;
      }

      const savedTableRes = await api.put<any>(`/exams/${tableDemoExamData.id}`, {
        code: tableDemoExamData.code,
        title: tableDemoExamData.title,
        description: tableDemoExamData.description || '',
        hsk_level: tableDemoExamData.hsk_level,
        exam_pdf_url: tableDemoExamData.exam_pdf_url,
        audio_url: tableDemoExamData.audio_url || null,
        answer_pdf_url: tableDemoExamData.answer_pdf_url || null,
        duration_minutes: tableDemoExamData.duration_minutes,
        total_score: totalPts > 0 ? totalPts : tableDemoExamData.total_score,
        pass_score: tableDemoExamData.pass_score,
        status: targetStatus,
        sections: tableDemoExamData.sections.map((s, sIdx) => ({
          section_type: s.section_type,
          title: s.title,
          instructions: s.instructions,
          audio_url: s.audio_url,
          order_index: sIdx,
          questions: s.questions.map((q, qIdx) => ({
            question_number: q.question_number,
            question_type: q.question_type,
            prompt_text: q.prompt_text,
            options: q.options,
            correct_answer: q.correct_answer,
            sample_answer: q.sample_answer,
            points: Number(q.points) || 0,
            explanation: q.explanation,
            order_index: qIdx,
          })),
        })),
      });

      if (targetStatus === 'DRAFT') {
        setDemoExamStatus('DRAFT');
        if (savedTableRes?.id) {
          setTableDemoExamData((prev) => (prev ? { ...prev, id: savedTableRes.id } : null));
        }
        showDemoNotice('Đã lưu bản nháp đề thi!', 'success');
        setMessage({
          text: `Đã lưu bản nháp đề thi ${tableDemoExamData.code}!`,
          type: 'success',
        });
        await fetchExams(true);
      } else {
        handleCloseDemoPreview();
        setMessage({
          text: `Đã xuất bản đề thi ${tableDemoExamData.code} thành công!`,
          type: 'success',
        });
        await fetchExams();
        setTimeout(() => {
          examListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi lưu chỉnh sửa từ Demo.';
      showDemoNotice(errMsg, 'error');
      setMessage({
        text: errMsg,
        type: 'error',
      });
    } finally {
      setPublishingExamId(null);
    }
  };

  // Xuất bản nhanh đề đang ở trạng thái DRAFT từ bảng danh sách
  const handleQuickPublish = async (examItem: { id: number; code: string }) => {
    try {
      setPublishingExamId(examItem.id);
      setMessage(null);
      await api.patch(`/exams/${examItem.id}/publish`, { status: 'PUBLISHED' });
      setMessage({
        text: `Đã xuất bản đề thi ${examItem.code} thành công! Học viên đã có thể vào làm bài.`,
        type: 'success',
      });
      await fetchExams();
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || err.message || 'Không thể xuất bản đề thi.',
        type: 'error',
      });
    } finally {
      setPublishingExamId(null);
    }
  };

  // Lưu đề thi vào database (hỗ trợ cả Lưu nháp DRAFT giữ nguyên chỗ & Xuất bản PUBLISHED tự thoát)
  const handleSaveExam = async (targetStatus?: 'DRAFT' | 'PUBLISHED') => {
    const effectiveStatus = targetStatus || status;
    try {
      setSaving(true);
      setMessage(null);

      // Tự động upload các file mới chọn (nếu người dùng chưa bấm nút bóc tách tự động)
      let finalExamPdfUrl = examPdfUrl.trim();
      let finalAnswerPdfUrl = answerPdfUrl.trim();
      let finalAudioUrl = audioUrl.trim();
      let finalTranscriptPdfUrl = transcriptPdfUrl.trim();

      if (examPdfFile || answerPdfFile || audioFile || transcriptPdfFile) {
        const formData = new FormData();
        if (examPdfFile) formData.append('examPdf', examPdfFile);
        if (answerPdfFile) formData.append('answerPdf', answerPdfFile);
        if (audioFile) formData.append('audio', audioFile);
        if (transcriptPdfFile) formData.append('transcriptPdf', transcriptPdfFile);

        const uploadRes = await api.upload<any>('/exams/upload', formData);
        if (uploadRes?.urls) {
          if (uploadRes.urls.exam_pdf) finalExamPdfUrl = uploadRes.urls.exam_pdf;
          if (uploadRes.urls.answer_pdf) finalAnswerPdfUrl = uploadRes.urls.answer_pdf;
          if (uploadRes.urls.audio) finalAudioUrl = uploadRes.urls.audio;
          if (uploadRes.urls.transcript_pdf) finalTranscriptPdfUrl = uploadRes.urls.transcript_pdf;

          if (uploadRes.files) {
            if (uploadRes.files.examPdf?.originalName) setExamPdfName(uploadRes.files.examPdf.originalName);
            if (uploadRes.files.answerPdf?.originalName) setAnswerPdfName(uploadRes.files.answerPdf.originalName);
            if (uploadRes.files.audio?.originalName) setAudioName(uploadRes.files.audio.originalName);
            if (uploadRes.files.transcriptPdf?.originalName) setTranscriptPdfName(uploadRes.files.transcriptPdf.originalName);
          }

          setExamPdfUrl(finalExamPdfUrl);
          setAnswerPdfUrl(finalAnswerPdfUrl);
          setAudioUrl(finalAudioUrl);
          setTranscriptPdfUrl(finalTranscriptPdfUrl);
          setExamPdfFile(null);
          setAnswerPdfFile(null);
          setAudioFile(null);
          setTranscriptPdfFile(null);
          setAudioPreviewBlobUrl(null);
        }
      }

      if (!code.trim()) {
        const msg = 'Vui lòng nhập Mã đề thi (VD: H10000 hoặc H11332).';
        setMessage({ text: msg, type: 'error' });
        if (isDemoOpen) showDemoNotice(msg, 'error');
        setSaving(false);
        return;
      }
      if (!title.trim()) {
        const msg = 'Vui lòng nhập Tiêu đề đề thi.';
        setMessage({ text: msg, type: 'error' });
        if (isDemoOpen) showDemoNotice(msg, 'error');
        setSaving(false);
        return;
      }
      if (!finalExamPdfUrl) {
        const msg = 'Vui lòng chọn File hoặc nhập URL cho File Đề PDF chính.';
        setMessage({ text: msg, type: 'error' });
        if (isDemoOpen) showDemoNotice(msg, 'error');
        setSaving(false);
        return;
      }

      if (effectiveStatus === 'PUBLISHED') {
        if (sections.length === 0 || totalQuestionsCount < 1) {
          const msg =
            'Đề thi xuất bản phải có ít nhất 1 phần thi và 1 câu hỏi. Bạn có thể chọn "Lưu nháp" để hoàn thiện sau.';
          setMessage({ text: msg, type: 'error' });
          if (isDemoOpen) showDemoNotice(msg, 'error');
          setSaving(false);
          return;
        }
      }

      const payload = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        hsk_level: hskLevel,
        exam_pdf_url: finalExamPdfUrl,
        audio_url: finalAudioUrl ? finalAudioUrl : null,
        answer_pdf_url: finalAnswerPdfUrl ? finalAnswerPdfUrl : null,
        transcript_pdf_url: finalTranscriptPdfUrl ? finalTranscriptPdfUrl : null,
        duration_minutes: Number(durationMinutes) || 35,
        total_score: totalCalculatedScore > 0 ? totalCalculatedScore : 100,
        pass_score: Number(passScore) || 60,
        status: effectiveStatus,
        sections: sections.map((s, sIdx) => ({
          section_type: s.section_type,
          title: s.title,
          instructions: s.instructions,
          audio_url: s.audio_url || undefined,
          order_index: sIdx,
          questions: s.questions.map((q, qIdx) => ({
            question_number: q.question_number,
            question_type: q.question_type,
            prompt_text: q.prompt_text,
            options: q.options,
            correct_answer: q.correct_answer,
            sample_answer: q.sample_answer,
            points: Number(q.points) || 2.5,
            explanation: q.explanation,
            order_index: qIdx,
          })),
        })),
      };

      let savedExam: any = null;
      if (editingExamId) {
        savedExam = await api.put<any>(`/exams/${editingExamId}`, payload);
      } else {
        savedExam = await api.post<any>('/exams', payload);
      }

      const savedId = savedExam?.id || savedExam?.data?.id || editingExamId;

      if (effectiveStatus === 'DRAFT') {
        // A. LƯU NHÁP -> GIỮ NGUYÊN VỊ TRÍ LÀM VIỆC (KHÔNG ĐÓNG DEMO, KHÔNG RESET FORM)
        // Nhưng dọn sạch danh sách file đang chọn & reset <input type="file"> (không xóa file vật lý đã lưu trên server)
        clearUploadStagingFiles();
        setClearedFromUploadBox({
          examPdf: true,
          answerPdf: true,
          audio: true,
          transcriptPdf: true,
        });
        if (savedId) setEditingExamId(savedId);
        setStatus('DRAFT');
        setDemoExamStatus('DRAFT');
        setMessage({
          text: `Đã lưu bản nháp đề thi ${payload.code}!`,
          type: 'success',
        });
        if (isDemoOpen) {
          showDemoNotice('Đã lưu bản nháp đề thi!', 'success');
        }
        await fetchExams(true);
      } else {
        // B. XUẤT BẢN ĐỀ THI -> ĐÓNG DEMO, RESET FORM, TẢI LẠI DANH SÁCH & CUỘN XUỐNG BẢNG
        handleCloseDemoPreview();
        handleResetForm();
        setMessage({
          text: `Đã xuất bản đề thi ${payload.code} thành công!`,
          type: 'success',
        });
        await fetchExams();
        setTimeout(() => {
          examListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu đề thi:', err);
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi lưu đề thi.';
      setMessage({
        text: errMsg,
        type: 'error',
      });
      if (isDemoOpen) showDemoNotice(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Nạp đề để sửa
  const handleEditExam = async (examId: number) => {
    try {
      setLoading(true);
      const data = await api.get<any>(`/exams/${examId}`);
      if (!data) return;

      setEditingExamId(data.id);
      setCode(data.code || '');
      setTitle(data.title || '');
      setDescription(data.description || '');
      setHskLevel(data.hsk_level || 'HSK1');
      setDurationMinutes(data.duration_minutes || 35);
      setPassScore(data.pass_score || 60);
      setStatus(data.status || 'PUBLISHED');
      setExamPdfUrl(data.exam_pdf_url || '');
      setAudioUrl(data.audio_url || '');
      setAnswerPdfUrl(data.answer_pdf_url || '');
      setTranscriptPdfUrl(data.transcript_pdf_url || '');

      // Lưu tên file hiển thị đẹp, chuẩn tiếng Việt/Trung
      setExamPdfName(extractFileNameFromUrl(data.exam_pdf_url, data.code ? `${data.code}_exam.pdf` : 'exam.pdf'));
      setAnswerPdfName(extractFileNameFromUrl(data.answer_pdf_url, data.code ? `${data.code}_answer.pdf` : 'answer.pdf'));
      setAudioName(extractFileNameFromUrl(data.audio_url, data.code ? `${data.code}_audio.mp3` : 'audio.mp3'));
      setTranscriptPdfName(extractFileNameFromUrl(data.transcript_pdf_url, data.code ? `${data.code}_transcript.pdf` : 'transcript.pdf'));

      setExamPdfFile(null);
      setAnswerPdfFile(null);
      setAudioFile(null);
      setTranscriptPdfFile(null);
      setAudioPreviewBlobUrl(null);
      setParsedReviewNotice(null);
      setClearedFromUploadBox({});

      // Bắt buộc reset inputRef để giáo viên có thể chọn lại file
      if (examPdfInputRef.current) examPdfInputRef.current.value = '';
      if (answerPdfInputRef.current) answerPdfInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';
      if (transcriptPdfInputRef.current) transcriptPdfInputRef.current.value = '';
      if (batchFileInputRef.current) batchFileInputRef.current.value = '';

      if (data.sections && data.sections.length > 0) {
        setSections(
          data.sections.map((s: any) => ({
            id: s.id,
            section_type: s.section_type,
            title: s.title,
            instructions: s.instructions,
            audio_url: s.audio_url,
            questions: s.questions || [],
          }))
        );
      }
      setActiveSectionTab(0);
      setMessage({
        text: `Đang chỉnh sửa đề thi: ${data.code} - ${data.title}. Bộ file học liệu đã được nạp sẵn.`,
        type: 'success',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(err.message || 'Không thể tải đề thi.');
    } finally {
      setLoading(false);
    }
  };

  // Xóa đề thi - mở modal xác nhận
  const handleDeleteExam = (exam: { id: number; code: string; title: string }) => {
    setExamToDelete(exam);
  };

  const handleConfirmDeleteExam = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/exams/${examToDelete.id}`);
      setMessage({ text: `Đã xóa đề thi ${examToDelete.code} thành công.`, type: 'success' });
      await fetchExams();
      if (editingExamId === examToDelete.id) {
        handleResetForm();
      }
      setExamToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa đề thi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetForm = () => {
    setEditingExamId(null);
    setCode('');
    setTitle('');
    setDescription('');
    setHskLevel('HSK1');
    setDurationMinutes(35);
    setPassScore(60);
    setStatus('PUBLISHED');
    setExamPdfUrl('');
    setAudioUrl('');
    setAnswerPdfUrl('');
    setTranscriptPdfUrl('');
    setExamPdfFile(null);
    setAnswerPdfFile(null);
    setAudioFile(null);
    setTranscriptPdfFile(null);
    setAudioPreviewBlobUrl(null);
    setExamPdfName('');
    setAnswerPdfName('');
    setAudioName('');
    setTranscriptPdfName('');
    setExamPdfSize(0);
    setAnswerPdfSize(0);
    setAudioSize(0);
    setTranscriptPdfSize(0);
    setParsedReviewNotice(null);
    setClearedFromUploadBox({});
    if (examPdfInputRef.current) examPdfInputRef.current.value = '';
    if (answerPdfInputRef.current) answerPdfInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (transcriptPdfInputRef.current) transcriptPdfInputRef.current.value = '';
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
    setSections([
      {
        section_type: 'LISTENING',
        title: 'Phần 1: Nghe hiểu (听力)',
        instructions: 'Thí sinh nghe đoạn âm thanh và làm theo hướng dẫn trong đề PDF.',
        questions: [],
      },
      {
        section_type: 'READING',
        title: 'Phần 2: Đọc hiểu (阅读)',
        instructions: 'Thí sinh đọc đề thi PDF và điền đáp án tương ứng.',
        questions: [],
      },
    ]);
    setActiveSectionTab(0);
  };

  // ── DANH SÁCH CÁC FILE ĐANG GẮN VÀO ĐỀ THI ──────────────────────────────
  const activeFiles: Array<{
    key: 'examPdf' | 'answerPdf' | 'audio' | 'transcriptPdf';
    role: FileRole;
    categoryLabel: string;
    fileName: string;
    fileSize: string;
    url: string;
    isNew: boolean;
    badgeBg: string;
    badgeTag: string;
    icon: React.ReactNode;
    onPreview?: () => void;
    onRemove: () => void;
  }> = [];

  if (examPdfFile || (examPdfUrl.trim() && !clearedFromUploadBox.examPdf)) {
    activeFiles.push({
      key: 'examPdf',
      role: 'examPdf',
      categoryLabel: 'Đề thi PDF',
      fileName: examPdfFile?.name || examPdfName || extractFileNameFromUrl(examPdfUrl, code ? `${code}_exam.pdf` : 'exam.pdf'),
      fileSize: (examPdfFile?.size || examPdfSize) ? formatFileSize(examPdfFile?.size || examPdfSize) : '',
      url: examPdfUrl,
      isNew: Boolean(examPdfFile),
      badgeBg: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40',
      badgeTag: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300',
      icon: <FileText className="w-4 h-4 text-red-600" />,
      onPreview: examPdfUrl
        ? () => {
            setPreviewPdfUrl(examPdfUrl);
            setPreviewPdfTitle('Xem trước File Đề Thi PDF');
          }
        : undefined,
      onRemove: handleRemoveExamPdf,
    });
  }

  if (answerPdfFile || (answerPdfUrl.trim() && !clearedFromUploadBox.answerPdf)) {
    activeFiles.push({
      key: 'answerPdf',
      role: 'answerPdf',
      categoryLabel: 'Đáp án PDF',
      fileName: answerPdfFile?.name || answerPdfName || extractFileNameFromUrl(answerPdfUrl, code ? `${code}_answer.pdf` : 'answer.pdf'),
      fileSize: (answerPdfFile?.size || answerPdfSize) ? formatFileSize(answerPdfFile?.size || answerPdfSize) : '',
      url: answerPdfUrl,
      isNew: Boolean(answerPdfFile),
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40',
      badgeTag: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      icon: <FileCheck className="w-4 h-4 text-emerald-600" />,
      onPreview: answerPdfUrl
        ? () => {
            setPreviewPdfUrl(answerPdfUrl);
            setPreviewPdfTitle('Xem trước File Đáp Án PDF');
          }
        : undefined,
      onRemove: handleRemoveAnswerPdf,
    });
  }

  if (audioFile || (audioUrl.trim() && !clearedFromUploadBox.audio)) {
    activeFiles.push({
      key: 'audio',
      role: 'audio',
      categoryLabel: 'File nghe Audio',
      fileName: audioFile?.name || audioName || extractFileNameFromUrl(audioUrl, code ? `${code}_audio.mp3` : 'audio.mp3'),
      fileSize: (audioFile?.size || audioSize) ? formatFileSize(audioFile?.size || audioSize) : '',
      url: audioUrl,
      isNew: Boolean(audioFile),
      badgeBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40',
      badgeTag: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      icon: <Headphones className="w-4 h-4 text-blue-600" />,
      onRemove: handleRemoveAudio,
    });
  }

  if (transcriptPdfFile || (transcriptPdfUrl.trim() && !clearedFromUploadBox.transcriptPdf)) {
    activeFiles.push({
      key: 'transcriptPdf',
      role: 'transcriptPdf',
      categoryLabel: 'Transcript PDF',
      fileName: transcriptPdfFile?.name || transcriptPdfName || extractFileNameFromUrl(transcriptPdfUrl, code ? `${code}_transcript.pdf` : 'transcript.pdf'),
      fileSize: (transcriptPdfFile?.size || transcriptPdfSize) ? formatFileSize(transcriptPdfFile?.size || transcriptPdfSize) : '',
      url: transcriptPdfUrl,
      isNew: Boolean(transcriptPdfFile),
      badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40',
      badgeTag: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
      icon: <FileText className="w-4 h-4 text-purple-600" />,
      onPreview: transcriptPdfUrl
        ? () => {
            setPreviewPdfUrl(transcriptPdfUrl);
            setPreviewPdfTitle('Xem trước Transcript PDF');
          }
        : undefined,
      onRemove: handleRemoveTranscriptPdf,
    });
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#C41E3A]/10 text-[#C41E3A] text-xs font-bold uppercase tracking-wider">
              Dành Cho Giáo Viên & Quản Trị
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
              Quản Lý Đề Thi Thử HSK (PDF + Audio)
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {editingExamId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              Tạo đề mới
            </button>
          )}

          {/* 1. Nút Xem Demo */}
          <button
            type="button"
            onClick={handleOpenDemoPreview}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-sky-500 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-600 dark:hover:bg-sky-600 dark:hover:text-white font-bold text-sm transition-all cursor-pointer shadow-xs"
            title="Xem Demo phòng thi Split-Screen và chấm thử trực tiếp từ dữ liệu đang nhập"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Xem Demo</span>
          </button>

          {/* 2. Nút Lưu nháp */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveExam('DRAFT')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Lưu đề thi ở trạng thái Bản nháp (DRAFT) — học viên chưa nhìn thấy"
          >
            <Save className="w-4 h-4" />
            <span>Lưu nháp</span>
          </button>

          {/* 3. Nút Xuất bản đề thi */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveExam('PUBLISHED')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C41E3A] hover:bg-[#A81830] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            title="Kiểm tra hợp lệ và công khai đề thi cho học viên vào thi ngay"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{editingExamId ? 'Lưu & Xuất bản đề thi' : 'Xuất bản đề thi'}</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : message.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : message.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── BƯỚC 1: BỘ FILE ĐỀ THI & HỌC LIỆU (DUY NHẤT) ───────────────────── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#C41E3A] text-white shadow-md shadow-[#C41E3A]/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">
                  1. Bộ File Đề Thi & Học Liệu (PDF + Audio)
                </h2>
                {/* Bộ đếm tổng số file đang có */}
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1.5 transition-colors ${
                    activeFiles.length > 0
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Đã tải lên: {activeFiles.length} file</span>
                </span>
                {editingExamId && (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                    Đang sửa đề ID #{editingExamId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Chọn file từ máy tính hoặc dán URL có sẵn. Bấm <span className="font-bold text-[#C41E3A]">"Tự động bóc tách bảng đáp án"</span> để hệ thống trích xuất thông tin & đáp án từ file PDF vào form bên dưới.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={parsingFiles || (!answerPdfFile && !answerPdfUrl && !examPdfFile && !examPdfUrl)}
            onClick={handleAutoParseFiles}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C41E3A] to-[#8E1228] hover:from-[#A81830] hover:to-[#6E0B1D] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
            title="Tự động bóc tách mã đề, cấp độ và bảng đáp án từ file PDF thuần túy"
          >
            {parsingFiles ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileCheck className="w-4 h-4" />
            )}
            <span>{parsingFiles ? 'Đang bóc tách file PDF...' : 'Tự động bóc tách bảng đáp án'}</span>
          </button>
        </div>

        {/* Cảnh báo soát lại mờ font / khuyết ký tự */}
        {parsedReviewNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 dark:bg-amber-950/40 dark:border-amber-600 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Phát hiện {parsedReviewNotice.count} câu hỏi có ký tự mờ hoặc khuyết font trong PDF gốc!
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Các câu hỏi này đã được tự động gợi ý đáp án khả dĩ nhất và gắn huy hiệu màu vàng <span className="font-bold text-amber-700 bg-amber-200/80 px-1.5 py-0.5 rounded">⚠️ Cần kiểm tra lại</span>. Thầy/Cô vui lòng đối chiếu lại hình ảnh câu hỏi trong đề trước khi xuất bản.
              </p>
            </div>
          </div>
        )}

        {/* ── KHU VỰC MULTI-FILE DROPZONE (KÉO THẢ HOẶC CHỌN NHIỀU FILE CÙNG LÚC) ── */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleBatchFilesSelect(e.dataTransfer.files);
            }
          }}
          className={`relative p-6 sm:p-7 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
            isDragging
              ? 'border-[#C41E3A] bg-red-50/70 dark:bg-red-950/20 scale-[1.008]'
              : 'border-slate-300 dark:border-white/20 bg-slate-50/60 dark:bg-white/5 hover:border-[#C41E3A]/60 hover:bg-slate-50 dark:hover:bg-white/8'
          }`}
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== 'BUTTON') {
              batchFileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={batchFileInputRef}
            type="file"
            multiple
            accept=".pdf,.mp3,.wav,.m4a,.ogg"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleBatchFilesSelect(e.target.files);
              }
            }}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-[#C41E3A]/10 text-[#C41E3A] flex items-center justify-center shadow-xs">
            {isUploadingBatch ? (
              <RefreshCw className="w-6 h-6 animate-spin text-[#C41E3A]" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isUploadingBatch ? (
                <span className="text-[#C41E3A]">Đang tải lên và phân loại file lên máy chủ...</span>
              ) : isDragging ? (
                <span className="text-[#C41E3A]">Thả toàn bộ file vào đây để hệ thống tự phân loại!</span>
              ) : (
                <>
                  Kéo thả trọn bộ file đề thi vào đây, hoặc{' '}
                  <span className="text-[#C41E3A] hover:underline font-extrabold cursor-pointer">
                    chọn nhiều file cùng lúc
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hỗ trợ cùng lúc: <span className="font-semibold text-slate-700 dark:text-slate-300">File Đề PDF, Đáp án PDF (答案), Audio (.mp3), Transcript (听力材料)</span> (Tối đa 100MB/file)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              disabled={isUploadingBatch}
              onClick={(e) => {
                e.stopPropagation();
                batchFileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploadingBatch ? 'Đang tải lên...' : 'Chọn nhiều file từ máy tính'}</span>
            </button>
            <span className="text-xs text-slate-400">hoặc chọn từng file ở các ô bên dưới</span>
          </div>
        </div>

        {/* ── DANH SÁCH FILE ĐÃ TẢI LÊN: HIỂN THỊ TÁCH BẠCH TỪNG THẺ/HÀNG ĐỘC LẬP KÈM TÊN FILE & NÚT XÓA RIÊNG ── */}
        {activeFiles.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#C41E3A]" />
                <span>Danh sách file đã tải lên ({activeFiles.length} file)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Có thể đổi vai trò file qua menu chọn hoặc bấm nút <span className="text-red-500 font-bold">✕</span> để xóa
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeFiles.map((file) => (
                <div
                  key={file.key}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl ${file.badgeBg} shrink-0`}>
                      {file.icon}
                    </div>
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={file.role}
                          onChange={(e) => handleReassignRole(file.role, e.target.value as FileRole)}
                          className="text-[11px] font-bold py-0.5 px-2 rounded-md border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/10 text-slate-800 dark:text-slate-200 cursor-pointer outline-none focus:border-[#C41E3A]"
                          title="Đổi phân loại vai trò file"
                        >
                          <option value="examPdf">Đề thi PDF</option>
                          <option value="answerPdf">Đáp án PDF</option>
                          <option value="audio">File nghe Audio</option>
                          <option value="transcriptPdf">Transcript PDF</option>
                        </select>

                        {file.fileSize && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                            {file.fileSize}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {file.isNew ? '• File mới' : '• Đã lưu'}
                        </span>
                      </div>
                      <p
                        className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate"
                        title={file.fileName}
                      >
                        {file.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {file.role === 'audio' ? (
                      <button
                        type="button"
                        onClick={togglePlayAudioPreview}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isPreviewAudioPlaying
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                        }`}
                        title={isPreviewAudioPlaying ? 'Dừng phát Audio' : 'Nghe thử Audio'}
                      >
                        {isPreviewAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isPreviewAudioPlaying ? 'Dừng' : 'Nghe thử'}</span>
                      </button>
                    ) : file.onPreview ? (
                      <button
                        type="button"
                        onClick={file.onPreview}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title={`Xem trước ${file.categoryLabel}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xem</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={file.onRemove}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                      title={`Xóa ${file.categoryLabel}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Ô File Picker Gọn Gàng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ô 1: File Đề PDF chính */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <FileText className="w-4 h-4" />
                  1. File Đề PDF chính *
                </span>
                <div className="flex items-center gap-1.5">
                  {examPdfFile ? (
                    <span className="text-blue-600 font-bold text-[11px]">✓ File mới</span>
                  ) : examPdfUrl ? (
                    <span className="text-emerald-600 font-bold text-[11px]">✓ Đã lưu</span>
                  ) : null}
                  {(examPdfFile || examPdfUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveExamPdf}
                      className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer"
                      title="Xóa file đề PDF"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={examPdfInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setExamPdfFile(f);
                  if (f) {
                    setExamPdfName(f.name);
                    setExamPdfSize(f.size);
                    setClearedFromUploadBox((prev) => ({ ...prev, examPdf: false }));
                  }
                }}
                className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#C41E3A] file:text-white cursor-pointer"
              />

              {examPdfFile ? (
                <div className="flex items-center justify-between text-[10px] text-blue-600 font-mono">
                  <span className="truncate" title={examPdfFile.name}>
                    📁 {examPdfFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveExamPdf}
                    className="text-red-500 hover:underline cursor-pointer ml-1 font-sans font-bold"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={examPdfUrl}
                  onChange={(e) => setExamPdfUrl(e.target.value)}
                  placeholder="Hoặc dán URL: /uploads/exams/..."
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none font-mono text-[11px]"
                />
              )}
            </div>

            {examPdfUrl && (
              <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[120px]" title={examPdfName || examPdfUrl}>
                  {examPdfName || extractFileNameFromUrl(examPdfUrl, 'exam.pdf')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPdfUrl(examPdfUrl);
                      setPreviewPdfTitle('Xem trước File Đề Thi PDF');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C41E3A] hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveExamPdf}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    title="Xóa file đề"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ô 2: File Đáp Án PDF */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="w-4 h-4" />
                  2. File Đáp Án PDF (答案)
                </span>
                <div className="flex items-center gap-1.5">
                  {answerPdfFile ? (
                    <span className="text-blue-600 font-bold text-[11px]">✓ File mới</span>
                  ) : answerPdfUrl ? (
                    <span className="text-emerald-600 font-bold text-[11px]">✓ Đã lưu</span>
                  ) : null}
                  {(answerPdfFile || answerPdfUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveAnswerPdf}
                      className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer"
                      title="Xóa file đáp án"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={answerPdfInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setAnswerPdfFile(f);
                  if (f) {
                    setAnswerPdfName(f.name);
                    setAnswerPdfSize(f.size);
                    setClearedFromUploadBox((prev) => ({ ...prev, answerPdf: false }));
                  }
                }}
                className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-600 file:text-white cursor-pointer"
              />

              {answerPdfFile ? (
                <div className="flex items-center justify-between text-[10px] text-blue-600 font-mono">
                  <span className="truncate" title={answerPdfFile.name}>
                    📁 {answerPdfFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAnswerPdf}
                    className="text-red-500 hover:underline cursor-pointer ml-1 font-sans font-bold"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={answerPdfUrl}
                  onChange={(e) => setAnswerPdfUrl(e.target.value)}
                  placeholder="Hoặc dán URL: /uploads/exams/..."
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none font-mono text-[11px]"
                />
              )}
            </div>

            {answerPdfUrl && (
              <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[120px]" title={answerPdfName || answerPdfUrl}>
                  {answerPdfName || extractFileNameFromUrl(answerPdfUrl, 'answer.pdf')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPdfUrl(answerPdfUrl);
                      setPreviewPdfTitle('Xem trước File Đáp Án PDF');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAnswerPdf}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    title="Xóa file đáp án"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ô 3: File Nghe Audio MP3 */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Headphones className="w-4 h-4" />
                  3. File Nghe Audio MP3
                </span>
                <div className="flex items-center gap-1.5">
                  {audioFile ? (
                    <span className="text-blue-600 font-bold text-[11px]">✓ File mới</span>
                  ) : audioUrl ? (
                    <span className="text-emerald-600 font-bold text-[11px]">✓ Đã lưu</span>
                  ) : null}
                  {(audioFile || audioUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveAudio}
                      className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer"
                      title="Xóa file audio"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setAudioFile(f);
                  if (f) {
                    setAudioName(f.name);
                    setAudioSize(f.size);
                    setAudioPreviewBlobUrl(URL.createObjectURL(f));
                    setClearedFromUploadBox((prev) => ({ ...prev, audio: false }));
                  }
                }}
                className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-blue-600 file:text-white cursor-pointer"
              />

              {audioFile ? (
                <div className="flex items-center justify-between text-[10px] text-blue-600 font-mono">
                  <span className="truncate" title={audioFile.name}>
                    🎧 {audioFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="text-red-500 hover:underline cursor-pointer ml-1 font-sans font-bold"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={audioUrl}
                  onChange={(e) => {
                    setAudioUrl(e.target.value);
                    setAudioPreviewBlobUrl(null);
                  }}
                  placeholder="Hoặc dán URL: /uploads/exams/..."
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none font-mono text-[11px]"
                />
              )}
            </div>

            {/* Trình phát Audio nghe thử trực tiếp & nút xóa */}
            {(audioPreviewBlobUrl || audioUrl) && (
              <div className="pt-1 space-y-1 border-t border-slate-200/60 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-blue-600" />
                    <span className="truncate max-w-[110px]" title={audioName || audioUrl}>
                      {audioName || extractFileNameFromUrl(audioUrl, 'audio.mp3')}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    title="Xóa file audio"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                </div>
                <audio
                  ref={audioPreviewRef}
                  src={audioPreviewBlobUrl || resolveMediaUrl(audioUrl)}
                  controls
                  onPlay={() => setIsPreviewAudioPlaying(true)}
                  onPause={() => setIsPreviewAudioPlaying(false)}
                  onEnded={() => setIsPreviewAudioPlaying(false)}
                  className="w-full h-7 text-xs"
                />
              </div>
            )}
          </div>

          {/* Ô 4: Transcript PDF (Tùy chọn) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <FileText className="w-4 h-4" />
                  4. Transcript PDF (Tùy chọn)
                </span>
                <div className="flex items-center gap-1.5">
                  {transcriptPdfFile ? (
                    <span className="text-blue-600 font-bold text-[11px]">✓ File mới</span>
                  ) : transcriptPdfUrl ? (
                    <span className="text-emerald-600 font-bold text-[11px]">✓ Đã lưu</span>
                  ) : null}
                  {(transcriptPdfFile || transcriptPdfUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveTranscriptPdf}
                      className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer"
                      title="Xóa file transcript"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={transcriptPdfInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setTranscriptPdfFile(f);
                  if (f) {
                    setTranscriptPdfName(f.name);
                    setTranscriptPdfSize(f.size);
                    setClearedFromUploadBox((prev) => ({ ...prev, transcriptPdf: false }));
                  }
                }}
                className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-purple-600 file:text-white cursor-pointer"
              />

              {transcriptPdfFile ? (
                <div className="flex items-center justify-between text-[10px] text-blue-600 font-mono">
                  <span className="truncate" title={transcriptPdfFile.name}>
                    📁 {transcriptPdfFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveTranscriptPdf}
                    className="text-red-500 hover:underline cursor-pointer ml-1 font-sans font-bold"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={transcriptPdfUrl}
                  onChange={(e) => setTranscriptPdfUrl(e.target.value)}
                  placeholder="Hoặc dán URL: /uploads/exams/..."
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none font-mono text-[11px]"
                />
              )}
            </div>

            {transcriptPdfUrl && (
              <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-purple-600 font-bold truncate max-w-[120px]" title={transcriptPdfName || transcriptPdfUrl}>
                  {transcriptPdfName || extractFileNameFromUrl(transcriptPdfUrl, 'transcript.pdf')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPdfUrl(transcriptPdfUrl);
                      setPreviewPdfTitle('Xem trước Transcript PDF');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveTranscriptPdf}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    title="Xóa transcript"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General Info & File Uploads */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
            <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#C41E3A]" />
              <span>Thông tin chung đề thi</span>
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cấp độ HSK *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHskLevel(lvl)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        hskLevel === lvl
                          ? 'bg-[#C41E3A] border-[#C41E3A] text-white shadow-sm'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-400 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã đề thi *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: H10000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 font-mono text-sm uppercase focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thời gian (phút) *
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={10}
                    max={180}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề đề thi *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Đề thi thử HSK 1 - Mã H10000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả / Lưu ý
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="VD: Đề thi chuẩn HSK gồm các phần Nghe, Đọc..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Điểm đạt (Pass)
                  </label>
                  <input
                    type="number"
                    value={passScore}
                    onChange={(e) => setPassScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] outline-none"
                  >
                    <option value="PUBLISHED">Công khai (PUBLISHED)</option>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Sections & Question Builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            {/* Header with Section Score Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                    2. Cấu hình Phần thi & Thang điểm
                  </h2>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#C41E3A]/10 text-[#C41E3A]">
                    {totalQuestionsCount} câu | Tổng: {totalCalculatedScore}đ
                  </span>
                </div>
                {/* Realtime section breakdown */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {sections.map((sec, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 font-semibold"
                    >
                      {sec.title.split(':')[0]}: <b>{sec.questions.length} câu</b> ({sectionScores[idx]}đ)
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddWritingSection}
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 transition-colors cursor-pointer"
              >
                + Thêm Phần 3: Viết (书写)
              </button>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
              {sections.map((sec, idx) => (
                <div key={idx} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleSwitchTeacherSection(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeSectionTab === idx
                        ? 'bg-[#C41E3A] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sec.title}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                      {sec.questions.length} câu ({sectionScores[idx]}đ)
                    </span>
                  </button>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      title="Xóa phần này"
                      className="ml-1 p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Questions List (Streamlined) */}
            {sections[activeSectionTab] && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    Danh sách câu hỏi của <b>{sections[activeSectionTab].title}</b> (
                    {sections[activeSectionTab].questions.length} câu)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...sections];
                        const currentQ = updated[activeSectionTab].questions;
                        const nextNum =
                          currentQ.length > 0
                            ? Math.max(...currentQ.map((q) => q.question_number)) + 1
                            : 1;
                        currentQ.push({
                          id: -Date.now(),
                          question_number: nextNum,
                          question_type:
                            updated[activeSectionTab].section_type === 'WRITING'
                              ? 'WRITING_FILL'
                              : 'MCQ_ABCD',
                          prompt_text: `Câu ${nextNum}`,
                          options:
                            updated[activeSectionTab].section_type === 'WRITING'
                              ? []
                              : ['A', 'B', 'C', 'D'],
                          correct_answer:
                            updated[activeSectionTab].section_type === 'WRITING' ? '' : 'A',
                          points: 2.5,
                        });
                        setSections(updated);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-300 hover:text-[#C41E3A] hover:border-[#C41E3A]/40 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm câu thủ công</span>
                    </button>

                    {sections[activeSectionTab].questions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleOpenDemoPreview}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-all"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Mở Xem Demo để đối chiếu PDF &amp; Sửa trực tiếp</span>
                      </button>
                    )}
                  </div>
                </div>

                {sections[activeSectionTab].questions.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 text-sm space-y-3">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      Phần này chưa có câu hỏi nào.
                    </p>
                    <p className="text-xs text-slate-500">
                      Tải file PDF ở mục 1 và bấm <b>"Tự động bóc tách bảng đáp án"</b> để tự động điền toàn bộ câu hỏi.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...sections];
                        const isWriting = updated[activeSectionTab].section_type === 'WRITING';
                        updated[activeSectionTab].questions.push({
                          id: -Date.now(),
                          question_number: 1,
                          question_type: isWriting ? 'WRITING_FILL' : 'MCQ_ABCD',
                          prompt_text: 'Câu 1',
                          options: isWriting ? [] : ['A', 'B', 'C', 'D'],
                          correct_answer: isWriting ? '' : 'A',
                          points: 5,
                        });
                        setSections(updated);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 hover:border-[#C41E3A] text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#C41E3A] cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm câu thủ công</span>
                    </button>
                  </div>
                ) : (
                  <div ref={teacherQuestionsListRef} className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {sections[activeSectionTab].questions.map((q, qIndex) => {
                      const isNeedsReview = Boolean(q.needsReview);

                      return (
                        <div
                          key={qIndex}
                          className={`p-3.5 rounded-2xl border transition-all space-y-2 text-xs ${
                            isNeedsReview
                              ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-400/50'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-[#C41E3A]/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Question Number */}
                            <div className="w-16">
                              <label className="block text-[10px] font-bold text-slate-500">Số câu</label>
                              <input
                                type="number"
                                value={q.question_number}
                                onChange={(e) => {
                                  const updated = [...sections];
                                  updated[activeSectionTab].questions[qIndex].question_number = Number(
                                    e.target.value
                                  );
                                  setSections(updated);
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white dark:bg-white/5 font-bold text-center"
                              />
                            </div>

                            {/* Question Type */}
                            <div className="w-40">
                              <label className="block text-[10px] font-bold text-slate-500">
                                Dạng câu hỏi
                              </label>
                              <select
                                value={q.question_type}
                                onChange={(e) => {
                                  const updated = [...sections];
                                  const newType = e.target.value as QuestionType;
                                  updated[activeSectionTab].questions[qIndex].question_type = newType;
                                  if (newType === 'TRUE_FALSE') {
                                    updated[activeSectionTab].questions[qIndex].options = ['✓', '✗'];
                                    updated[activeSectionTab].questions[qIndex].correct_answer = 'TRUE';
                                  } else if (newType === 'MCQ_ABC') {
                                    updated[activeSectionTab].questions[qIndex].options = ['A', 'B', 'C'];
                                    updated[activeSectionTab].questions[qIndex].correct_answer = 'A';
                                  } else if (newType === 'MCQ_ABCDEF') {
                                    updated[activeSectionTab].questions[qIndex].options = [
                                      'A',
                                      'B',
                                      'C',
                                      'D',
                                      'E',
                                      'F',
                                    ];
                                    updated[activeSectionTab].questions[qIndex].correct_answer = 'A';
                                  } else if (newType === 'MCQ_ABCD') {
                                    updated[activeSectionTab].questions[qIndex].options = [
                                      'A',
                                      'B',
                                      'C',
                                      'D',
                                    ];
                                    updated[activeSectionTab].questions[qIndex].correct_answer = 'A';
                                  }
                                  setSections(updated);
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white dark:bg-white/5 font-semibold text-[11px]"
                              >
                                <option value="MCQ_ABCD">A / B / C / D</option>
                                <option value="MCQ_ABC">A / B / C (3 lựa chọn)</option>
                                <option value="TRUE_FALSE">Đúng / Sai (✓ / ✗)</option>
                                <option value="MCQ_ABCDEF">Ghép A – F</option>
                                <option value="WRITING_FILL">Viết điền từ</option>
                                <option value="WRITING_ESSAY">Viết câu / đoạn</option>
                              </select>
                            </div>

                            {/* Correct Answer */}
                            <div className="flex-1 min-w-[160px]">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-bold text-slate-500">
                                  Đáp án đúng * (Click chọn nhanh)
                                </label>
                                {isNeedsReview && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Cần kiểm tra lại</span>
                                  </span>
                                )}
                              </div>

                              {q.question_type === 'TRUE_FALSE' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      updated[activeSectionTab].questions[qIndex].correct_answer = 'TRUE';
                                      updated[activeSectionTab].questions[qIndex].needsReview = false;
                                      setSections(updated);
                                    }}
                                    className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                                      q.correct_answer === 'TRUE'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-500'
                                    }`}
                                  >
                                    ✓ Đúng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      updated[activeSectionTab].questions[qIndex].correct_answer = 'FALSE';
                                      updated[activeSectionTab].questions[qIndex].needsReview = false;
                                      setSections(updated);
                                    }}
                                    className={`px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                                      q.correct_answer === 'FALSE'
                                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-red-500'
                                    }`}
                                  >
                                    ✗ Sai
                                  </button>
                                </div>
                              ) : q.question_type === 'MCQ_ABC' ||
                                q.question_type === 'MCQ_ABCD' ||
                                q.question_type === 'MCQ_ABCDEF' ? (
                                <div className="flex items-center gap-1">
                                  {(
                                    q.options ||
                                    (q.question_type === 'MCQ_ABC'
                                      ? ['A', 'B', 'C']
                                      : q.question_type === 'MCQ_ABCDEF'
                                        ? ['A', 'B', 'C', 'D', 'E', 'F']
                                        : ['A', 'B', 'C', 'D'])
                                  ).map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...sections];
                                        updated[activeSectionTab].questions[qIndex].correct_answer = opt;
                                        updated[activeSectionTab].questions[qIndex].needsReview = false;
                                        setSections(updated);
                                      }}
                                      className={`w-7 h-7 rounded-lg font-bold border flex items-center justify-center transition-all cursor-pointer ${
                                        q.correct_answer === opt
                                          ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-xs'
                                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={q.correct_answer || ''}
                                  onChange={(e) => {
                                    const updated = [...sections];
                                    updated[activeSectionTab].questions[qIndex].correct_answer =
                                      e.target.value;
                                    setSections(updated);
                                  }}
                                  placeholder="VD: 苹果 | 苹果汁"
                                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white dark:bg-white/5 font-medium"
                                />
                              )}
                            </div>

                            {/* Points */}
                            <div className="w-20">
                              <label className="block text-[10px] font-bold text-slate-500">Điểm</label>
                              <input
                                type="number"
                                step={0.5}
                                value={q.points}
                                onChange={(e) => {
                                  const updated = [...sections];
                                  updated[activeSectionTab].questions[qIndex].points = Number(
                                    e.target.value
                                  );
                                  setSections(updated);
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white dark:bg-white/5 font-bold text-center text-[#C41E3A]"
                              />
                            </div>

                            {/* Delete Question */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...sections];
                                updated[activeSectionTab].questions.splice(qIndex, 1);
                                setSections(updated);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer self-end mb-0.5"
                              title="Xóa câu này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Review reason warning if detected */}
                          {isNeedsReview && (
                            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5 bg-amber-100/70 dark:bg-amber-900/40 p-2 rounded-lg">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{q.reviewReason || 'Ký hiệu đáp án bị mờ/mất font trong PDF gốc.'}</span>
                            </div>
                          )}

                          {/* Optional Explanation Field */}
                          <div className="pt-1">
                            <input
                              type="text"
                              value={q.explanation || ''}
                              onChange={(e) => {
                                const updated = [...sections];
                                updated[activeSectionTab].questions[qIndex].explanation = e.target.value;
                                setSections(updated);
                              }}
                              placeholder="Giải thích / transcript đáp án cho câu này (hiển thị khi học viên xem kết quả)..."
                              className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-300 outline-none focus:border-[#C41E3A]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── THANH ĐIỀU HƯỚNG LÙI LẠI / CHUYỂN TIẾP PHẦN THI ─────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                  {activeSectionTab > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleSwitchTeacherSection(activeSectionTab - 1)}
                      className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>← Lùi lại: {sections[activeSectionTab - 1]?.title}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">
                      Đang ở phần đầu tiên
                    </span>
                  )}

                  {activeSectionTab < sections.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => handleSwitchTeacherSection(activeSectionTab + 1)}
                      className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
                    >
                      <span>Tiếp theo: {sections[activeSectionTab + 1]?.title} →</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (teacherQuestionsListRef.current) {
                          teacherQuestionsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
                    >
                      <span>↑ Lên đầu trang</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Existing Exams Table */}
      <div
        ref={examListRef}
        className="p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 scroll-mt-6"
      >
        <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Danh sách đề thi đã tạo ({exams.length} đề)</span>
          <button
            type="button"
            onClick={() => fetchExams()}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 text-xs font-bold text-slate-600 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tải danh sách đề thi...</div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Chưa có đề thi nào trong hệ thống.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3">Mã đề</th>
                  <th className="px-4 py-3">Cấp độ</th>
                  <th className="px-4 py-3">Tiêu đề</th>
                  <th className="px-4 py-3 text-center">Thời gian</th>
                  <th className="px-4 py-3 text-center">Câu hỏi</th>
                  <th className="px-4 py-3 text-center">Tổng điểm</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right min-w-[280px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#C41E3A]">{ex.code}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        {ex.hsk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{ex.title}</td>
                    <td className="px-4 py-3 text-center">{ex.duration_minutes}p</td>
                    <td className="px-4 py-3 text-center font-bold">{ex.questions_count || 40} câu</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">{ex.total_score}đ</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          ex.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
                        }`}
                      >
                        {ex.status === 'PUBLISHED' ? 'Đã xuất bản (PUBLISHED)' : 'Bản nháp (DRAFT)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right min-w-[280px]">
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        {/* 0. Nút Xuất bản nhanh cho đề DRAFT */}
                        {ex.status === 'DRAFT' && (
                          <button
                            type="button"
                            disabled={publishingExamId === ex.id}
                            onClick={() => handleQuickPublish({ id: ex.id, code: ex.code })}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50 dark:hover:bg-emerald-600 dark:hover:text-white disabled:opacity-50"
                            title="Xuất bản đề thi để học viên có thể vào thi"
                          >
                            {publishingExamId === ex.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Xuất bản</span>
                          </button>
                        )}

                        {/* 1. Nút Xem Demo */}
                        <button
                          type="button"
                          onClick={() => handleOpenDemoFromTable(ex.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white hover:border-sky-600 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50 dark:hover:bg-sky-600 dark:hover:text-white"
                          title="Mở chế độ Xem Demo tương tác & chấm thử đề thi này"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem Demo</span>
                        </button>

                        {/* 2. Nút Sửa (Chỉnh sửa đề) */}
                        <button
                          type="button"
                          onClick={() => handleEditExam(ex.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-amber-500 dark:hover:text-white"
                          title="Chỉnh sửa thông tin và câu hỏi đề thi"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        {/* 3. Nút Xóa (Xóa đề thi) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteExam({ id: ex.id, code: ex.code, title: ex.title })}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50 dark:hover:bg-rose-600 dark:hover:text-white"
                          title="Xóa vĩnh viễn đề thi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-4xl h-[85vh] rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C41E3A]" />
                <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                  {previewPdfTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolveMediaUrl(previewPdfUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                  title="Mở tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full bg-slate-100 dark:bg-black relative">
              <iframe
                src={resolveMediaUrl(previewPdfUrl)}
                title="Xem trước PDF"
                className="w-full h-full border-0 absolute inset-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Exam Modal */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 border border-red-100 dark:border-red-900/40 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                Xác nhận xóa đề thi?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bạn đang chuẩn bị xóa vĩnh viễn đề thi sau khỏi hệ thống:
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3.5 border border-slate-200/60 dark:border-white/5 text-left space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono font-bold text-xs shrink-0">
                  {examToDelete.code}
                </span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {examToDelete.title}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <b>Cảnh báo:</b> Hành động này sẽ xóa toàn bộ nội dung đề thi, các câu hỏi và <b>toàn bộ lịch sử làm bài (attempts)</b> của học viên liên quan. Thao tác này không thể hoàn tác.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setExamToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteExam}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MÀN HÌNH XEM DEMO TƯƠNG TÁC (FULL-SCREEN OVERLAY) ─────────────── */}
      {isDemoOpen && (isDemoFromForm ? liveFormDemoData : tableDemoExamData) && (
        <div className="!m-0 !mt-0 fixed inset-0 z-50 w-screen h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#0B0F17]">
          <StudentExamSplitScreen
            demoMode={true}
            demoExamData={(isDemoFromForm ? liveFormDemoData : tableDemoExamData)!}
            onBack={handleCloseDemoPreview}
            onDemoUpdateMeta={handleDemoUpdateMeta}
            onDemoUpdateSections={handleDemoUpdateSections}
            onDemoSaveDraft={
              isDemoFromForm
                ? () => handleSaveExam('DRAFT')
                : () => handleSaveTableDemoExam('DRAFT')
            }
            demoNotice={demoNotice}
            onDemoPublish={
              isDemoFromForm
                ? () => handleSaveExam('PUBLISHED')
                : () => handleSaveTableDemoExam('PUBLISHED')
            }
            isPublishingDemo={saving || publishingExamId !== null}
          />
        </div>
      )}
    </div>
  );
};

export default TeacherExamManager;
