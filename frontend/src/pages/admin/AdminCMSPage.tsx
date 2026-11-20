import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { invalidateCache } from '../../lib/cache';
import { appConfirm, appNotice } from '../../lib/dialog';
import { useAuth } from '../../context/AuthContext';
import {
  GlassCard,
  SpotlightCard,
  ShimmerButton,
  NumberTicker,
} from '../../components/ui';
import {
  Shield,
  BookOpen,
  FileQuestion,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  Users,
  Activity,
  Search,
  Lock,
  UserCheck,
  Pencil,
  Layers,
  Sliders,
  X,
  Save,
  Eye,
  ArrowLeft,
  Sparkles,
  FileText,
} from 'lucide-react';

interface OptionItem {
  id: string;
  text: string;
}

const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];
const SKILL_CATEGORIES = ['READING', 'LISTENING', 'GRAMMAR', 'VOCABULARY', 'PINYIN', 'TONE', 'WRITING'];
const BLOCK_TYPES = ['THEORY', 'AUDIO', 'PINYIN', 'HANZI', 'VOCABULARY', 'EXAMPLE'] as const;

const LEVEL_BADGE: Record<string, string> = {
  HSK1: 'from-emerald-500 to-teal-500',
  HSK2: 'from-sky-500 to-blue-600',
  HSK3: 'from-amber-500 to-orange-500',
  HSK4: 'from-rose-500 to-primary-600',
  HSK5: 'from-violet-600 to-purple-600',
  HSK6: 'from-fuchsia-600 to-amber-500',
};

function parseOptionsForEditor(raw: string): OptionItem[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return ['A', 'B', 'C', 'D'].map((letter, idx) => {
        const item = parsed[idx];
        if (!item) return { id: letter, text: '' };
        if (typeof item === 'string') {
          return { id: letter, text: item.replace(/^[A-Da-d][\.\:\)\s]+/, '') };
        }
        return { id: item.id || letter, text: item.text || '' };
      });
    }
  } catch {
    // fallback
  }
  return [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ];
}

