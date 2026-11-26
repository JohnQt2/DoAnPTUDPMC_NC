import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { QuestionRenderer } from '../../components/practice/QuestionRenderer';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Award,
  Sparkles,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Lightbulb,
  Check,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface PracticeResultPageProps {
  attemptId: number;
}

export const PracticeResultPage: React.FC<PracticeResultPageProps> = ({ attemptId }) => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'WRONG' | 'CORRECT'>('ALL');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [aiAnalyzingId, setAiAnalyzingId] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});

  useEffect(() => {
    api
      .get<any>(`/practice/attempts/${attemptId}/result`)
      .then((res) => {
        const data = res?.data !== undefined ? res.data : res;
        setResult(data);
        // Mở sẵn toàn bộ câu hỏi để người học dễ theo dõi feedback
        if (Array.isArray(data?.questions)) {
          const initExp: Record<number, boolean> = {};
          data.questions.forEach((q: any) => {
            initExp[q.id] = true;
          });
          setExpandedQuestions(initExp);
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        <div className="h-64 rounded-2xl bg-white border border-[#F3E8D6] shadow-sm animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4 bg-white rounded-2xl border border-[#F3E8D6] shadow-sm">
        <AlertCircle className="w-12 h-12 text-[#F59E0B] mx-auto" />
        <h2 className="text-xl font-bold text-[#1F2937]">Không tìm thấy kết quả</h2>
        <p className="text-sm text-[#6B7280]">Lượt làm bài không tồn tại hoặc chưa được nộp chấm điểm.</p>
        <a
          href="#/practice"
          className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-white transition-all shadow-sm"
        >
          Quay lại luyện tập
        </a>
      </div>
    );
  }

  const totalQuestions = result.totalQuestions || result.questions?.length || 0;
  const correctCount = result.correctCount ?? 0;
  const wrongCount = result.wrongCount ?? Math.max(0, totalQuestions - correctCount);
  const accuracyRate = result.accuracyRate ?? (totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);
  const score100 = result.score100 ?? result.percentage ?? 0;

  // Tính xếp loại học tập
  let ratingLabel = 'Cần luyện tập thêm';
  let ratingColor = 'text-[#E11D48] bg-[#FEF2F2] border-[#EF4444]/30';
  if (score100 >= 90) {
    ratingLabel = 'Xuất sắc (A+)';
    ratingColor = 'text-[#22C55E] bg-[#ECFDF5] border-[#22C55E]/30';
  } else if (score100 >= 80) {
    ratingLabel = 'Giỏi (A)';
    ratingColor = 'text-[#22C55E] bg-[#ECFDF5] border-[#22C55E]/30';
  } else if (score100 >= 65) {
    ratingLabel = 'Khá (B)';
    ratingColor = 'text-[#D97706] bg-[#FFF7E6] border-[#F59E0B]/30';
  } else if (score100 >= 50) {
    ratingLabel = 'Đạt yêu cầu (C)';
    ratingColor = 'text-[#D97706] bg-[#FFF7E6] border-[#F59E0B]/30';
  }

  // Định dạng thời gian làm bài
  const formatDuration = (secs: number) => {
    if (!secs || secs <= 0) return 'Dưới 1 phút';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s} giây`;
    return `${m} phút ${s > 0 ? `${s}s` : ''}`;
  };

  const toggleExpand = (qId: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleToggleAll = (expand: boolean) => {
    const updated: Record<number, boolean> = {};
    result.questions?.forEach((q: any) => {
      updated[q.id] = expand;
    });
    setExpandedQuestions(updated);
  };

  // Kiến trúc sẵn sàng tích hợp AI giải thích cho câu sai
  const handleRequestAiExplanation = (q: any) => {
    setAiAnalyzingId(q.id);
    setTimeout(() => {
      let promptSnippet = '';
      if (q.prompt?.wordZh) promptSnippet += `từ "${q.prompt.wordZh}" (${q.prompt.wordPinyin || ''})`;
      else if (q.prompt?.sentence) promptSnippet += `câu "${q.prompt.sentence}"`;
      else if (q.prompt?.questionText) promptSnippet += `nội dung "${q.prompt.questionText}"`;

      const aiText = `[Phân tích AI]: Với ${promptSnippet || 'câu hỏi này'}, đáp án của bạn là "${
        typeof q.userAnswer === 'object' ? JSON.stringify(q.userAnswer) : q.userAnswer || 'chưa trả lời'
      }". Đáp án chính xác là "${
        typeof q.correctAnswer === 'object' ? q.correctAnswer.value || JSON.stringify(q.correctAnswer) : q.correctAnswer
      }". Điểm cốt lõi cần lưu ý: chú ý ngữ nghĩa thực tế và quy tắc kết hợp ngữ âm / ngữ cảnh giao tiếp trong bài.`;

      setAiExplanations((prev) => ({ ...prev, [q.id]: aiText }));
      setAiAnalyzingId(null);
    }, 800);
  };

  const filteredQuestions = (result.questions || []).filter((q: any) => {
    if (selectedFilter === 'WRONG') return !q.isCorrect;
    if (selectedFilter === 'CORRECT') return q.isCorrect;
    return true;
  });

  // Tổng hợp kiến thức cần ghi nhớ từ các câu hỏi
  const wrongQuestions = (result.questions || []).filter((q: any) => !q.isCorrect);

  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const stateCollectionId =
    (window.history.state?.usr as any)?.collectionId ||
    window.history.state?.collectionId ||
    params.get('collectionId') ||
    result?.collectionId ||
    null;

  const backUrl = stateCollectionId
    ? `#/practice/collections/${stateCollectionId}`
    : '#/practice';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top action */}
      <div className="flex items-center justify-between">
        <a
          href={backUrl}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1F2937] bg-white border border-[#F3E8D6] hover:bg-[#FAF7F2] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
          <span>Quay lại bộ bài tập</span>
        </a>

        <div className="text-xs font-medium text-[#6B7280]">
          Lượt làm bài #{result.attemptId}
        </div>
      </div>

      {/* Main Score & Learning Feedback Header Card */}
      <div className="rounded-2xl bg-white border border-[#F3E8D6] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#F3E8D6]">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7E6] text-[#D97706] border border-[#F59E0B]/30">
              <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
              Kết quả bài luyện tập: {result.exerciseSetTitle}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] font-chinese">
              {score100 >= 80 ? 'Hoàn thành xuất sắc!' : score100 >= 60 ? 'Hoàn thành bài tập' : 'Cần cố gắng thêm!'}
            </h1>

            <p className="text-xs sm:text-sm text-[#6B7280] max-w-lg">
              Hệ thống đã chấm điểm tự động toàn bộ {totalQuestions} câu hỏi. Xem chi tiết phân tích từng câu bên dưới để củng cố kiến thức.
            </p>
          </div>

          {/* Điểm số thang 100 & Xếp loại */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FFF7E6] border border-[#F59E0B]/30 shadow-sm min-w-[180px] text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">Điểm thang 100</span>
            <div className="text-5xl font-black text-[#F59E0B] tracking-tight my-1">
              {score100}
            </div>
            <div className={`mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${ratingColor}`}>
              {ratingLabel}
            </div>
          </div>
        </div>

        {/* 4 Thống kê chính: Điểm số, Xếp loại, Thời gian, Tỷ lệ chính xác */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7280] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              Số câu đúng
            </div>
            <div className="text-xl font-bold text-[#22C55E]">
              {correctCount} <span className="text-xs font-normal text-[#6B7280]">/ {totalQuestions}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7280] mb-1">
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
              Số câu sai
            </div>
            <div className="text-xl font-bold text-[#EF4444]">
              {wrongCount} <span className="text-xs font-normal text-[#6B7280]">/ {totalQuestions}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7280] mb-1">
              <Target className="w-3.5 h-3.5 text-[#F59E0B]" />
              Tỷ lệ chính xác
            </div>
            <div className="text-xl font-bold text-[#1F2937]">
              {accuracyRate}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#F3E8D6] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7280] mb-1">
              <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
              Thời gian làm bài
            </div>
            <div className="text-xl font-bold text-[#1F2937]">
              {formatDuration(result.durationSeconds)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#F3E8D6] flex-wrap">
          <a
            href={`#/practice/exercise/${result.exerciseSetId}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#F59E0B] hover:bg-[#D97706] text-white transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Làm lại bài này
          </a>

          <a
            href={backUrl}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#FAF7F2] hover:bg-[#F3E8D6] text-[#1F2937] transition-all border border-[#F3E8D6]"
          >
            <BookOpen className="w-4 h-4" />
            Các phần khác trong bộ bài
          </a>
        </div>
      </div>

      {/* Mục: Kiến thức cần ghi nhớ */}
      {wrongQuestions.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#FFF7E6] border border-[#F59E0B]/30 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-[#D97706]" />
            <h3 className="text-base font-bold text-[#1F2937]">Kiến thức cần ghi nhớ sau bài làm</h3>
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed">
            Bạn có {wrongQuestions.length} câu cần lưu ý. Hãy đọc kỹ phần giải thích chi tiết của các câu hỏi này để ghi nhớ cấu trúc và tránh lặp lại lỗi sai:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {wrongQuestions.slice(0, 4).map((wq: any, i: number) => {
              const label = wq.prompt?.wordZh || wq.prompt?.sentence || wq.prompt?.questionText || `Câu ${wq.sortOrder || i + 1}`;
              return (
                <div key={wq.id} className="p-3.5 rounded-xl bg-white border border-[#F3E8D6] text-xs space-y-1">
                  <div className="font-bold text-[#1F2937] font-chinese truncate">
                    • {label}
                  </div>
                  <div className="text-[#6B7280]">
                    Đáp án chuẩn: <span className="font-semibold text-[#22C55E]">
                      {typeof wq.correctAnswer === 'object' ? wq.correctAnswer?.value || JSON.stringify(wq.correctAnswer) : String(wq.correctAnswer)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs & Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3E8D6] pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#1F2937]">Danh sách chi tiết câu hỏi</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#6B7280] border border-[#F3E8D6]">
            {filteredQuestions.length} câu
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <button
              type="button"
              onClick={() => handleToggleAll(true)}
              className="text-xs text-[#6B7280] hover:text-[#1F2937] font-medium px-2 py-1"
            >
              Mở tất cả
            </button>
            <span className="text-[#F3E8D6]">|</span>
            <button
              type="button"
              onClick={() => handleToggleAll(false)}
              className="text-xs text-[#6B7280] hover:text-[#1F2937] font-medium px-2 py-1"
            >
              Thu gọn
            </button>
          </div>

          {(['ALL', 'WRONG', 'CORRECT'] as const).map((mode) => {
            const labels = {
              ALL: `Tất cả (${totalQuestions})`,
              WRONG: `Sai (${wrongCount})`,
              CORRECT: `Đúng (${correctCount})`,
            };
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setSelectedFilter(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === mode
                    ? 'bg-[#F59E0B] text-white shadow-sm'
                    : 'bg-white text-[#6B7280] border border-[#F3E8D6] hover:bg-[#FAF7F2]'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions Review List: Từng câu có trạng thái đúng/sai, cho phép mở/đóng */}
      <div className="space-y-4">
        {filteredQuestions.map((q: any, idx: number) => {
          const isExpanded = !!expandedQuestions[q.id];
          const hasAiExp = !!aiExplanations[q.id];
          const isAnalyzing = aiAnalyzingId === q.id;

          return (
            <div
              key={q.id}
              className="rounded-2xl bg-white border border-[#F3E8D6] shadow-sm overflow-hidden transition-all"
            >
              {/* Header câu hỏi: Số câu, Code, Trạng thái Đúng/Sai, Nút Mở/Đóng */}
              <div
                onClick={() => toggleExpand(q.id)}
                className="flex items-center justify-between p-4 bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] cursor-pointer transition-colors border-b border-[#F3E8D6]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-white border border-[#F3E8D6] font-bold text-xs flex items-center justify-center text-[#1F2937] shadow-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-mono font-medium text-[#6B7280]">{q.code}</span>
                    <span className="text-xs text-[#6B7280] ml-2">({q.type})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {q.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-[#22C55E] px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#22C55E]/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đúng (+{q.earnedScore}đ)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-[#EF4444] px-2.5 py-1 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/30">
                      <XCircle className="w-3.5 h-3.5" /> Sai (0đ)
                    </span>
                  )}

                  <button
                    type="button"
                    className="p-1 rounded-lg text-[#6B7280] hover:text-[#1F2937]"
                    title={isExpanded ? 'Thu gọn' : 'Mở chi tiết'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Chi tiết câu hỏi khi được mở */}
              {isExpanded && (
                <div className="p-6 space-y-5">
                  <QuestionRenderer
                    question={q}
                    userAnswer={q.userAnswer}
                    onChangeAnswer={() => {}}
                    readOnly={true}
                    showResult={true}
                    correctAnswer={q.correctAnswer}
                    explanation={q.explanation}
                  />

                  {/* Nút yêu cầu AI giải thích tự động cho các câu sai (Chuẩn bị kiến trúc AI) */}
                  {!q.isCorrect && (
                    <div className="pt-3 border-t border-[#F3E8D6]">
                      {!hasAiExp ? (
                        <button
                          type="button"
                          onClick={() => handleRequestAiExplanation(q)}
                          disabled={isAnalyzing}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#FFF7E6] text-[#D97706] border border-[#F59E0B]/30 transition-all disabled:opacity-50"
                        >
                          <BrainCircuit className="w-4 h-4 text-[#F59E0B]" />
                          <span>{isAnalyzing ? 'AI đang phân tích câu sai...' : 'Hỏi trợ lý AI phân tích lỗi sai'}</span>
                        </button>
                      ) : (
                        <div className="p-4 rounded-xl bg-[#FFF7E6] border border-[#F59E0B]/30 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#D97706]">
                            <BrainCircuit className="w-4 h-4 text-[#F59E0B]" />
                            <span>Trợ lý AI phân tích tự động</span>
                          </div>
                          <p className="text-xs text-[#1F2937] leading-relaxed">
                            {aiExplanations[q.id]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
