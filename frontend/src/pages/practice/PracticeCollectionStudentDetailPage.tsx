import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  FileQuestion,
  Headphones,
  BookMarked,
  Sparkles,
  Lock,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ExerciseSetSummary {
  id: number;
  code: string;
  skill: string;
  titleZh: string;
  titleVi?: string | null;
  instructions?: string | null;
  estimatedMinutes: number;
  sortOrder: number;
  questionsCount: number;
  totalScore: number;
  latestAttempt: {
    id: number;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED';
    earnedScore: number;
    totalScore: number;
    correctCount?: number;
    totalQuestions?: number;
    wrongCount?: number;
    startedAt: string;
    submittedAt?: string | null;
  } | null;
}

interface CollectionDetail {
  id: number;
  code: string;
  levelCode: string;
  levelName: string;
  category: string;
  titleZh: string;
  titlePinyin?: string | null;
  titleVi: string;
  description?: string | null;
  currentVersionId: number;
  currentVersionNumber: number;
  totalQuestions: number;
  totalScore: number;
  estimatedMinutes: number;
  exerciseSets: ExerciseSetSummary[];
}

const CATEGORY_NAMES: Record<string, string> = {
  WORKBOOK_LESSON: 'Sách bài tập',
  SKILL_PRACTICE: 'Luyện kỹ năng',
  MIXED_PRACTICE: 'Luyện tổng hợp',
  MOCK_EXAM: 'Đề mô phỏng',
  REAL_EXAM_SIMULATION: 'Thi thử thực chiến',
};

const SKILL_ICONS: Record<string, React.ReactNode> = {
  LISTENING: <Headphones className="w-5 h-5 text-[#F59E0B]" />,
  READING: <BookOpen className="w-5 h-5 text-[#22C55E]" />,
  WRITING: <BookMarked className="w-5 h-5 text-[#D97706]" />,
  HANZI: <Sparkles className="w-5 h-5 text-[#F59E0B]" />,
  PHONETICS: <Headphones className="w-5 h-5 text-[#F59E0B]" />,
};

interface Props {
  collectionId: number;
}

