import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { LucianLiquidButton, LucianXpBar, LucianStreakFlame, LUCIAN_EASE } from '../../components/ui';
import { Play, BookOpen, Languages, Route, ArrowRight } from 'lucide-react';

export const TodayPage: React.FC = () => {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [nextLessonId, setNextLessonId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [rm, prog] = await Promise.all([
          api.get<any>('/users/roadmap').catch(() => null),
          api.get<any>('/users/me/progress').catch(() => null),
        ]);
        setRoadmap(rm?.roadmap || null);
        setProgress(prog || null);
        if (rm?.recommendedFirstLessonId) {
          setNextLessonId(rm.recommendedFirstLessonId);
        } else if (rm?.lessons?.length > 0) {
          const next = rm.lessons.find((l: any) => !l.isCompleted) || rm.lessons[0];
          setNextLessonId(next.lessonId || next.lesson_id || 1);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dailyMins = roadmap?.daily_commitment_mins || roadmap?.dailyCommitmentMins || 15;
  const targetGoal = roadmap?.target_goal || roadmap?.targetGoal || 'HSK 1';
  const completedLessons = progress?.completedLessonsCount ?? progress?.completedLessons ?? 0;
  const totalLessons = progress?.totalLessonsCount || 16;

  const dailyActions = [
    {
      index: '01',
      href: '#/courses',
      icon: Route,
      label: 'LỘ TRÌNH CHÍNH',
      title: 'Học tiếp bài trong lộ trình',
      desc: 'Hoàn thành từng Unit theo tiến độ cá nhân để mở khóa chặng tiếp theo.',
      bar: 'bg-[#C41E3A]',
    },
    {
      index: '02',
      href: '#/speak-learn',
      icon: Languages,
      label: 'PHÁT ÂM NỀN TẢNG',
      title: 'Ôn bảng chữ cái Pinyin',
      desc: 'Luyện nghe 63 âm chuẩn phổ thông, 4 thanh điệu và cặp âm dễ nhầm.',
      bar: 'bg-[#D4A017]',
    },
    {
      index: '03',
      href: '#/vocab',
      icon: BookOpen,
      label: 'TỪ VỰNG & VIẾT NÉT',
      title: 'Ôn thẻ nhớ & tập viết chữ Hán',
      desc: 'Củng cố từ vựng theo lịch SRS và thực hành nét viết trên ô Điền Tự Cách.',
      bar: 'bg-[#00A86B]',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-9 px-5 sm:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#EAE3DE]">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#C41E3A] font-semibold">
            Bàn học hôm nay
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#181415] mt-1">
            Chào {user?.displayName || 'bạn'}
          </h1>
          <p className="text-sm text-[#5F5658] mt-1">
            Mục tiêu <strong className="text-[#181415] font-semibold">{dailyMins} phút/ngày</strong> · Lộ trình{' '}
            <strong className="text-[#C41E3A] font-semibold">{targetGoal}</strong>
          </p>
        </div>

        <LucianStreakFlame count={completedLessons} unit="bài" subtitle="Đã hoàn thành" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: LUCIAN_EASE }}
        className="rounded-2xl overflow-hidden ios-hero-glass"
      >
        <div className="h-1 bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#00A86B]" />
        <div className="p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#C41E3A] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C41E3A]" />
                Bài học kế tiếp
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-[#181415]">
                {loading ? 'Đang chuẩn bị bài học...' : 'Tiếp tục chặng học hôm nay'}
              </h2>
              <p className="text-sm text-[#5F5658] leading-relaxed">
                Học ngắn gọn từ vựng, nghe hội thoại mẫu và làm bài tập nhanh trong {dailyMins} phút.
              </p>
            </div>

            <LucianLiquidButton
              href={`#/lessons/${nextLessonId}`}
              variant="crimson"
              size="lg"
              className="shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Vào học ngay</span>
            </LucianLiquidButton>
          </div>

          <div className="pt-5 border-t border-[#EAE3DE]">
            <LucianXpBar
              current={completedLessons}
              target={totalLessons}
              label={`Tiến độ lộ trình ${targetGoal}`}
            />
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-[#5F5658] font-bold">
            Nhịp học đề xuất hôm nay
          </h3>
          <a
            href="#/courses"
            className="text-xs font-semibold text-[#C41E3A] hover:text-[#9E162E] inline-flex items-center gap-1 transition-colors"
          >
            <span>Toàn bộ lộ trình HSK 1–6</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dailyActions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.href}
                href={item.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.05, ease: LUCIAN_EASE }}
                className="glass-light glass-light-hover rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                <div className={`h-1 w-full ${item.bar}`} />
                <div className="p-5 flex-1 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-[#D4A017]">
                        {item.index}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#FAF8F6] border border-[#EAE3DE] text-[#C41E3A] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-mono tracking-widest text-[#5F5658] uppercase">
                        {item.label}
                      </p>
                      <h4 className="font-display font-bold text-base text-[#181415] group-hover:text-[#C41E3A] transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#5F5658] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EAE3DE] flex items-center justify-between text-xs font-semibold text-[#181415] group-hover:text-[#C41E3A] transition-colors">
                    <span>Mở mục này</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
