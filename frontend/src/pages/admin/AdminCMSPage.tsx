import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  BookOpen,
  FileQuestion,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit,
  Save,
  Sparkles,
} from 'lucide-react';

export const AdminCMSPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'courses' | 'questions'>('courses');
  const [courses, setCourses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    code: '',
    level: 'HSK1',
    description: '',
    is_published: false,
  });

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
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

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (tab === 'courses') {
        const data = await api.get<any[]>('/curriculum/courses');
        setCourses(data || []);
      } else {
        const data = await api.get<any[]>('/assessment/questions');
        setQuestions(data || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublishCourse = async (courseId: number) => {
    try {
      await api.post(`/curriculum/courses/${courseId}/publish`);
      setCourses((prev) =>
        prev.map((c) => (c.course_id === courseId ? { ...c, is_published: !c.is_published } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/curriculum/courses', newCourse);
      setShowCourseModal(false);
      setNewCourse({ title: '', code: '', level: 'HSK1', description: '', is_published: false });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo khóa học');
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assessment/questions', {
        question_type: newQuestion.question_type,
        skill_category: newQuestion.skill_category,
        difficulty_level: newQuestion.difficulty_level,
        content: newQuestion.content,
        options_json: JSON.stringify(newQuestion.options),
        correct_answer: newQuestion.correct_answer,
        explanation: newQuestion.explanation,
      });
      setShowQuestionModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo câu hỏi');
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      await api.delete(`/assessment/questions/${qId}`);
      setQuestions((prev) => prev.filter((q) => q.question_id !== qId));
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa câu hỏi');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">
            <Shield className="w-3.5 h-3.5" />
            Trang Quản Trị Hệ Thống (CMS)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Quản Lý Giáo Trình & Ngân Hàng Đề Thi
          </h1>
          <p className="text-sm text-gray-500">
            Dành cho Biên tập viên và Quản trị viên quản lý xuất bản khóa học, bài học và câu hỏi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tab === 'courses' ? (
            <button
              onClick={() => setShowCourseModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm Khóa Học Mới
            </button>
          ) : (
            <button
              onClick={() => setShowQuestionModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm Câu Hỏi Mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'courses' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Khóa Học & Bài Học ({courses.length})
        </button>

        <button
          onClick={() => setTab('questions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'questions' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Ngân Hàng Câu Hỏi ({questions.length})
        </button>
      </div>

      {/* TAB 1: COURSES MANAGEMENT */}
      {tab === 'courses' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Mã & Cấp Độ</th>
                  <th className="p-4 sm:p-5">Tên Khóa Học</th>
                  <th className="p-4 sm:p-5">Chương</th>
                  <th className="p-4 sm:p-5">Trạng Thái</th>
                  <th className="p-4 sm:p-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((c) => (
                  <tr key={c.course_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4 sm:p-5">
                      <span className="font-mono font-bold text-gray-900 mr-2">{c.code}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-bold text-[10px]">
                        {c.level}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 font-bold text-gray-900 text-sm">{c.title}</td>
                    <td className="p-4 sm:p-5 text-gray-500">
                      {c._count?.chapters || 0} Chương
                    </td>
                    <td className="p-4 sm:p-5">
                      <button
                        onClick={() => handleTogglePublishCourse(c.course_id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] transition-all ${
                          c.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.is_published ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            PUBLISHED
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-amber-500" />
                            DRAFT
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      <a
                        href={`#/courses/${c.course_id}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-bold"
                      >
                        Xem chi tiết →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS BANK */}
      {tab === 'questions' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Loại Câu Hỏi</th>
                  <th className="p-4 sm:p-5">Nội Dung</th>
                  <th className="p-4 sm:p-5">Đáp Án Đúng</th>
                  <th className="p-4 sm:p-5">Kỹ Năng & Cấp Độ</th>
                  <th className="p-4 sm:p-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map((q) => (
                  <tr key={q.question_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4 sm:p-5 font-mono text-gray-500 text-[11px]">
                      {q.question_type}
                    </td>
                    <td className="p-4 sm:p-5 font-medium text-gray-900 max-w-sm">
                      {q.content}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {q.correct_answer}
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-gray-500">
                      {q.skill_category} • {q.difficulty_level}
                    </td>
                    <td className="p-4 sm:p-5 text-right">
                      <button
                        onClick={() => handleDeleteQuestion(q.question_id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Course */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Thêm Khóa Học Mới</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên Khóa Học</label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mã Khóa (Code)</label>
                  <input
                    type="text"
                    required
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cấp Độ</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                  >
                    <option value="HSK1">HSK 1</option>
                    <option value="HSK2">HSK 2</option>
                    <option value="HSK3">HSK 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả khóa học</label>
                <textarea
                  rows={3}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs"
                >
                  Tạo Khóa Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900">Thêm Câu Hỏi Vào Ngân Hàng</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dạng Câu Hỏi</label>
                  <select
                    value={newQuestion.question_type}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  >
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                    <option value="TONE_PICKER">Chọn thanh điệu</option>
                    <option value="RADICAL_BUILDER">Ghép bộ thủ</option>
                    <option value="SYNTAX_SCRAMBLE">Sắp xếp câu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kỹ Năng</label>
                  <select
                    value={newQuestion.skill_category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, skill_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  >
                    <option value="READING">Đọc hiểu</option>
                    <option value="LISTENING">Nghe</option>
                    <option value="TONE">Thanh điệu</option>
                    <option value="PINYIN">Pinyin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Độ Khó</label>
                  <select
                    value={newQuestion.difficulty_level}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  >
                    <option value="HSK1">HSK 1</option>
                    <option value="HSK2">HSK 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nội dung câu hỏi</label>
                <textarea
                  rows={2}
                  required
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Các phương án lựa chọn:</label>
                {newQuestion.options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs">
                      {opt.id}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Nội dung lựa chọn ${opt.id}`}
                      value={opt.text}
                      onChange={(e) => {
                        const nextOpts = [...newQuestion.options];
                        nextOpts[idx].text = e.target.value;
                        setNewQuestion({ ...newQuestion, options: nextOpts });
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Đáp Án Đúng</label>
                  <select
                    value={newQuestion.correct_answer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-emerald-700"
                  >
                    <option value="A">Phương án A</option>
                    <option value="B">Phương án B</option>
                    <option value="C">Phương án C</option>
                    <option value="D">Phương án D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Giải thích sư phạm</label>
                <textarea
                  rows={2}
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  placeholder="Giải thích tại sao đáp án đúng..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