export const PracticeCollectionStudentDetailPage: React.FC<Props> = ({ collectionId }) => {
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingSetId, setStartingSetId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<any>(`/practice/collections/${collectionId}`);
        const data = res?.data !== undefined ? res.data : res;
        setCollection(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin bộ bài tập.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [collectionId]);

  const handleStartSet = async (exerciseSetId: number) => {
    try {
      setStartingSetId(exerciseSetId);
      const res = await api.post<{ attemptId: number; exerciseSetId: number }>(
        `/practice/collections/${collectionId}/attempts`,
        { exerciseSetId }
      );
      const data = (res as any)?.data !== undefined ? (res as any).data : res;
      if (data && data.exerciseSetId) {
        const targetHash = `#/practice/exercise/${data.exerciseSetId}?collectionId=${collectionId}`;
        window.history.pushState(
          {
            collectionId,
            exerciseId: data.exerciseSetId,
          },
          '',
          targetHash
        );
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    } catch (err: any) {
      alert(err.message || 'Không thể bắt đầu làm bài. Vui lòng thử lại.');
    } finally {
      setStartingSetId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="h-6 w-32 bg-[#F3E8D6] rounded-xl animate-pulse" />
        <div className="h-40 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="p-8 text-center space-y-4 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#F59E0B] mx-auto" />
          <h2 className="text-xl font-bold text-[#1F2937]">Không tìm thấy bộ đề</h2>
          <p className="text-sm text-[#6B7280]">
            {error || 'Bộ bài tập này chưa được xuất bản hoặc không tồn tại.'}
          </p>
          <a
            href="#/exams/workbook"
            className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-white transition-all shadow-sm"
          >
            Quay lại kho luyện tập
          </a>
        </div>
      </div>
    );
  }

  // Sửa triệt để lỗi encoding & description null
  const rawDesc = collection.description?.trim();
  const displayDescription =
    !rawDesc || rawDesc.includes('????') ? 'Chưa có mô tả' : rawDesc;

  // Tính toán progress toàn bộ collection
  const exerciseSets = collection.exerciseSets ?? [];
  const totalSets = exerciseSets.length;
  const completedSets = exerciseSets.filter(
    (s) => s.latestAttempt && (s.latestAttempt.status === 'COMPLETED' || s.latestAttempt.status === 'SUBMITTED')
  ).length;
  const collectionProgressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Back button */}
      <div>
        <a
          href="#/exams/workbook"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1F2937] hover:text-[#D97706] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
          <span>Quay lại kho bài luyện</span>
        </a>
      </div>

      {/* Hero Section: Gọn gàng, giảm khoảng trắng, nền trắng, border #F3E8D6 */}
      <div className="rounded-2xl bg-white border border-[#F3E8D6] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#F59E0B] shadow-sm">
              {collection.levelCode}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF7F2] text-[#1F2937] border border-[#F3E8D6]">
              {CATEGORY_NAMES[collection.category] || collection.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium text-[#6B7280] bg-[#FAF7F2] border border-[#F3E8D6]">
              v{collection.currentVersionNumber}
            </span>
          </div>

          {/* Badge tiến độ collection */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1F2937]">Tiến độ bài học:</span>
            <span className="text-xs font-bold text-[#D97706] bg-[#FFF7E6] px-2.5 py-1 rounded-lg border border-[#F59E0B]/30">
              {completedSets}/{totalSets} phần ({collectionProgressPercent}%)
            </span>
          </div>
        </div>

        {/* Tiêu đề & Thông tin (UTF-8 chuẩn) */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">
            {collection.titleVi}
          </h1>
          <p className="text-base font-chinese font-semibold text-[#D97706]">
            {collection.titleZh}{' '}
            {collection.titlePinyin && (
              <span className="text-sm text-[#6B7280] font-normal font-sans">
                ({collection.titlePinyin})
              </span>
            )}
          </p>
          <p className="text-xs sm:text-sm text-[#6B7280] pt-1 leading-relaxed">
            {displayDescription}
          </p>
        </div>

        {/* Progress Bar toàn bộ collection */}
        <div className="pt-1 space-y-1.5">
          <div className="w-full bg-[#FAF7F2] border border-[#F3E8D6] rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#22C55E] h-full rounded-full transition-all duration-300"
              style={{ width: `${collectionProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Metadata info */}
        <div className="pt-3 border-t border-[#F3E8D6] flex flex-wrap items-center gap-6 text-xs text-[#6B7280] font-medium">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#F59E0B]" />
            {totalSets} phần luyện tập
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileQuestion className="w-4 h-4 text-[#D97706]" />
            {collection.totalQuestions ?? 0} câu hỏi ({collection.totalScore ?? 0} điểm)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#6B7280]" />
            ~{collection.estimatedMinutes ?? 0} phút
          </span>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#1F2937]">
            Các phần trong bộ bài tập
          </h2>
          <span className="text-xs text-[#6B7280]">
            Chọn phần bài tập để bắt đầu hoặc xem phân tích lời giải
          </span>
        </div>

        <div className="space-y-3">
          {exerciseSets.map((set, idx) => {
            if (!set) return null;
            const latest = set?.latestAttempt;
            const inProgress = latest && latest.status === 'IN_PROGRESS';
            const completed = latest && (latest.status === 'COMPLETED' || latest.status === 'SUBMITTED');
            const scorePercent =
              latest && latest.totalScore > 0 ? Math.round((latest.earnedScore / latest.totalScore) * 100) : 0;
            const correctCount = latest?.correctCount ?? (completed ? Math.round((scorePercent / 100) * set.questionsCount) : 0);
            const wrongCount = latest?.wrongCount ?? Math.max(0, set.questionsCount - correctCount);

            // Badges theo yêu cầu: ✅ Hoàn thành, 🟠 Đang làm, 🔒 Chưa mở, 📖 Chưa học
            let statusBadge = (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF7F2] text-[#6B7280] border border-[#F3E8D6]">
                📖 Chưa học
              </span>
            );

            if (completed) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#22C55E] border border-[#22C55E]/30">
                  <Check className="w-3.5 h-3.5" /> Hoàn thành
                </span>
              );
            } else if (inProgress) {
              statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF7E6] text-[#D97706] border border-[#F59E0B]/30">
                  <Clock className="w-3.5 h-3.5" /> Đang làm
                </span>
              );
            }

            // Sửa triệt để encoding tên phần bài tập nếu gặp lỗi
            const displayTitleVi = set.titleVi && !set.titleVi.includes('?') ? set.titleVi : null;
            const displayTitleZh = set.titleZh && !set.titleZh.includes('????') ? set.titleZh : `Phần ${idx + 1}`;

            return (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
                className="rounded-2xl p-4 sm:p-5 bg-white border border-[#F3E8D6] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7E6] border border-[#F59E0B]/30 flex items-center justify-center shrink-0">
                    {SKILL_ICONS[set.skill] || <BookOpen className="w-5 h-5 text-[#F59E0B]" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#6B7280]">Phần {idx + 1}</span>
                      <span className="text-xs font-bold text-[#F59E0B] px-2 py-0.5 rounded-md bg-[#FFF7E6] border border-[#F59E0B]/20">
                        {set.skill}
                      </span>
                      {statusBadge}
                    </div>

                    <h3 className="text-base font-bold text-[#1F2937] truncate">
                      {displayTitleVi || displayTitleZh}
                    </h3>
                    {displayTitleVi && displayTitleZh && (
                      <p className="text-xs font-chinese font-medium text-[#D97706] truncate">
                        {displayTitleZh}
                      </p>
                    )}

                    {/* Điểm số & Số câu đúng/sai khi hoàn thành */}
                    <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
                      {completed && latest ? (
                        <>
                          <span className="font-bold text-[#22C55E]">
                            Điểm: {latest.earnedScore}/{latest.totalScore} ({scorePercent}%)
                          </span>
                          <span className="text-[#6B7280]">
                            Đúng: <b className="text-[#22C55E]">{correctCount}</b> / Sai: <b className="text-[#EF4444]">{wrongCount}</b>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[#6B7280]">{set.questionsCount} câu hỏi</span>
                          <span className="text-[#6B7280]">•</span>
                          <span className="text-[#6B7280]">{set.totalScore} điểm</span>
                        </>
                      )}
                      <span className="text-[#6B7280]">•</span>
                      <span className="text-[#6B7280]">~{set.estimatedMinutes} phút</span>
                    </div>
                  </div>
                </div>

                {/* Các nút hành động: Xem kết quả / Xem lời giải / Làm lại / Bắt đầu */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                  {completed && latest && (
                    <a
                      href={`#/practice/results/${latest.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#F3E8D6] text-xs font-semibold text-[#1F2937] bg-[#FAF7F2] hover:bg-[#F3E8D6] transition-colors"
                      title="Xem kết quả & lời giải chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Xem kết quả</span>
                    </a>
                  )}

                  <button
                    type="button"
                    disabled={startingSetId === set.id}
                    onClick={() => handleStartSet(set.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 ${
                      completed
                        ? 'bg-[#FAF7F2] hover:bg-[#FFF7E6] text-[#D97706] border border-[#F59E0B]/30'
                        : inProgress
                        ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-amber-500/20'
                        : 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-amber-500/20'
                    }`}
                  >
                    {inProgress ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tiếp tục làm</span>
                      </>
                    ) : completed ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Làm lại</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Bắt đầu</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
