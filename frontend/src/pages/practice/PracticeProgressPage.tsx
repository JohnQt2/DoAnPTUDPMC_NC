import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { GlassCard, ShimmerButton } from '../../components/ui';
import { TrendingUp, BookOpen, CheckCircle2, Award, Clock, ArrowRight } from 'lucide-react';

export const PracticeProgressPage: React.FC = () => {
  const [overall, setOverall] = useState<any>(null);
  const [levelProgress, setLevelProgress] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('HSK1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<any>('/practice/progress').catch(() => ({ data: { levels: [] } })),
      api.get<any>(`/practice/progress/levels/${selectedLevel}`).catch(() => ({ data: { lessons: [] } })),
    ])
      .then(([ovRes, lvlRes]) => {
        setOverall(ovRes.data);
        setLevelProgress(lvlRes.data);
      })
      .finally(() => setLoading(false));
  }, [selectedLevel]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <TrendingUp className="w-3.5 h-3.5" />
          Tiến độ luyện tập sách bài tập
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Theo dõi tiến trình học tập
        </h1>
        <p className="text-sm text-slate-400 max-w-xl">
          Tổng hợp kết quả làm bài tập, tỷ lệ hoàn thành theo từng bài và điểm số cao nhất của bạn trong toàn bộ khóa học.
        </p>
      </div>

      {/* Level selector tabs */}
      <div className="flex items-center gap-2">
        {['HSK1', 'HSK2', 'HSK3'].map((code) => {
          const isSelected = selectedLevel === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedLevel(code)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {code}
            </button>
          );
        })}
      </div>

      {/* Lessons Progress Table / Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-200">
          Tiến độ các bài học - {selectedLevel}
        </h2>

        {loading ? (
          <div className="h-48 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
        ) : !levelProgress?.lessons || levelProgress.lessons.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chưa có dữ liệu tiến độ.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {levelProgress.lessons.map((les: any) => {
              const isCompleted = les.completionPercent === 100;
              return (
                <GlassCard key={les.lessonId} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : les.lessonNumber}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100 font-chinese">
                          Bài {les.lessonNumber}: {les.titleZh}
                        </div>
                        <div className="text-xs text-slate-400">{les.titleVi}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400">{les.completionPercent}%</div>
                      <div className="text-[10px] text-slate-500">Điểm: {les.bestScore}</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${les.completionPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href={`#/practice/${selectedLevel}/lessons/${les.lessonId}`}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>Vào học</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
