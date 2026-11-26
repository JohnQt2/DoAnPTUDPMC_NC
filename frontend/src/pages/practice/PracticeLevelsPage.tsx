import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { GlassCard, ShimmerButton } from '../../components/ui';
import { BookOpen, Award, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface PracticeLevelsPageProps {
  embedded?: boolean;
}

export const PracticeLevelsPage: React.FC<PracticeLevelsPageProps> = ({ embedded = false }) => {
  const [levels, setLevels] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>('/practice/levels').catch(() => ({ data: [] })),
      api.get<any>('/practice/progress').catch(() => ({ data: { levels: [] } })),
    ])
      .then(([lvlRes, progRes]) => {
        setLevels(lvlRes.data || []);
        setProgress(progRes.data || { levels: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const getLevelProgress = (code: string) => {
    if (!progress?.levels) return null;
    return progress.levels.find((l: any) => l.levelCode === code);
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-8 ${embedded ? 'pb-4' : 'pb-16'}`}>
      {/* Hero header */}
      {!embedded && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-8 border border-amber-500/20">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Luyện tập sách bài tập chuẩn HSK 3.0
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Luyện tập sách bài tập
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Làm trực tiếp toàn bộ bài tập Nghe, Đọc, Ngữ âm và Tập viết chữ Hán theo chuẩn Giáo trình chuẩn HSK. Chấm điểm tức thì, giải thích chi tiết và lưu tiến độ học tập.
            </p>
          </div>
        </div>
      )}

      {/* Level cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-900/40 animate-pulse border border-slate-800" />
          ))
        ) : (
          levels.map((lvl) => {
            const prog = getLevelProgress(lvl.code);
            const isHsk1 = lvl.code === 'HSK1';

            return (
              <GlassCard
                key={lvl.id}
                className="p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-400 tracking-wider">
                      {lvl.code}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      15 Bài học + Đề thi
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {lvl.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {lvl.description || 'Luyện tập toàn diện 4 kỹ năng sách bài tập.'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Tiến độ hoàn thành</span>
                      <span className="font-semibold text-amber-400">
                        {prog?.completionPercent || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${prog?.completionPercent || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <ShimmerButton
                    href={`#/practice/${lvl.code}`}
                    className="w-full justify-center flex items-center gap-2"
                  >
                    <span>Vào luyện tập</span>
                    <ArrowRight className="w-4 h-4" />
                  </ShimmerButton>
                </div>
              </GlassCard>
            );
          })
        )}

        {/* Coming soon cards for HSK2-6 */}
        {['HSK2', 'HSK3'].map((code) => (
          <div
            key={code}
            className="p-6 rounded-3xl bg-slate-900/20 border border-slate-800/50 flex flex-col justify-between opacity-60"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-500">{code}</span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-500">
                  Sắp ra mắt
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-400">HSK Cấp độ {code.replace('HSK', '')}</h3>
                <p className="text-xs text-slate-500 mt-1">Dữ liệu đang được biên soạn chuẩn theo giáo trình.</p>
              </div>
            </div>
            <div className="pt-6">
              <button disabled className="w-full py-2.5 rounded-xl bg-slate-800/40 text-slate-600 text-sm font-semibold cursor-not-allowed">
                Đang chuẩn bị
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
