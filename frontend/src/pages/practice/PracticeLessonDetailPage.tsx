import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { GlassCard, ShimmerButton } from '../../components/ui';
import { ArrowLeft, Clock, Headphones, BookOpen, Volume2, PenTool, CheckCircle2, ChevronRight, Award } from 'lucide-react';

interface PracticeLessonDetailPageProps {
  levelCode: string;
  lessonId: number;
}

export const PracticeLessonDetailPage: React.FC<PracticeLessonDetailPageProps> = ({ levelCode, lessonId }) => {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<any>(`/practice/lessons/${lessonId}`)
      .then((res) => setLesson(res.data))
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'LISTENING':
        return <Headphones className="w-5 h-5 text-amber-400" />;
      case 'READING':
        return <BookOpen className="w-5 h-5 text-sky-400" />;
      case 'PHONETICS':
        return <Volume2 className="w-5 h-5 text-emerald-400" />;
      case 'HANZI':
        return <PenTool className="w-5 h-5 text-purple-400" />;
      default:
        return <Award className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Navigation back */}
      <div className="flex items-center gap-3">
        <a
          href={`#/practice/${levelCode}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Danh sách bài học {levelCode}
        </a>
      </div>

      {/* Lesson Header Banner */}
      {loading ? (
        <div className="h-40 rounded-3xl bg-slate-900/50 animate-pulse border border-slate-800" />
      ) : lesson ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-400 text-slate-950">
              Bài {lesson.lessonNumber}
            </span>
            <span className="text-xs text-slate-400">{lesson.level?.name || levelCode}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-chinese tracking-tight">
            {lesson.titleZh}
          </h1>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300">
            {lesson.titlePinyin && <span className="text-amber-400 font-medium">{lesson.titlePinyin}</span>}
            {lesson.titleVi && <span className="text-slate-400">• {lesson.titleVi}</span>}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400">Không tìm thấy bài học này.</div>
      )}

      {/* Exercise Sets List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Các phần bài tập trong bài
        </h2>

        {lesson?.exerciseSets?.map((set: any) => (
          <GlassCard
            key={set.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/40 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center flex-shrink-0">
                {getSkillIcon(set.skill)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100 font-chinese">
                    {set.titleZh}
                  </h3>
                  {set.titleVi && (
                    <span className="text-xs text-slate-400">({set.titleVi})</span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  {set.instructions || 'Luyện tập theo chuẩn đề thi HSK.'}
                </p>

                <div className="flex items-center gap-4 pt-1 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ~{set.estimatedMinutes} phút
                  </span>
                  <span>•</span>
                  <span>{set._count?.questions || 0} câu hỏi</span>
                  {set.audioUrl && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 flex items-center gap-1">
                        <Headphones className="w-3 h-3" /> Kèm file nghe MP3
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 self-end sm:self-center">
              <a
                href={`#/practice/exercise/${set.id}`}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <span>Bắt đầu làm</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
