import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Volume2, ChevronRight, ChevronLeft } from 'lucide-react';
import { practiceAdminApi } from './practice-admin.api';
import { QuestionRenderer } from '../../../components/practice/QuestionRenderer';
import { GlassCard, ShimmerButton } from '../../../components/ui';
import { extractErrorMessage } from './practice-admin.utils';
import { appNotice } from '../../../lib/dialog';

export const PracticePreviewPage: React.FC<{ versionId: number }> = ({ versionId }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, any>>({});

  useEffect(() => {
    async function loadPreview() {
      try {
        setIsLoading(true);
        const res = await practiceAdminApi.previewVersion(versionId, showAnswers);
        setData(res);
      } catch (err: any) {
        const error = extractErrorMessage(err);
        appNotice(error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
  }, [versionId, showAnswers]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Đang tải chế độ xem trước...
      </div>
    );
  }

  if (!data) return null;

  const currentSet = data.exerciseSets[activeSetIndex];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Warning: This is preview mode */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>
            Chế độ xem trước của Ban quản trị: Thao tác làm bài ở đây là giả lập và không ghi lại kết quả hay tiến độ.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAnswers(!showAnswers)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-sm cursor-pointer"
        >
          {showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showAnswers ? 'Ẩn đáp án & giải thích' : 'Hiện đáp án & giải thích'}</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="text-right">
          <span className="font-mono text-xs font-bold text-slate-500">{data.collection.code}</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{data.collection.titleVi}</h2>
        </div>
      </div>

      {/* Tabs chuyển Exercise Set */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {data.exerciseSets.map((set: any, sIdx: number) => {
          const isActive = sIdx === activeSetIndex;
          return (
            <button
              key={set.id}
              type="button"
              onClick={() => setActiveSetIndex(sIdx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Phần {sIdx + 1}: {set.titleZh} ({set.questions.length} câu)
            </button>
          );
        })}
      </div>

      {/* Current Exercise Set Detail */}
      {currentSet && (
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase">
              <span>Kỹ năng: {currentSet.skill}</span>
              {currentSet.audioUrl && (
                <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] font-mono">
                  <Volume2 className="w-3.5 h-3.5" />
                  {currentSet.audioUrl}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold font-chinese text-slate-800 dark:text-slate-100">
              {currentSet.titleZh}
            </h3>
            {currentSet.instructions && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                {currentSet.instructions}
              </p>
            )}
          </div>

          {/* List Questions */}
          <div className="space-y-8">
            {currentSet.questions.map((q: any, qIdx: number) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-4"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Câu {q.sortOrder || qIdx + 1} ({q.score} điểm)</span>
                  <span className="font-mono text-[11px] text-slate-400">{q.code}</span>
                </div>

                <QuestionRenderer
                  question={q}
                  userAnswer={answersMap[q.id]}
                  onChangeAnswer={(val) => setAnswersMap((prev) => ({ ...prev, [q.id]: val }))}
                  showResult={showAnswers}
                  correctAnswer={q.answer}
                  explanation={q.explanation}
                />
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
