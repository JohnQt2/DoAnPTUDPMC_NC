import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export const TestResultPage: React.FC<{ submissionId: number }> = ({ submissionId }) => {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      const data = await api.get<any>(`/assessment/submissions/${submissionId}`);
      setResult(data);
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

  const isPassed = result.score >= (result.passingScore || 80);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-8">
      {/* Result Hero Banner */}
      <div
        className={`rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-xl border ${
          isPassed
            ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white border-emerald-400'
            : 'bg-gradient-to-b from-red-500 to-red-700 text-white border-red-400'
        }`}
      >
        <div className="inline-flex w-20 h-20 rounded-full bg-white/20 backdrop-blur-md items-center justify-center text-4xl shadow-inner mb-2">
          {isPassed ? '🎉' : '💪'}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {isPassed ? 'Chúc Mừng! Bạn Đã Đạt Chuẩn' : 'Chưa Đạt Ngưỡng 80%'}
        </h1>

        <div className="text-6xl font-black tracking-tight font-mono">
          {result.score}%
        </div>

        <p className="text-sm text-white/90 max-w-md mx-auto leading-relaxed">
          {isPassed
            ? 'Bạn đã hoàn thành xuất sắc bài kiểm tra và mở khóa thành công bài học tiếp theo trên lộ trình!'
            : 'Hãy xem lại các câu trả lời sai bên dưới để củng cố kiến thức và thử làm lại nhé.'}
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <a
            href="#/courses"
            className="px-6 py-3 rounded-2xl bg-white text-gray-900 font-extrabold text-xs shadow-md hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Tiếp tục lộ trình
          </a>
        </div>
      </div>

      {/* Detailed Breakdown of Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Chi Tiết Đánh Giá Từng Câu Hỏi
        </h2>

        <div className="space-y-4">
          {result.details?.map((detail: any, idx: number) => (
            <div
              key={detail.questionId}
              className={`p-6 rounded-3xl border bg-white shadow-sm space-y-4 ${
                detail.isCorrect ? 'border-emerald-200' : 'border-red-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">
                    Câu {idx + 1}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">{detail.content}</h3>
                </div>

                <div className="shrink-0 mt-1">
                  {detail.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Chính xác
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Chưa đúng
                    </span>
                  )}
                </div>
              </div>

              {/* Answers comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-3 rounded-xl border ${
                    detail.isCorrect
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                      : 'bg-red-50/50 border-red-100 text-red-900'
                  }`}
                >
                  <span className="text-gray-400 block mb-0.5">Lựa chọn của bạn:</span>
                  <span className="font-bold text-sm">{detail.userAnswer || '(Bỏ trống)'}</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-900">
                  <span className="text-gray-400 block mb-0.5">Đáp án chính xác:</span>
                  <span className="font-bold text-sm text-emerald-700">{detail.correctAnswer}</span>
                </div>
              </div>

              {/* Pedagogical Explanation */}
              {detail.explanation && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 leading-relaxed">
                  💡 <strong>Giải thích sư phạm:</strong> {detail.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
