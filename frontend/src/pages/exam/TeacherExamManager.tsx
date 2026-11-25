import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  FileText,
  Headphones,
  Upload,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Layers,
  Sparkles,
  Eye,
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
  X,
  Volume2,
} from 'lucide-react';

interface QuestionConfig {
  id?: number;
  question_number: number;
  question_type: 'MCQ_ABCD' | 'TRUE_FALSE' | 'MCQ_ABCDEF' | 'WRITING_FILL' | 'WRITING_ESSAY';
  prompt_text?: string;
  options?: string[];
  correct_answer?: string;
  sample_answer?: string;
  points: number;
  explanation?: string;
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

  // File URLs
  const [examPdfUrl, setExamPdfUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [answerPdfUrl, setAnswerPdfUrl] = useState('');

  // Uploading state
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingAnswerPdf, setUploadingAnswerPdf] = useState(false);

  // Preview modal state
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Batch Generator State
  const [batchMode, setBatchMode] = useState<'range' | 'count'>('range');
  const [batchFromQuestion, setBatchFromQuestion] = useState<number>(1);
  const [batchToQuestion, setBatchToQuestion] = useState<number>(20);
  const [batchCount, setBatchCount] = useState<number>(10);
  const [batchType, setBatchType] = useState<
    'MCQ_ABCD' | 'TRUE_FALSE' | 'MCQ_ABCDEF' | 'WRITING_FILL' | 'WRITING_ESSAY'
  >('MCQ_ABCD');
  const [batchPoints, setBatchPoints] = useState<number>(2.5);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get<any[]>('/exams/admin/all');
      setExams(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách đề thi:', err);
      setMessage({ text: err.message || 'Không thể tải danh sách đề thi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Update batch from question when switching sections
  useEffect(() => {
    const currentSec = sections[activeSectionTab];
    if (currentSec && currentSec.questions.length > 0) {
      const maxInSec = Math.max(...currentSec.questions.map((q) => q.question_number));
      setBatchFromQuestion(maxInSec + 1);
      setBatchToQuestion(maxInSec + 10);
    } else {
      let maxOverall = 0;
      for (const s of sections) {
        for (const q of s.questions) {
          if (q.question_number > maxOverall) maxOverall = q.question_number;
        }
      }
      setBatchFromQuestion(maxOverall + 1);
      setBatchToQuestion(maxOverall + 10);
    }
  }, [activeSectionTab, sections.length]);

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

  // Upload file helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'exam_pdf' | 'audio' | 'answer_pdf'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    try {
      if (type === 'exam_pdf') setUploadingPdf(true);
      if (type === 'audio') setUploadingAudio(true);
      if (type === 'answer_pdf') setUploadingAnswerPdf(true);

      const res = await api.upload<any>('/exams/upload', formData);
      if (res && res.urls) {
        const uploadedUrl = res.urls[type] || res.urls['file'] || '';
        if (type === 'exam_pdf') setExamPdfUrl(uploadedUrl);
        if (type === 'audio') setAudioUrl(uploadedUrl);
        if (type === 'answer_pdf') setAnswerPdfUrl(uploadedUrl);
        setMessage({ text: `Tải lên file "${file.name}" thành công!`, type: 'success' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi khi tải file lên máy chủ.', type: 'error' });
    } finally {
      if (type === 'exam_pdf') setUploadingPdf(false);
      if (type === 'audio') setUploadingAudio(false);
      if (type === 'answer_pdf') setUploadingAnswerPdf(false);
    }
  };

  // Tạo nhanh hàng loạt câu hỏi cho phần đang chọn
  const handleBatchGenerate = () => {
    const currentSec = sections[activeSectionTab];
    if (!currentSec) return;

    let startNum = 1;
    let endNum = 1;

    if (batchMode === 'range') {
      startNum = Math.min(batchFromQuestion, batchToQuestion);
      endNum = Math.max(batchFromQuestion, batchToQuestion);
    } else {
      let maxNum = 0;
      for (const sec of sections) {
        for (const q of sec.questions) {
          if (q.question_number > maxNum) maxNum = q.question_number;
        }
      }
      startNum = maxNum + 1;
      endNum = maxNum + batchCount;
    }

    const newQuestions: QuestionConfig[] = [];
    for (let qNum = startNum; qNum <= endNum; qNum++) {
      let defaultOptions: string[] = ['A', 'B', 'C', 'D'];
      let defaultAns = 'A';

      if (batchType === 'TRUE_FALSE') {
        defaultOptions = ['✓', '✗'];
        defaultAns = 'TRUE';
      } else if (batchType === 'MCQ_ABCDEF') {
        defaultOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
        defaultAns = 'A';
      } else if (batchType === 'WRITING_FILL' || batchType === 'WRITING_ESSAY') {
        defaultOptions = [];
        defaultAns = '';
      }

      newQuestions.push({
        question_number: qNum,
        question_type: batchType,
        prompt_text: `Câu ${qNum}`,
        options: defaultOptions,
        correct_answer: defaultAns,
        points: batchPoints,
      });
    }

    const updatedSections = [...sections];
    // Loại bỏ các câu đã có trùng question_number trong section này để tránh duplicate
    const existingNumbers = new Set(newQuestions.map((q) => q.question_number));
    const keptQuestions = updatedSections[activeSectionTab].questions.filter(
      (q) => !existingNumbers.has(q.question_number)
    );

    const merged = [...keptQuestions, ...newQuestions].sort(
      (a, b) => a.question_number - b.question_number
    );

    updatedSections[activeSectionTab].questions = merged;
    setSections(updatedSections);

    setMessage({
      text: `Đã tự động thêm nhanh các câu ${startNum} → ${endNum} (${batchType}, ${batchPoints}đ/câu) vào "${currentSec.title}"!`,
      type: 'success',
    });
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

  // Lưu đề thi vào database
  const handleSaveExam = async () => {
    if (!code.trim()) {
      setMessage({ text: 'Vui lòng nhập Mã đề thi (VD: H11332).', type: 'error' });
      return;
    }
    if (!title.trim()) {
      setMessage({ text: 'Vui lòng nhập Tiêu đề đề thi.', type: 'error' });
      return;
    }
    if (!examPdfUrl.trim()) {
      setMessage({ text: 'Vui lòng tải lên File đề PDF.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        hsk_level: hskLevel,
        exam_pdf_url: examPdfUrl.trim(),
        audio_url: audioUrl.trim() || undefined,
        answer_pdf_url: answerPdfUrl.trim() || undefined,
        duration_minutes: Number(durationMinutes) || 35,
        total_score: totalCalculatedScore > 0 ? totalCalculatedScore : 100,
        pass_score: Number(passScore) || 60,
        status,
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

      if (editingExamId) {
        await api.put(`/exams/${editingExamId}`, payload);
        setMessage({ text: 'Cập nhật đề thi thành công!', type: 'success' });
      } else {
        await api.post('/exams', payload);
        setMessage({ text: 'Tạo đề thi mới thành công!', type: 'success' });
      }

      await fetchExams();
      handleResetForm();
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi khi lưu đề thi.', type: 'error' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(err.message || 'Không thể tải đề thi.');
    } finally {
      setLoading(false);
    }
  };

  // Xóa đề thi
  const handleDeleteExam = async (examId: number, examCode: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đề thi ${examCode}? Toàn bộ bài làm của đề này cũng sẽ bị xóa.`)) {
      return;
    }
    try {
      await api.delete(`/exams/${examId}`);
      setMessage({ text: `Đã xóa đề thi ${examCode} thành công.`, type: 'success' });
      await fetchExams();
      if (editingExamId === examId) {
        handleResetForm();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa đề thi.');
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

        <div className="flex items-center gap-3">
          {editingExamId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              Tạo đề mới
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveExam}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C41E3A] hover:bg-[#A81830] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{editingExamId ? 'Lưu cập nhật đề thi' : 'Tạo & Xuất bản đề thi'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General Info & File Uploads */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
            <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#C41E3A]" />
              <span>1. Thông tin chung đề thi</span>
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
                    placeholder="VD: H11332"
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
                  placeholder="VD: Đề thi thử HSK 1 - Mã H11332"
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
                  placeholder="VD: Đề gồm 40 câu hỏi (20 câu Nghe, 20 câu Đọc), thời gian 35 phút..."
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

          {/* Upload Files Box */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
            <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#C41E3A]" />
              <span>2. Bộ File Đề Thi & Audio</span>
            </h2>

            {/* 1. File Đề PDF */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <FileText className="w-4 h-4" />
                  1. File Đề PDF chính *
                </span>
                {examPdfUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓ Đã có file</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPdfUrl(examPdfUrl);
                        setPreviewPdfTitle('Xem trước File Đề Thi PDF');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C41E3A] hover:underline cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước PDF</span>
                    </button>
                  </div>
                ) : null}
              </div>

              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'exam_pdf')}
                disabled={uploadingPdf}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#C41E3A] file:text-white hover:file:bg-[#A81830] cursor-pointer"
              />
              <input
                type="text"
                value={examPdfUrl}
                onChange={(e) => setExamPdfUrl(e.target.value)}
                placeholder="Hoặc dán URL: /uploads/exams/H11332.pdf"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none font-mono"
              />
            </div>

            {/* 2. File Nghe Audio MP3 */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Headphones className="w-4 h-4" />
                  2. File Nghe Audio MP3 (Tùy chọn)
                </span>
                {audioUrl && <span className="text-emerald-600 font-bold">✓ Đã có file</span>}
              </div>

              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav"
                onChange={(e) => handleFileUpload(e, 'audio')}
                disabled={uploadingAudio}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              <input
                type="text"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="Hoặc dán URL: /uploads/exams/H11332.mp3"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none font-mono"
              />

              {/* Nghe thử Audio ngay sau khi tải */}
              {audioUrl && (
                <div className="mt-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Trình nghe thử Audio đề thi:</span>
                    </span>
                    <button
                      type="button"
                      onClick={togglePlayAudioPreview}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {isPreviewAudioPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                      <span>{isPreviewAudioPlaying ? 'Dừng phát' : 'Nghe thử'}</span>
                    </button>
                  </div>
                  <audio
                    ref={audioPreviewRef}
                    src={audioUrl}
                    controls
                    onEnded={() => setIsPreviewAudioPlaying(false)}
                    onPause={() => setIsPreviewAudioPlaying(false)}
                    onPlay={() => setIsPreviewAudioPlaying(true)}
                    className="w-full h-8"
                  />
                </div>
              )}
            </div>

            {/* 3. File Đáp Án PDF */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-4 h-4" />
                  3. File Đáp Án & Transcript PDF (Tùy chọn)
                </span>
                {answerPdfUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">✓ Đã có file</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPdfUrl(answerPdfUrl);
                        setPreviewPdfTitle('Xem trước File Đáp Án & Transcript PDF');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước PDF</span>
                    </button>
                  </div>
                ) : null}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Chỉ hiển thị và tự động mở khóa cho học viên sau khi hoàn tất nộp bài thi.
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'answer_pdf')}
                disabled={uploadingAnswerPdf}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
              <input
                type="text"
                value={answerPdfUrl}
                onChange={(e) => setAnswerPdfUrl(e.target.value)}
                placeholder="Hoặc dán URL: /uploads/exams/H11332_answer.pdf"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 outline-none font-mono"
              />
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
                    3. Cấu hình Phiếu Trả Lời & Thang Điểm
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
                    onClick={() => setActiveSectionTab(idx)}
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

            {/* Quick Bulk Generator Tool */}
            {sections[activeSectionTab] && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-900/50 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Bộ tạo nhanh hàng loạt vào "{sections[activeSectionTab].title}"</span>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBatchMode('range')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        batchMode === 'range'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/60 text-amber-800 hover:bg-white'
                      }`}
                    >
                      Từ câu X đến câu Y
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchMode('count')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        batchMode === 'count'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/60 text-amber-800 hover:bg-white'
                      }`}
                    >
                      Theo số lượng
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  {batchMode === 'range' ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Từ câu số:
                        </label>
                        <input
                          type="number"
                          value={batchFromQuestion}
                          onChange={(e) => setBatchFromQuestion(Math.max(1, Number(e.target.value)))}
                          min={1}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-white/5 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Đến câu số:
                        </label>
                        <input
                          type="number"
                          value={batchToQuestion}
                          onChange={(e) => setBatchToQuestion(Math.max(1, Number(e.target.value)))}
                          min={1}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-white/5 font-bold"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Số lượng câu cần thêm:
                      </label>
                      <input
                        type="number"
                        value={batchCount}
                        onChange={(e) => setBatchCount(Math.max(1, Number(e.target.value)))}
                        min={1}
                        max={60}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-white/5 font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Dạng câu hỏi:
                    </label>
                    <select
                      value={batchType}
                      onChange={(e) => setBatchType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-white/5 font-bold"
                    >
                      <option value="MCQ_ABCD">Trắc nghiệm A/B/C/D</option>
                      <option value="TRUE_FALSE">Đúng / Sai (✓ / ✗)</option>
                      <option value="MCQ_ABCDEF">Ghép tranh A–F</option>
                      <option value="WRITING_FILL">Viết điền từ / sắp xếp</option>
                      <option value="WRITING_ESSAY">Viết câu / đoạn văn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Điểm mỗi câu:
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      value={batchPoints}
                      onChange={(e) => setBatchPoints(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-white/5 font-bold"
                    />
                  </div>

                  <div className="flex items-end col-span-2 sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleBatchGenerate}
                      className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                    >
                      {batchMode === 'range'
                        ? `+ Tạo ${Math.max(0, batchToQuestion - batchFromQuestion + 1)} câu`
                        : `+ Tạo ${batchCount} câu`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Table */}
            {sections[activeSectionTab] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Danh sách câu hỏi của <b>{sections[activeSectionTab].title}</b> (
                    {sections[activeSectionTab].questions.length} câu)
                  </span>
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
                        question_number: nextNum,
                        question_type: 'MCQ_ABCD',
                        prompt_text: `Câu ${nextNum}`,
                        options: ['A', 'B', 'C', 'D'],
                        correct_answer: 'A',
                        points: 2.5,
                      });
                      setSections(updated);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-[#C41E3A] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm 1 câu lẻ</span>
                  </button>
                </div>

                {sections[activeSectionTab].questions.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 text-sm space-y-2">
                    <p>Phần này chưa có câu hỏi nào.</p>
                    <p className="text-xs text-slate-500">
                      Sử dụng công cụ "Bộ tạo nhanh" ở trên để sinh hàng loạt câu hỏi trong vài giây!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {sections[activeSectionTab].questions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-[#C41E3A]/40 transition-all space-y-2 text-xs"
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
                          <div className="w-36">
                            <label className="block text-[10px] font-bold text-slate-500">
                              Dạng câu hỏi
                            </label>
                            <select
                              value={q.question_type}
                              onChange={(e) => {
                                const updated = [...sections];
                                const newType = e.target.value as any;
                                updated[activeSectionTab].questions[qIndex].question_type = newType;
                                if (newType === 'TRUE_FALSE') {
                                  updated[activeSectionTab].questions[qIndex].options = ['✓', '✗'];
                                  updated[activeSectionTab].questions[qIndex].correct_answer = 'TRUE';
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
                              <option value="TRUE_FALSE">Đúng / Sai (✓ / ✗)</option>
                              <option value="MCQ_ABCDEF">Ghép A – F</option>
                              <option value="WRITING_FILL">Viết điền từ</option>
                              <option value="WRITING_ESSAY">Viết câu / đoạn</option>
                            </select>
                          </div>

                          {/* Correct Answer */}
                          <div className="flex-1 min-w-[160px]">
                            <label className="block text-[10px] font-bold text-slate-500">
                              Đáp án đúng * (Click chọn nhanh hoặc nhập)
                            </label>
                            {q.question_type === 'TRUE_FALSE' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...sections];
                                    updated[activeSectionTab].questions[qIndex].correct_answer = 'TRUE';
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
                            ) : q.question_type === 'MCQ_ABCD' || q.question_type === 'MCQ_ABCDEF' ? (
                              <div className="flex items-center gap-1">
                                {(q.options || ['A', 'B', 'C', 'D']).map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      updated[activeSectionTab].questions[qIndex].correct_answer = opt;
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
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Existing Exams Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
        <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Danh sách đề thi đã tạo ({exams.length} đề)</span>
          <button
            type="button"
            onClick={fetchExams}
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
                  <th className="px-4 py-3 text-right">Thao tác</th>
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
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          ex.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <a
                        href={`#/mock-exam/${ex.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Thi thử</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleEditExam(ex.id)}
                        className="text-xs font-bold text-[#C41E3A] hover:underline cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(ex.id, ex.code)}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Xóa
                      </button>
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
                  href={previewPdfUrl}
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
                src={previewPdfUrl}
                title="Xem trước PDF"
                className="w-full h-full border-0 absolute inset-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExamManager;
