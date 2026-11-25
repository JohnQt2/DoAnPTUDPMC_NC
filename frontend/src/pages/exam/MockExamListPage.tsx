import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Clock,
  Award,
  Play,
  CheckCircle2,
  AlarmClock,
  Target,
  ArrowRight,
  Headphones,
  Settings,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
} from 'lucide-react';
import { TeacherExamManager } from './TeacherExamManager';

interface MockExamItem {
  id: number;
  code: string;
  title: string;
  description?: string;
  hsk_level: string;
  exam_pdf_url: string;
  audio_url?: string;
  has_answer_pdf: boolean;
  duration_minutes: number;
  total_score: number;
  pass_score: number;
  status: string;
  sections_count: number;
  questions_count: number;
  section_types: string[];
  user_best_score: number | null;
  user_attempts_count: number;
  user_passed: boolean;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  HSK1: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-600 to-amber-700',
  },
  HSK2: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-600 to-emerald-700',
  },
  HSK3: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500/30',
    gradient: 'from-orange-600 to-orange-700',
  },
  HSK4: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500/30',
    gradient: 'from-[#C41E3A] to-[#8E1228]',
  },
  HSK5: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
    gradient: 'from-blue-600 to-blue-800',
  },
  HSK6: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-500/30',
    gradient: 'from-purple-600 to-purple-800',
  },
};

export const MockExamListPage: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<MockExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTeacherManager, setShowTeacherManager] = useState(false);

  const isTeacherOrAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'CONTENT_EDITOR' ||
    (user?.role as string) === 'TEACHER';

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get<MockExamItem[]>('/exams');
      setExams(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Lỗi tải danh sách đề thi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  if (showTeacherManager) {
    return (
      <TeacherExamManager
        onBack={() => {
          setShowTeacherManager(false);
          fetchExams();
        }}
      />
    );
  }

  const filteredExams = exams.filter((ex) => {
    const matchesLevel = selectedLevel === 'ALL' || ex.hsk_level === selectedLevel;
    const matchesSearch =
      searchTerm === '' ||
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans">
      {/* ── TOP HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C41E3A]/10 text-[#C41E3A] text-xs font-bold uppercase tracking-wider">
            <AlarmClock className="w-3.5 h-3.5" />
            <span>Phân hệ Luyện thi thử HSK 1–6</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Thi Thử HSK Chuẩn Đề PDF + Audio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Trải nghiệm phòng thi mô phỏng chuẩn xác: xem đề thi thật định dạng PDF bên trái, nghe file Audio
            MP3 và làm phiếu trả lời chia đôi màn hình bên phải. Chấm điểm tức thì và mở khóa file đáp án PDF.
          </p>
        </div>

        {/* Teacher / Admin Action Button */}
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTeacherManager(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#C41E3A]" />
              <span>Quản lý đề thi (Giáo viên)</span>
            </button>
          </div>
        )}
      </div>

      {/* ── FILTER & SEARCH BAR ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* HSK Level Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-xs">
          {['ALL', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map((lvl) => {
            const active = selectedLevel === lvl;
            const count =
              lvl === 'ALL' ? exams.length : exams.filter((e) => e.hsk_level === lvl).length;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#C41E3A] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span>{lvl === 'ALL' ? 'Tất cả cấp độ' : lvl}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đề (H11332)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141a22] text-xs font-medium outline-none focus:border-[#C41E3A]"
          />
        </div>
      </div>

      {/* ── EXAM CARDS GRID ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C41E3A] animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-bold">Đang tải kho đề thi thử HSK...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Chưa có đề thi nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedLevel !== 'ALL'
              ? `Chưa có đề thi cho cấp độ ${selectedLevel}. Vui lòng chọn cấp độ khác.`
              : 'Hệ thống chưa có đề thi nào.'}
          </p>
          {isTeacherOrAdmin && (
            <button
              type="button"
              onClick={() => setShowTeacherManager(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C41E3A] text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm đề thi PDF mới</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((ex) => {
            const levelStyle = LEVEL_COLORS[ex.hsk_level] || LEVEL_COLORS.HSK1;

            return (
              <div
                key={ex.id}
                className="group relative rounded-3xl bg-white dark:bg-[#141a22] border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-[#C41E3A]/50 transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Banner with Level Watermark */}
                <div className="p-6 space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                    >
                      {ex.hsk_level}
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-400">{ex.code}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-display font-black text-slate-900 dark:text-white group-hover:text-[#C41E3A] transition-colors leading-snug">
                      {ex.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ex.description || 'Đề thi thử chuẩn HSK gồm các phần Nghe hiểu & Đọc hiểu.'}
                    </p>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5">
                      <Clock className="w-3.5 h-3.5 text-[#C41E3A]" />
                      <span>{ex.duration_minutes} phút</span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>{ex.questions_count || 40} câu hỏi</span>
                    </div>

                    {ex.audio_url && (
                      <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5">
                        <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kèm Audio MP3</span>
                      </div>
                    )}
                  </div>

                  {/* User Stats (nếu đã từng thi) */}
                  {ex.user_attempts_count > 0 && (
                    <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-semibold">Điểm cao nhất</span>
                        <span className="font-extrabold text-sm text-[#C41E3A]">
                          {ex.user_best_score} / {ex.total_score}đ
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[10px] block font-semibold">
                          {ex.user_attempts_count} lần làm bài
                        </span>
                        {ex.user_passed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã đạt</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold text-xs">Chưa đạt</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-slate-50/80 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    Điểm chuẩn: <b>{ex.pass_score}đ</b>
                  </span>

                  <a
                    href={`#/mock-exam/${ex.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C41E3A] hover:bg-[#A81830] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all"
                  >
                    <span>Vào thi thử (Split-Screen)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MockExamListPage;