export const AdminCMSPage: React.FC<{ initialTab?: 'courses' | 'questions' | 'rbac' }> = ({
  initialTab = 'courses',
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN';

  const [tab, setTab] = useState<'courses' | 'questions' | 'rbac'>(initialTab);
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Core data states
  const [courses, setCourses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionLevelFilter, setQuestionLevelFilter] = useState<string>('ALL');
  const [questionSearch, setQuestionSearch] = useState('');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [userSummary, setUserSummary] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Course Create / Edit Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    code: '',
    level: 'HSK1',
    description: '',
    is_published: true,
  });

  // ── LESSON INTERVENTION STUDIO STATE ──
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<any | null>(null);
  const [courseDetailTree, setCourseDetailTree] = useState<any | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonDetail, setLessonDetail] = useState<any | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);

  // Inline Chapter / Lesson / Block Forms
  const [chapterForm, setChapterForm] = useState<{ id?: number; title: string; order_index: number } | null>(null);
  const [lessonForm, setLessonForm] = useState<{
    id?: number;
    chapter_id: number;
    title: string;
    order_index: number;
    estimated_duration_mins: number;
    status: 'DRAFT' | 'PUBLISHED';
  } | null>(null);
  const [blockForm, setBlockForm] = useState<{
    id?: number;
    block_type: (typeof BLOCK_TYPES)[number];
    order_index: number;
    title: string;
    summary: string;
    pointsText: string;
    rawJson: string;
    useRawJson: boolean;
  } | null>(null);

  // Question Create / Edit Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correct_answer: 'A',
    explanation: '',
  });

  const showToast = (msg: string) => {
    invalidateCache();
    appNotice(msg, 'success');
  };

  useEffect(() => {
    loadData();
  }, [tab, adminRoleFilter, questionLevelFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (tab === 'courses') {
        const data = await api.get<any[]>('/curriculum/courses');
        setCourses(data || []);
      } else if (tab === 'questions') {
        const data = await api.get<any[]>('/assessment/questions', {
          params: {
            difficulty_level: questionLevelFilter === 'ALL' ? undefined : questionLevelFilter,
            search: questionSearch.trim() || undefined,
            limit: 100,
          },
        });
        setQuestions(data || []);
      } else if (tab === 'rbac' && isSuperAdmin) {
        const [usersData, logsData] = await Promise.all([
          api.get<any>('/users/admin/all', {
            params: {
              search: adminSearch || undefined,
              role: adminRoleFilter || undefined,
              limit: 40,
            },
          }),
          api.get<any[]>('/users/admin/audit-logs', { params: { limit: 20 } }),
        ]);
        setAdminUsers(usersData?.users || []);
        if (usersData?.summary) setUserSummary(usersData.summary);
        setAuditLogs(logsData || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── COURSE CRUD ───────────────────────────────────────────────────────
  const openCreateCourse = () => {
    setEditingCourseId(null);
    setCourseForm({ title: '', code: '', level: 'HSK1', description: '', is_published: true });
    setShowCourseModal(true);
  };

  const openEditCourse = (c: any) => {
    setEditingCourseId(c.courseId ?? c.course_id);
    setCourseForm({
      title: c.title || '',
      code: c.code || '',
      level: (c.level || 'HSK1').toUpperCase(),
      description: c.description || '',
      is_published: Boolean(c.isPublished ?? c.is_published),
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await api.put(`/curriculum/courses/${editingCourseId}`, courseForm);
        showToast('Đã cập nhật thông tin khóa học.');
      } else {
        await api.post('/curriculum/courses', courseForm);
        showToast('Đã tạo khóa học mới.');
      }
      setShowCourseModal(false);
      loadData();
    } catch (err: any) {
      appNotice(err.message || 'Lỗi lưu khóa học.', 'error');
    }
  };

  const handleDeleteCourse = async (courseId: number, title: string) => {
    const ok = await appConfirm({
      title: 'Xóa khóa học?',
      message: `Bạn có chắc muốn xóa khóa học "${title}" cùng toàn bộ chương và bài học bên trong?`,
      confirmLabel: 'Xóa khóa học',
      cancelLabel: 'Quay lại',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/curriculum/courses/${courseId}`);
      showToast('Đã xóa khóa học.');
      loadData();
    } catch (err: any) {
      appNotice(err.message || 'Lỗi xóa khóa học.', 'error');
    }
  };

  const handleTogglePublishCourse = async (courseId: number) => {
    try {
      const res = await api.post<any>(`/curriculum/courses/${courseId}/publish`);
      setCourses((prev) =>
        prev.map((c) => {
          const id = c.courseId ?? c.course_id;
          if (id === courseId) {
            const nextPublished = res?.isPublished ?? !(c.isPublished ?? c.is_published);
            return { ...c, isPublished: nextPublished, is_published: nextPublished };
          }
          return c;
        })
      );
      showToast(res?.message || 'Đã cập nhật trạng thái xuất bản.');
    } catch (err: any) {
      appNotice(err.message || 'Lỗi cập nhật trạng thái.', 'error');
    }
  };

  // ─── LESSON & CONTENT BLOCK INTERVENTION STUDIO ────────────────────────
  const openCourseStudio = async (course: any) => {
    setSelectedCourseForEdit(course);
    setSelectedLessonId(null);
    setLessonDetail(null);
    await refreshCourseTree(course.courseId ?? course.course_id);
  };

  const refreshCourseTree = async (courseId: number) => {
    setLoadingTree(true);
    try {
      const detail = await api.get<any>(`/curriculum/courses/${courseId}`);
      setCourseDetailTree(detail);
    } catch (err: any) {
      appNotice(err.message || 'Không thể tải cấu trúc bài giảng.', 'error');
    } finally {
      setLoadingTree(false);
    }
  };

  const loadLessonForIntervention = async (lessonId: number) => {
    setSelectedLessonId(lessonId);
    setLoadingLesson(true);
    try {
      const detail = await api.get<any>(`/curriculum/lessons/${lessonId}`);
      setLessonDetail(detail);
    } catch (err: any) {
      appNotice(err.message || 'Không thể tải chi tiết bài học.', 'error');
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm || !selectedCourseForEdit) return;
    const courseId = selectedCourseForEdit.courseId ?? selectedCourseForEdit.course_id;
    try {
      if (chapterForm.id) {
        await api.put(`/curriculum/chapters/${chapterForm.id}`, {
          title: chapterForm.title,
          order_index: chapterForm.order_index,
        });
        showToast('Đã cập nhật chương học.');
      } else {
        await api.post('/curriculum/chapters', {
          course_id: courseId,
          title: chapterForm.title,
          order_index: chapterForm.order_index,
        });
        showToast('Đã thêm chương mới.');
      }
      setChapterForm(null);
      await refreshCourseTree(courseId);
    } catch (err: any) {
      appNotice(err.message || 'Lỗi lưu chương học.', 'error');
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    const ok = await appConfirm({
      title: 'Xóa chương học?',
      message: 'Xóa chương này sẽ xóa toàn bộ bài học bên trong. Bạn có chắc muốn tiếp tục?',
      confirmLabel: 'Xóa chương',
      cancelLabel: 'Quay lại',
      danger: true,
    });
    if (!ok) return;
    const courseId = selectedCourseForEdit.courseId ?? selectedCourseForEdit.course_id;
    try {
      await api.delete(`/curriculum/chapters/${chapterId}`);
      showToast('Đã xóa chương học.');
      await refreshCourseTree(courseId);
    } catch (err: any) {
      appNotice(err.message || 'Lỗi xóa chương học.', 'error');
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm || !selectedCourseForEdit) return;
    const courseId = selectedCourseForEdit.courseId ?? selectedCourseForEdit.course_id;
    try {
      if (lessonForm.id) {
        await api.put(`/curriculum/lessons/${lessonForm.id}`, {
          title: lessonForm.title,
          order_index: lessonForm.order_index,
          estimated_duration_mins: lessonForm.estimated_duration_mins,
          status: lessonForm.status,
        });
        showToast('Đã cập nhật thông tin bài học.');
        if (selectedLessonId === lessonForm.id) {
          await loadLessonForIntervention(lessonForm.id);
        }
      } else {
        const created = await api.post<any>('/curriculum/lessons', {
          chapter_id: lessonForm.chapter_id,
          title: lessonForm.title,
          order_index: lessonForm.order_index,
          estimated_duration_mins: lessonForm.estimated_duration_mins,
          status: lessonForm.status,
        });
        showToast('Đã tạo bài học mới.');
        const newId = created?.lessonId || created?.lesson_id;
        if (newId) await loadLessonForIntervention(newId);
      }
      setLessonForm(null);
      await refreshCourseTree(courseId);
    } catch (err: any) {
      appNotice(err.message || 'Lỗi lưu bài học.', 'error');
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    const ok = await appConfirm({
      title: 'Xóa bài học?',
      message: 'Bài học này và toàn bộ nội dung bên trong sẽ bị xóa vĩnh viễn.',
      confirmLabel: 'Xóa bài học',
      cancelLabel: 'Quay lại',
      danger: true,
    });
    if (!ok) return;
    const courseId = selectedCourseForEdit.courseId ?? selectedCourseForEdit.course_id;
    try {
      await api.delete(`/curriculum/lessons/${lessonId}`);
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setLessonDetail(null);
      }
      showToast('Đã xóa bài học.');
      await refreshCourseTree(courseId);
    } catch (err: any) {
      appNotice(err.message || 'Lỗi xóa bài học.', 'error');
    }
  };

  const openEditBlock = (block?: any) => {
    if (!block) {
      const nextOrder = (lessonDetail?.blocks?.length || 0) + 1;
      setBlockForm({
        block_type: 'THEORY',
        order_index: nextOrder,
        title: '',
        summary: '',
        pointsText: '',
        rawJson: JSON.stringify({ title: '', summary: '', points: [''] }, null, 2),
        useRawJson: false,
      });
      return;
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(block.contentJson || block.content_json || '{}');
    } catch {
      parsed = {};
    }

    const isSimpleTheory =
      (block.blockType || block.block_type) === 'THEORY' && !parsed.lines;

    setBlockForm({
      id: block.blockId ?? block.block_id,
      block_type: (block.blockType || block.block_type || 'THEORY') as any,
      order_index: block.orderIndex ?? block.order_index ?? 1,
      title: parsed.title || '',
      summary: parsed.summary || parsed.explanation || '',
      pointsText: Array.isArray(parsed.points) ? parsed.points.join('\n') : '',
      rawJson: JSON.stringify(parsed, null, 2),
      useRawJson: !isSimpleTheory,
    });
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm || !selectedLessonId) return;

    let contentJsonStr = '';
    if (blockForm.useRawJson) {
      try {
        JSON.parse(blockForm.rawJson);
        contentJsonStr = blockForm.rawJson;
      } catch {
        appNotice('Định dạng dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại dấu ngoặc và dấu phẩy.', 'error');
        return;
      }
    } else {
      contentJsonStr = JSON.stringify({
        title: blockForm.title.trim(),
        summary: blockForm.summary.trim(),
        points: blockForm.pointsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      });
    }

    try {
      if (blockForm.id) {
        await api.put(`/curriculum/lesson-blocks/${blockForm.id}`, {
          block_type: blockForm.block_type,
          order_index: blockForm.order_index,
          content_json: contentJsonStr,
        });
        showToast('Đã cập nhật nội dung bài học.');
      } else {
        await api.post('/curriculum/lesson-blocks', {
          lesson_id: selectedLessonId,
          block_type: blockForm.block_type,
          order_index: blockForm.order_index,
          content_json: contentJsonStr,
        });
        showToast('Đã thêm phần nội dung mới vào bài học.');
      }
      setBlockForm(null);
      await loadLessonForIntervention(selectedLessonId);
    } catch (err: any) {
      appNotice(err.message || 'Lỗi lưu nội dung bài học.', 'error');
    }
  };

  const handleDeleteBlock = async (blockId: number) => {
    const ok = await appConfirm({
      title: 'Xóa phần nội dung?',
      message: 'Phần nội dung này sẽ bị gỡ khỏi bài học hiện tại.',
      confirmLabel: 'Xóa',
      cancelLabel: 'Quay lại',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/curriculum/lesson-blocks/${blockId}`);
      showToast('Đã xóa phần nội dung.');
      if (selectedLessonId) await loadLessonForIntervention(selectedLessonId);
    } catch (err: any) {
      appNotice(err.message || 'Lỗi xóa nội dung.', 'error');
    }
  };

  // ─── QUESTION CRUD ─────────────────────────────────────────────────────
  const openCreateQuestion = () => {
    setEditingQuestionId(null);
    setQuestionForm({
      question_type: 'MULTIPLE_CHOICE',
      skill_category: 'READING',
      difficulty_level: 'HSK1',
      content: '',
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correct_answer: 'A',
      explanation: '',
    });
    setShowQuestionModal(true);
  };

  const openEditQuestion = (q: any) => {
    setEditingQuestionId(q.question_id);
    setQuestionForm({
      question_type: q.question_type || 'MULTIPLE_CHOICE',
      skill_category: q.skill_category || 'READING',
      difficulty_level: q.difficulty_level || 'HSK1',
      content: q.content || '',
      options: parseOptionsForEditor(q.options_json),
      correct_answer: q.correct_answer || 'A',
      explanation: q.explanation || '',
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      question_type: questionForm.question_type,
      skill_category: questionForm.skill_category,
      difficulty_level: questionForm.difficulty_level,
      content: questionForm.content,
      options_json: JSON.stringify(
        questionForm.options.map((o) => `${o.id}. ${o.text.trim()}`)
      ),
      correct_answer: questionForm.correct_answer,
      explanation: questionForm.explanation,
    };
    try {
      if (editingQuestionId) {
        await api.put(`/assessment/questions/${editingQuestionId}`, payload);
        showToast('Đã cập nhật câu hỏi.');
      } else {
        await api.post('/assessment/questions', payload);
        showToast('Đã thêm câu hỏi mới vào ngân hàng đề.');
      }
      setShowQuestionModal(false);
      loadData();
    } catch (err: any) {
      appNotice(err.message || 'Lỗi lưu câu hỏi.', 'error');
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    const ok = await appConfirm({
      title: 'Xóa câu hỏi?',
      message: 'Câu hỏi này sẽ bị xóa khỏi ngân hàng đề thi HSK.',
      confirmLabel: 'Xóa câu hỏi',
      cancelLabel: 'Quay lại',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/assessment/questions/${qId}`);
      setQuestions((prev) => prev.filter((q) => q.question_id !== qId));
      showToast('Đã xóa câu hỏi.');
    } catch (err: any) {
      appNotice(err.message || 'Lỗi xóa câu hỏi.', 'error');
    }
  };

  const handleAdminUpdateUser = async (
    targetUserId: number,
    updates: { role?: string; status?: string }
  ) => {
    try {
      await api.put(`/users/admin/${targetUserId}`, updates);
      showToast('Đã cập nhật quyền và trạng thái người dùng.');
      loadData();
    } catch (err: any) {
      appNotice(err.message || 'Lỗi cập nhật tài khoản.', 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: CURRICULUM & LESSON INTERVENTION STUDIO (WHEN COURSE SELECTED)
  // ═══════════════════════════════════════════════════════════════════════
  if (selectedCourseForEdit) {
    const chapters = courseDetailTree?.chapters || [];

    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* iPhone Optical Liquid Glass Studio Header */}
        <div className="relative overflow-hidden rounded-[28px] p-6 ios-hero-glass bg-gradient-to-r from-sky-200/32 via-white/18 to-rose-200/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCourseForEdit(null);
                setCourseDetailTree(null);
                setSelectedLessonId(null);
                setLessonDetail(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách khóa học</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-6 h-6 text-indigo-500" />
              <span>Chỉnh sửa bài giảng: {selectedCourseForEdit.title}</span>
            </h1>
            <p className="text-xs text-slate-600">
              Thêm / sửa / xóa Chương, Bài học và chỉnh sửa trực tiếp từng phần nội dung Ngữ pháp, Hội thoại, Pinyin.
            </p>
          </div>

          <ShimmerButton
            type="button"
            size="sm"
            onClick={() =>
              setChapterForm({ title: '', order_index: chapters.length + 1 })
            }
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm chương mới</span>
          </ShimmerButton>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Chapters & Lessons Tree */}
          <GlassCard className="lg:col-span-5 p-5 space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-600" />
              Cấu trúc Chương & Bài học ({chapters.length} chương)
            </h2>

            {loadingTree ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white/60 animate-pulse" />
                ))}
              </div>
            ) : chapters.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">
                Chưa có chương nào. Bấm “Thêm Chương (Unit)” để bắt đầu.
              </p>
            ) : (
              <div className="space-y-4">
                {chapters.map((ch: any) => (
                  <div
                    key={ch.chapterId}
                    className="rounded-2xl bg-white/80 border border-gray-200/80 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary-600">
                          Chương {ch.orderIndex}
                        </span>
                        <h3 className="text-sm font-extrabold text-gray-900">{ch.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setLessonForm({
                              chapter_id: ch.chapterId,
                              title: '',
                              order_index: (ch.lessons?.length || 0) + 1,
                              estimated_duration_mins: 15,
                              status: 'PUBLISHED',
                            })
                          }
                          title="Thêm bài học vào chương này"
                          className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setChapterForm({
                              id: ch.chapterId,
                              title: ch.title,
                              order_index: ch.orderIndex,
                            })
                          }
                          title="Sửa chương"
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(ch.chapterId)}
                          title="Xóa chương"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons list inside Chapter */}
                    <div className="space-y-1.5">
                      {(ch.lessons || []).map((l: any) => {
                        const isSel = selectedLessonId === l.lessonId;
                        return (
                          <div
                            key={l.lessonId}
                            onClick={() => loadLessonForIntervention(l.lessonId)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSel
                                ? 'bg-gradient-to-r from-primary-50 to-amber-50 border-primary-400 shadow-sm'
                                : 'bg-white border-gray-100 hover:border-primary-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-gray-900 truncate">
                                {l.orderIndex}. {l.title}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {l.estimatedDurationMins} phút • {l.blocksCount} khối nội dung •{' '}
                                <span
                                  className={
                                    (l.publishStatus || l.status) === 'DRAFT'
                                      ? 'text-amber-600 font-bold'
                                      : 'text-emerald-600 font-bold'
                                  }
                                >
                                  {(l.publishStatus || l.status) === 'DRAFT' ? 'Bản nháp' : 'Đã xuất bản'}
                                </span>
                              </p>
                            </div>
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setLessonForm({
                                    id: l.lessonId,
                                    chapter_id: ch.chapterId,
                                    title: l.title,
                                    order_index: l.orderIndex,
                                    estimated_duration_mins: l.estimatedDurationMins || 15,
                                    status:
                                      (l.publishStatus || l.status) === 'DRAFT'
                                        ? 'DRAFT'
                                        : 'PUBLISHED',
                                  })
                                }
                                title="Sửa bài học"
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(l.lessonId)}
                                title="Xóa bài học"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* RIGHT: Direct Lesson Content Blocks Editor */}
          <GlassCard className="lg:col-span-7 p-6 space-y-5">
            {!selectedLessonId ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 mx-auto flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-gray-900">
                  Chọn một bài học bên trái để can thiệp nội dung
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Admin có thể thêm, sửa hoặc xóa trực tiếp các khối Lý thuyết ngữ pháp, Hội thoại Audio, Pinyin và Chữ Hán trong từng bài học.
                </p>
              </div>
            ) : loadingLesson ? (
              <div className="h-48 rounded-2xl bg-white/60 animate-pulse" />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200/70">
                  <div>
                    <span className="text-[11px] font-black uppercase text-primary-600">
                      Đang can thiệp bài học #{lessonDetail?.lessonId}
                    </span>
                    <h2 className="text-lg font-black text-gray-900">{lessonDetail?.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`#/lessons/${selectedLessonId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-primary-600"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước</span>
                    </a>
                    <ShimmerButton
                      type="button"
                      size="sm"
                      onClick={() => openEditBlock(undefined)}
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm khối nội dung</span>
                    </ShimmerButton>
                  </div>
                </div>

                {/* Blocks List */}
                <div className="space-y-3">
                  {(lessonDetail?.blocks || []).length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-8">
                      Bài học này chưa có khối nội dung nào. Bấm “Thêm khối nội dung” để tạo mới.
                    </p>
                  ) : (
                    (lessonDetail?.blocks || []).map((b: any) => {
                      let parsed: any = {};
                      try {
                        parsed = JSON.parse(b.contentJson || b.content_json || '{}');
                      } catch {
                        parsed = {};
                      }
                      return (
                        <div
                          key={b.blockId}
                          className="p-4 rounded-2xl bg-white/85 border border-gray-200/80 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-primary-600 to-amber-500 text-white text-[10px] font-black uppercase">
                                {b.blockType}
                              </span>
                              <span className="text-xs font-extrabold text-gray-900">
                                #{b.orderIndex} — {parsed.title || 'Khối nội dung bài học'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditBlock(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                Sửa nội dung
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlock(b.blockId)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {parsed.summary && (
                            <p className="text-xs text-gray-600">{parsed.summary}</p>
                          )}
                          {Array.isArray(parsed.points) && (
                            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-0.5">
                              {parsed.points.slice(0, 3).map((pt: string, idx: number) => (
                                <li key={idx}>{pt}</li>
                              ))}
                            </ul>
                          )}
                          {Array.isArray(parsed.lines) && (
                            <p className="text-xs text-primary-700 font-semibold">
                              🎧 Hội thoại gồm {parsed.lines.length} câu thoại song ngữ Trung–Việt.
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </GlassCard>
        </div>

        {/* MODAL: Chapter Create/Edit */}
        {chapterForm && (
          <div className="fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[28px] liquid-modal p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-extrabold text-gray-900">
                  {chapterForm.id ? 'Chỉnh sửa chương học' : 'Thêm chương học mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setChapterForm(null)}
                  className="p-1.5 rounded-lg hover:bg-white/80 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveChapter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên chương</label>
                  <input
                    required
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    placeholder="VD: Unit 3: Mua sắm & Hỏi giá"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Thứ tự</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={chapterForm.order_index}
                    onChange={(e) =>
                      setChapterForm({ ...chapterForm, order_index: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setChapterForm(null)}
                    className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <ShimmerButton type="submit" size="sm" className="rounded-xl">
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu chương</span>
                  </ShimmerButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Lesson Create/Edit */}
        {lessonForm && (
          <div className="fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[28px] liquid-modal p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-extrabold text-gray-900">
                  {lessonForm.id ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setLessonForm(null)}
                  className="p-1.5 rounded-lg hover:bg-white/80 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề bài học</label>
                  <input
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="VD: Bài 5: Hỏi đường & Phương hướng"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Thứ tự</label>
                    <input
                      type="number"
                      min={1}
                      value={lessonForm.order_index}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, order_index: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Thời lượng (phút)</label>
                    <input
                      type="number"
                      min={1}
                      value={lessonForm.estimated_duration_mins}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          estimated_duration_mins: parseInt(e.target.value, 10) || 15,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={lessonForm.status}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, status: e.target.value as 'DRAFT' | 'PUBLISHED' })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  >
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="DRAFT">Bản nháp</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLessonForm(null)}
                    className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <ShimmerButton type="submit" size="sm" className="rounded-xl">
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu bài học</span>
                  </ShimmerButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Lesson Content Editor */}
        {blockForm && (
          <div className="fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-[28px] liquid-modal p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-extrabold text-gray-900">
                  {blockForm.id ? 'Chỉnh sửa nội dung bài học' : 'Thêm phần nội dung mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setBlockForm(null)}
                  className="p-1.5 rounded-lg hover:bg-white/80 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveBlock} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Loại nội dung</label>
                    <select
                      value={blockForm.block_type}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, block_type: e.target.value as any })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    >
                      {BLOCK_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Thứ tự</label>
                    <input
                      type="number"
                      min={1}
                      value={blockForm.order_index}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, order_index: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-primary-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockForm.useRawJson}
                    onChange={(e) => setBlockForm({ ...blockForm, useRawJson: e.target.checked })}
                  />
                  <span>Chỉnh sửa dữ liệu nâng cao (dùng cho Hội thoại / Pinyin / Chữ Hán)</span>
                </label>

                {!blockForm.useRawJson ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề phần nội dung</label>
                      <input
                        required
                        value={blockForm.title}
                        onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                        placeholder="VD: Trọng điểm ngữ pháp câu chữ 是"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                      <input
                        value={blockForm.summary}
                        onChange={(e) => setBlockForm({ ...blockForm, summary: e.target.value })}
                        placeholder="Tóm tắt kiến thức chính..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Các ý chính (mỗi dòng 1 ý)
                      </label>
                      <textarea
                        rows={5}
                        value={blockForm.pointsText}
                        onChange={(e) => setBlockForm({ ...blockForm, pointsText: e.target.value })}
                        placeholder="Ý 1...\nÝ 2..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Dữ liệu chi tiết bài học
                    </label>
                    <textarea
                      rows={10}
                      value={blockForm.rawJson}
                      onChange={(e) => setBlockForm({ ...blockForm, rawJson: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-xs font-mono"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBlockForm(null)}
                    className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <ShimmerButton type="submit" size="sm" className="rounded-xl">
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu nội dung</span>
                  </ShimmerButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: MAIN ADMIN DASHBOARD (VIBRANT GLASSMORPHISM)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-7">
      {/* iPhone Optical Liquid Glass Admin Hero Header */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 ios-hero-glass bg-gradient-to-br from-sky-200/32 via-white/18 to-rose-200/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/75 border border-white text-xs font-bold text-indigo-700">
              <Shield className="w-3.5 h-3.5" />
              <span>
                {isSuperAdmin ? 'Quản trị hệ thống Hanzi4U' : 'Không gian biên tập nội dung Hanzi4U'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              {isSuperAdmin
                ? 'Quản lý Khóa học, Bài giảng & Tài khoản'
                : 'Biên tập Khóa học, Bài giảng & Ngân hàng câu hỏi'}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              {isSuperAdmin
                ? 'Thêm, chỉnh sửa khóa học, can thiệp trực tiếp nội dung từng bài học, quản lý ngân hàng câu hỏi HSK 1–6 và phân quyền tài khoản.'
                : 'Biên soạn khóa học, cập nhật trực tiếp nội dung từng bài giảng và quản lý ngân hàng câu hỏi HSK 1–6.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {tab === 'courses' && (
              <ShimmerButton type="button" onClick={openCreateCourse}>
                <Plus className="w-4 h-4" />
                <span>Thêm khóa học mới</span>
              </ShimmerButton>
            )}
            {tab === 'questions' && (
              <ShimmerButton type="button" onClick={openCreateQuestion}>
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi mới</span>
              </ShimmerButton>
            )}
          </div>
        </div>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </motion.div>
      )}

      {/* Vibrant Sliding Navigation Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-light">
        {[
          { id: 'courses' as const, label: 'Khóa học & Bài giảng', icon: BookOpen },
          { id: 'questions' as const, label: 'Ngân hàng Câu hỏi', icon: FileQuestion },
          ...(isSuperAdmin
            ? [{ id: 'rbac' as const, label: 'Người dùng & Phân quyền', icon: Users }]
            : []),
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
                active ? 'text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="admin-cms-tab"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 shadow-md"
                />
              )}
              <Icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {/* ══ TAB 1: COURSES & LESSON INTERVENTION ══ */}
        {tab === 'courses' && (
          <motion.div
            key="admin-courses"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-56 rounded-3xl bg-white/70 animate-pulse" />
              ))
            ) : (
              courses.map((c) => {
                const cid = c.courseId ?? c.course_id;
                const published = Boolean(c.isPublished ?? c.is_published);
                const lvl = (c.level || 'HSK1').toUpperCase();
                return (
                  <SpotlightCard
                    key={cid}
                    className="p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black text-white bg-gradient-to-r ${
                            LEVEL_BADGE[lvl] || LEVEL_BADGE.HSK1
                          }`}
                        >
                          {lvl} • {c.code}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            published
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {published ? 'Đang xuất bản' : 'Bản nháp'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-gray-900">{c.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {c.description || 'Chưa có mô tả cho khóa học này.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                        <span>{c.chaptersCount ?? 0} chương</span>
                        <span>•</span>
                        <span>{c.lessonsCount ?? 0} bài giảng</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-gray-200/70">
                      <ShimmerButton
                        type="button"
                        size="sm"
                        onClick={() => openCourseStudio(c)}
                        className="w-full rounded-xl"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Quản lý & Can thiệp Bài giảng</span>
                      </ShimmerButton>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditCourse(c)}
                          className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePublishCourse(cid)}
                          className="py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {published ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {published ? 'Ẩn' : 'Đăng'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(cid, c.title)}
                          className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })
            )}
          </motion.div>
        )}

        {/* ══ TAB 2: QUESTIONS BANK (FULL EDIT + FILTER) ══ */}
        {tab === 'questions' && (
          <motion.div
            key="admin-questions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <GlassCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {['ALL', ...HSK_LEVELS].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setQuestionLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      questionLevelFilter === lvl
                        ? 'bg-gradient-to-r from-primary-600 to-amber-500 text-white shadow-sm'
                        : 'bg-white/80 text-gray-600 border border-gray-200 hover:bg-white'
                    }`}
                  >
                    {lvl === 'ALL' ? 'Tất cả' : lvl}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                    placeholder="Tìm nội dung câu hỏi..."
                    className="pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs w-56"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3.5 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold cursor-pointer"
                >
                  Lọc
                </button>
              </div>
            </GlassCard>

            <GlassCard className="overflow-hidden divide-y divide-gray-200/70">
              {isLoading ? (
                <div className="p-10 text-center text-sm text-gray-400">Đang tải ngân hàng đề...</div>
              ) : questions.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-500">Không có câu hỏi nào.</div>
              ) : (
                questions.map((q) => (
                  <div
                    key={q.question_id}
                    className="p-4 sm:p-5 hover:bg-white/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-primary-600 to-rose-500 text-white text-[10px] font-black">
                          {q.difficulty_level}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {q.skill_category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black">
                          Đáp án: {q.correct_answer}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{q.content}</p>
                      {q.explanation && (
                        <p className="text-xs text-gray-500 line-clamp-1">💡 {q.explanation}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditQuestion(q)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.question_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* ══ TAB 3: RBAC USERS & AUDIT LOGS ══ */}
        {tab === 'rbac' && isSuperAdmin && (
          <motion.div
            key="admin-rbac"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {userSummary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Tổng người dùng', value: userSummary.totalUsers, icon: Users, color: 'from-primary-600 to-rose-500' },
                  { label: 'Đang hoạt động', value: userSummary.activeUsers, icon: UserCheck, color: 'from-emerald-500 to-teal-500' },
                  { label: 'Quản trị / Biên tập', value: (userSummary.adminCount || 0) + (userSummary.editorCount || 0), icon: Shield, color: 'from-amber-500 to-orange-500' },
                  { label: 'Bị khóa', value: userSummary.lockedCount, icon: Lock, color: 'from-slate-600 to-slate-800' },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <GlassCard key={kpi.label} className="p-5 flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${kpi.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-gray-900">
                          <NumberTicker value={kpi.value || 0} />
                        </p>
                        <p className="text-xs font-semibold text-gray-500">{kpi.label}</p>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}

            <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                    placeholder="Tìm tên hoặc email..."
                    className="pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs w-56"
                  />
                </div>
                <select
                  value={adminRoleFilter}
                  onChange={(e) => setAdminRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold cursor-pointer"
                >
                  Tìm
                </button>
              </div>
            </GlassCard>

            <GlassCard className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/60 border-b border-gray-200/70 text-gray-500 uppercase font-black">
                  <tr>
                    <th className="px-5 py-3.5">Người dùng</th>
                    <th className="px-5 py-3.5">Vai trò</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {adminUsers.map((u) => {
                    const uid = u.userId ?? u.user_id;
                    return (
                      <tr key={uid} className="hover:bg-white/50">
                        <td className="px-5 py-3.5">
                          <p className="font-extrabold text-gray-900">{u.displayName || u.display_name}</p>
                          <p className="text-gray-500">{u.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleAdminUpdateUser(uid, { role: e.target.value })}
                            className="px-2.5 py-1.5 rounded-xl bg-white/75 border border-white/90 font-bold"
                          >
                            <option value="STUDENT">Học viên</option>
                            <option value="CONTENT_EDITOR">Biên tập nội dung</option>
                            <option value="ADMIN">Quản trị viên</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleAdminUpdateUser(uid, {
                                status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE',
                              })
                            }
                            className={`px-3 py-1 rounded-xl font-bold cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700'
                                : 'bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Đang hoạt động (Khóa)' : 'Đang khóa (Mở khóa)'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>

            {auditLogs.length > 0 && (
              <GlassCard className="p-5 space-y-3">
                <h3 className="text-sm font-display font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-600" />
                  Lịch sử hoạt động quản trị
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auditLogs.map((log, i) => (
                    <div
                      key={log.log_id || i}
                      className="p-3 rounded-xl bg-white/75 border border-gray-200/70 text-xs flex items-center justify-between gap-3"
                    >
                      <span className="font-bold text-gray-800">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 inline mr-1" />
                        {log.action} • {log.target_entity || ''}
                      </span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: CREATE / EDIT COURSE ── */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[28px] liquid-modal p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-extrabold text-gray-900">
                {editingCourseId ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề khóa học</label>
                <input
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="VD: HSK 1 — Giao tiếp cơ bản"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mã khóa học</label>
                  <input
                    required
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="HSK1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cấp độ HSK</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  >
                    {HSK_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/75 border border-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseForm.is_published}
                  onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                />
                <span>Xuất bản ngay cho học viên</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <ShimmerButton type="submit" size="sm" className="rounded-xl">
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingCourseId ? 'Lưu cập nhật' : 'Tạo khóa học'}</span>
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT QUESTION ── */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-[28px] liquid-modal p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-extrabold text-gray-900">
                {editingQuestionId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cấp độ HSK</label>
                  <select
                    value={questionForm.difficulty_level}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, difficulty_level: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                  >
                    {HSK_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kỹ năng</label>
                  <select
                    value={questionForm.skill_category}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, skill_category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                  >
                    {SKILL_CATEGORIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Đáp án đúng</label>
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, correct_answer: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                  >
                    {['A', 'B', 'C', 'D'].map((ans) => (
                      <option key={ans} value={ans}>
                        Đáp án {ans}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung câu hỏi</label>
                <textarea
                  required
                  rows={2}
                  value={questionForm.content}
                  onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questionForm.options.map((opt, idx) => (
                  <div key={opt.id}>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Đáp án {opt.id}
                    </label>
                    <input
                      required
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...questionForm.options];
                        next[idx] = { ...opt, text: e.target.value };
                        setQuestionForm({ ...questionForm, options: next });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Giải thích tiếng Việt
                </label>
                <textarea
                  rows={2}
                  value={questionForm.explanation}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, explanation: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <ShimmerButton type="submit" size="sm" className="rounded-xl">
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingQuestionId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}</span>
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
