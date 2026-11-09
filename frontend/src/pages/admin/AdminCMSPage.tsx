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
  Trash2,
  Users,
  Activity,
  Search,
  Lock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export const AdminCMSPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN';

  const [tab, setTab] = useState<'courses' | 'questions' | 'rbac'>('courses');
  const [courses, setCourses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [userSummary, setUserSummary] = useState<{
    totalUsers: number;
    activeUsers: number;
    adminCount: number;
    editorCount: number;
    lockedCount: number;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
  }, [tab, adminRoleFilter]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (tab === 'courses') {
        const data = await api.get<any[]>('/curriculum/courses');
        setCourses(data || []);
      } else if (tab === 'questions') {
        const data = await api.get<any[]>('/assessment/questions');
        setQuestions(data || []);
      } else if (tab === 'rbac' && isSuperAdmin) {
        const [usersData, logsData] = await Promise.all([
          api.get<any>('/users/admin/all', {
            params: {
              search: adminSearch || undefined,
              role: adminRoleFilter || undefined,
              limit: 30,
            },
          }),
          api.get<any[]>('/users/admin/audit-logs', { params: { limit: 20 } }),
        ]);
        setAdminUsers(usersData?.users || []);
        if (usersData?.summary) {
          setUserSummary(usersData.summary);
        }
        setAuditLogs(logsData || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
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
      showToast(res?.message || 'Đã cập nhật trạng thái xuất bản khóa học.');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái xuất bản khóa học');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/curriculum/courses', newCourse);
      setShowCourseModal(false);
      setNewCourse({ title: '', code: '', level: 'HSK1', description: '', is_published: false });
      showToast('Đã tạo khóa học mới thành công.');
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
      showToast('Đã thêm câu hỏi mới vào ngân hàng đề.');
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
      showToast('Đã xóa câu hỏi khỏi ngân hàng đề.');
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa câu hỏi');
    }
  };

  const handleAdminUpdateUser = async (
    targetUserId: number,
    updates: { role?: string; status?: string }
  ) => {
    try {
      await api.put(`/users/admin/${targetUserId}`, updates);
      showToast('Đã cập nhật phân quyền / trạng thái tài khoản (RBAC) thành công!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật quyền người dùng');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Trung Tâm Quản Trị Hệ Thống • Vai trò:{' '}
              <strong className="font-mono">{user?.role}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Quản Lý Giáo Trình, Ngân Hàng Đề & Phân Quyền RBAC
          </h1>
          <p className="text-sm text-gray-500">
            Kiểm soát xuất bản học liệu HSK, ngân hàng câu hỏi đánh giá và phân quyền truy cập theo vai trò.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tab === 'courses' && (
            <button
              type="button"
              onClick={() => setShowCourseModal(true)}
              className="min-h-[42px] flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Thêm Khóa Học Mới
            </button>
          )}
          {tab === 'questions' && (
            <button
              type="button"
              onClick={() => setShowQuestionModal(true)}
              className="min-h-[42px] flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Thêm Câu Hỏi Mới
            </button>
          )}
        </div>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-medium"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setTab('courses')}
          className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'courses'
              ? 'bg-primary-50 text-primary-600 border border-primary-100'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          Khóa Học & Bài Học ({courses.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('questions')}
          className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'questions'
              ? 'bg-primary-50 text-primary-600 border border-primary-100'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileQuestion className="w-4 h-4" aria-hidden="true" />
          Ngân Hàng Câu Hỏi ({questions.length})
        </button>

        {isSuperAdmin ? (
          <button
            type="button"
            onClick={() => setTab('rbac')}
            className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'rbac'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" aria-hidden="true" />
            Phân Quyền RBAC & Nhật Ký Bảo Mật
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
            <Lock className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span>Quản lý tài khoản RBAC chỉ dành cho ADMIN</span>
          </div>
        )}
      </div>

      {/* TAB 1: COURSES MANAGEMENT */}
      {tab === 'courses' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 sm:p-5">Mã & Cấp Độ</th>
                  <th className="p-4 sm:p-5">Tên Khóa Học</th>
                  <th className="p-4 sm:p-5">Số Chương</th>
                  <th className="p-4 sm:p-5">Trạng Thái Xuất Bản</th>
                  <th className="p-4 sm:p-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((c) => {
                  const id = c.courseId ?? c.course_id;
                  const isPublished = c.isPublished ?? c.is_published;
                  const chaptersCount = c.chaptersCount ?? c._count?.chapters ?? 0;
                  return (
                    <tr key={id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4 sm:p-5">
                        <span className="font-mono font-bold text-gray-900 mr-2">{c.code}</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-bold text-[10px]">
                          {c.level}
                        </span>
                      </td>
                      <td className="p-4 sm:p-5">
                        <p className="font-bold text-gray-900 text-sm">{c.title}</p>
                        {c.description && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {c.description}
                          </p>
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-gray-600 font-semibold">
                        {chaptersCount} Chương
                      </td>
                      <td className="p-4 sm:p-5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublishCourse(id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[10px] transition-all cursor-pointer ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                              PUBLISHED (Nhấn để ẩn)
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                              DRAFT (Nhấn để xuất bản)
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 sm:p-5 text-right">
                        <a
                          href={`#/courses/${id}`}
                          className="text-xs text-primary-600 hover:text-primary-700 font-bold"
                        >
                          Xem chi tiết →
                        </a>
                      </td>
                    </tr>
                  );
                })}
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
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
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
                    <td className="p-4 sm:p-5 font-mono text-gray-600 text-[11px]">
                      {q.question_type}
                    </td>
                    <td className="p-4 sm:p-5 font-medium text-gray-900 max-w-sm">{q.content}</td>
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
                        type="button"
                        onClick={() => handleDeleteQuestion(q.question_id)}
                        aria-label={`Xóa câu hỏi ${q.question_id}`}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC USER MANAGEMENT & AUDIT LOGS (ADMIN ONLY) */}
      {tab === 'rbac' && isSuperAdmin && (
        <div className="space-y-8">
          {/* KPI Summary Cards */}
          {userSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-gray-400">Tổng tài khoản</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{userSummary.totalUsers}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-emerald-600">Đang hoạt động</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{userSummary.activeUsers}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-amber-600">Quản trị (ADMIN)</span>
                <p className="text-2xl font-black text-amber-700 mt-1">{userSummary.adminCount}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-blue-600">Biên tập (EDITOR)</span>
                <p className="text-2xl font-black text-blue-700 mt-1">{userSummary.editorCount}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-red-600">Bị khóa / Cấm</span>
                <p className="text-2xl font-black text-red-700 mt-1">{userSummary.lockedCount}</p>
              </div>
            </div>
          )}

          {/* User Role & Status Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-primary-600" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Bảng Phân Quyền Người Dùng (Role-Based Access Control)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Cấp quyền STUDENT / CONTENT_EDITOR / ADMIN hoặc khóa tài khoản vi phạm (tự động thu hồi toàn bộ phiên)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    aria-label="Tìm kiếm người dùng theo email hoặc tên"
                    placeholder="Tìm email hoặc tên..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadData()}
                    className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  aria-label="Lọc theo vai trò"
                  value={adminRoleFilter}
                  onChange={(e) => setAdminRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {adminUsers.map((u) => (
                <div
                  key={u.user_id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{u.display_name}</span>
                      <span className="text-xs text-gray-500">({u.email})</span>
                      {u.user_id === user?.userId && (
                        <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                          Bạn
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      ID #{u.user_id} • Trạng thái:{' '}
                      <strong
                        className={u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}
                      >
                        {u.status}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Vai trò của ${u.email}`}
                      value={u.role}
                      disabled={u.user_id === user?.userId}
                      onChange={(e) => handleAdminUpdateUser(u.user_id, { role: e.target.value })}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    <select
                      aria-label={`Trạng thái của ${u.email}`}
                      value={u.status}
                      disabled={u.user_id === user?.userId}
                      onChange={(e) => handleAdminUpdateUser(u.user_id, { status: e.target.value })}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="LOCKED">LOCKED</option>
                      <option value="BANNED">BANNED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs Viewer */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <Activity className="w-5 h-5 text-amber-600" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Nhật Ký Kiểm Toán & Bảo Mật (Audit Logs)
                </h2>
                <p className="text-xs text-gray-500">
                  Ghi vết toàn bộ sự kiện đăng nhập OAuth2/OTP, phát hiện Token Reuse và thay đổi quyền RBAC
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Thời Gian</th>
                    <th className="p-3.5">Hành Động</th>
                    <th className="p-3.5">Tài Khoản Thực Hiện</th>
                    <th className="p-3.5">Đối Tượng & Chi Tiết</th>
                    <th className="p-3.5">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-gray-50/60">
                      <td className="p-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                            log.actionType.includes('REUSE') || log.actionType.includes('REVOKE')
                              ? 'bg-red-50 text-red-700'
                              : log.actionType.includes('ADMIN')
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {log.actionType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {log.actor ? (
                          <div>
                            <span className="font-bold text-gray-900">{log.actor.displayName}</span>
                            <span className="block text-[11px] text-gray-400">
                              {log.actor.email} ({log.actor.role})
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Hệ thống</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-gray-600 max-w-xs truncate">
                        {log.targetEntity} #{log.targetId} {log.newValue ? `→ ${log.newValue}` : ''}
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs cursor-pointer"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs cursor-pointer"
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
