import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { GlassCard, ShimmerButton } from '../../components/ui';
import { BookOpen, CheckCircle2, ChevronRight, Headphones, FileText, ArrowLeft, Clock } from 'lucide-react';

interface PracticeLessonsPageProps {
  levelCode: string;
}

export const PracticeLessonsPage: React.FC<PracticeLessonsPageProps> = ({ levelCode }) => {
  const [level, setLevel] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>(`/practice/levels/${levelCode}`).catch(() => ({ data: null })),
      api.get<any>(`/practice/levels/${levelCode}/lessons`).catch(() => ({ data: [] })),
      api.get<any>(`/practice/progress/levels/${levelCode}`).catch(() => ({ data: { lessons: [] } })),
    ])
      .then(([lvlRes, lesRes, progRes]) => {
        setLevel(lvlRes.data);
        setLessons(lesRes.data || []);
        const pMap: Record<number, any> = {};
        if (progRes.data?.lessons) {
          progRes.data.lessons.forEach((p: any) => {
            pMap[p.lessonId] = p;
          });
        }
        setProgressMap(pMap);
      })
      .finally(() => setLoading(false));
  }, [levelCode]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Navigation back */}
      <div className="flex items-center gap-3">
        <a
          href="#/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tất cả cấp độ
        </a>
      </div>

      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/30">
            {levelCode}
          </span>
          <span className="text-xs text-slate-400">Giáo trình chuẩn HSK</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-chinese">
          {level?.name || `Luyện tập sách bài tập ${levelCode}`}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Chọn bài học để bắt đầu luyện tập các kỹ năng: Nghe, Đọc, Ngữ âm và Chữ Hán.
        </p>
      </div>

      {/* Lesson List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900/40 animate-pulse border border-slate-800" />
          ))
        ) : lessons.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chưa có bài học nào được xuất bản.</div>
        ) : (
          lessons.map((lesson) => {
            const prog = progressMap[lesson.id];
            const isCompleted = prog?.completionPercent === 100;
            const isReady = lesson.exerciseSets && lesson.exerciseSets.length > 0;

            return (
              <GlassCard
                key={lesson.id}
                className={`p-4 sm:p-5 flex items-center justify-between transition-all ${
                  isReady ? 'hover:border-amber-500/40' : 'opacity-70'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isReady
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : lesson.lessonNumber}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold font-chinese text-slate-100 truncate">
                        Bài {lesson.lessonNumber}: {lesson.titleZh}
                      </span>
                      {lesson.titlePinyin && (
                        <span className="text-xs text-amber-400/80 hidden sm:inline">
                          ({lesson.titlePinyin})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {lesson.titleVi || 'Luyện tập theo bài học'}
                    </div>

                    {/* Skill pills */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {lesson.exerciseSets?.map((set: any) => (
                        <span
                          key={set.id}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        >
                          {set.titleZh} ({set._count?.questions || 0} câu)
                        </span>
                      ))}
                      {(!lesson.exerciseSets || lesson.exerciseSets.length === 0) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500">
                          Đang rà soát dữ liệu (NEEDS_REVIEW)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {prog && prog.completionPercent > 0 && (
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-amber-400">{prog.completionPercent}%</div>
                      <div className="text-[10px] text-slate-500">Điểm cao: {prog.bestScore}</div>
                    </div>
                  )}

                  {isReady ? (
                    <a
                      href={`#/practice/${levelCode}/lessons/${lesson.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1 shadow-md shadow-amber-500/20"
                    >
                      <span>{prog && prog.completionPercent > 0 ? 'Tiếp tục' : 'Luyện tập'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-500 cursor-not-allowed"
                    >
                      Chờ duyệt
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};
