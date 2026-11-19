import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { celebrateSuccess } from '../../lib/celebration';
import { GlassCard, BorderBeam, NumberTicker, ShimmerButton } from '../../components/ui';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const TestResultPage: React.FC<{ submissionId: number }> = ({ submissionId }) => {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatAnswerText = (val: string | null | undefined, options?: any[]): string => {
    if (!val) return '(Bỏ trống)';
    const cleanVal = val.trim();
    if (!options || !Array.isArray(options) || options.length === 0) return cleanVal;

    // Nếu val là ký tự A, B, C, D đơn lẻ
    if (/^[A-Za-z]$/.test(cleanVal)) {
      const idx = cleanVal.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) {
        const opt = options[idx];
        const optStr = typeof opt === 'string' ? opt : (opt?.text || opt?.content || String(opt));
        if (/^[A-Za-z][\.\:\)\-\s]/.test(optStr)) return optStr;
        return `${cleanVal.toUpperCase()}. ${optStr}`;
      }
    }

    // Nếu val là chuỗi, tìm option khớp
    const matchedOpt = options.find((opt) => {
      const optStr = typeof opt === 'string' ? opt : (opt?.text || opt?.content || String(opt));
      return optStr.toLowerCase() === cleanVal.toLowerCase() ||
        optStr.toLowerCase().startsWith(cleanVal.toLowerCase() + '.');
    });

    if (matchedOpt) {
      return typeof matchedOpt === 'string' ? matchedOpt : (matchedOpt?.text || matchedOpt?.content || String(matchedOpt));
    }

    return cleanVal;
  };

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      const data = await api.get<any>(`/assessment/submissions/${submissionId}`);
      setResult(data);
      const passedThreshold = data?.passingScore || 60;
      if (data && data.score >= passedThreshold) {
        celebrateSuccess(
          `Chúc mừng bạn đạt ${Math.round(data.score)}%`,
          'fireworks',
          'Bạn đã vượt qua bài kiểm tra.'
        );
      }
    } catch (err) {
      console.error('Failed to load submission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
        <div className="h-48 rounded-3xl bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-3xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-gray-500">Không tìm thấy kết quả nộp bài.</p>
        <a href="#/courses" className="text-primary-600 font-bold underline">
          Quay lại khóa học
        </a>
      </div>
    );
  }

  const passThreshold = result.passingScore || 60;
  const isPassed = result.score >= passThreshold;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-8">
      {/* Result Hero Banner (Liquid Glass + BorderBeam + NumberTicker) */}
      <div
        className={`relative overflow-hidden rounded-[30px] p-8 sm:p-10 text-center space-y-4 shadow-2xl border ${
          isPassed
            ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white border-white/40'
            : 'bg-gradient-to-br from-rose-500 via-primary-600 to-amber-600 text-white border-white/40'
        }`}
      >
        <BorderBeam duration={7} colorFrom="#ffffff" colorTo="#fde047" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 items-center justify-center text-4xl shadow-inner mb-1">
            {isPassed ? '🏆' : '💪'}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {isPassed ? 'Chúc Mừng! Bạn Đã Đạt Chuẩn' : `Chưa Đạt Ngưỡng ${passThreshold}%`}
          </h1>

          <div className="text-6xl font-black tracking-tight font-mono">
            <NumberTicker value={Math.round(result.score)} suffix="%" />
          </div>

          <p className="text-sm text-white/90 max-w-md mx-auto leading-relaxed">
            {isPassed
              ? 'Bạn đã hoàn thành xuất sắc bài kiểm tra và mở khóa thành công chặng tiếp theo trên lộ trình!'
              : 'Hãy xem lại lời giải chi tiết tiếng Việt bên dưới để củng cố kiến thức và thử lại nhé.'}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <ShimmerButton
              href="#/exams"
              variant="glass-light"
              className="bg-white text-gray-900 border-white shadow-xl"
            >
              <BookOpen className="w-4 h-4 text-primary-600" />
              <span>Quay lại phòng thi</span>
            </ShimmerButton>
            <a
              href="#/courses"
              className="px-6 py-3 rounded-2xl bg-black/20 hover:bg-black/30 backdrop-blur-md text-white font-extrabold text-sm transition-all flex items-center gap-2"
            >
              <span>Tiếp tục lộ trình</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown of Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-gray-900">
          Chi tiết từng câu hỏi
        </h2>

        <div className="space-y-4">
          {result.details?.map((detail: any, idx: number) => (
            <GlassCard
              key={detail.questionId}
              className={`p-6 rounded-[26px] space-y-4 ${
                detail.isCorrect ? 'ring-1 ring-emerald-300/60' : 'ring-1 ring-rose-300/60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Câu {idx + 1}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">{detail.content}</h3>
                </div>

                <div className="shrink-0 mt-1">
                  {detail.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Chính xác
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50/90 border border-rose-200/70 px-3 py-1 rounded-full">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      Chưa đúng
                    </span>
                  )}
                </div>
              </div>

              {/* Answers comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-3.5 rounded-2xl border ${
                    detail.isCorrect
                      ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200/70 text-rose-900'
                  }`}
                >
                  <span className="text-gray-500 block mb-0.5">Lựa chọn của bạn:</span>
                  <span className="font-bold text-sm">{formatAnswerText(detail.userAnswer, detail.options)}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/60 border border-white/85 text-gray-900">
                  <span className="text-gray-500 block mb-0.5">Đáp án đúng:</span>
                  <span className="font-bold text-sm text-emerald-700">{formatAnswerText(detail.correctAnswer, detail.options)}</span>
                </div>
              </div>

              {/* Explanation */}
              {detail.explanation && (
                <div className="p-3.5 rounded-2xl bg-amber-50/65 border border-amber-200/70 text-xs text-amber-950 leading-relaxed">
                  <strong>Giải thích:</strong> {detail.explanation}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};
