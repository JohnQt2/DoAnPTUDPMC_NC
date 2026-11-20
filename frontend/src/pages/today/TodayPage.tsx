import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { LucianLiquidButton, LucianXpBar, LucianStreakFlame } from '../../components/ui';
import { ArrowRight, Play, Route, BookOpen, Languages } from 'lucide-react';

export const TodayPage: React.FC = () => {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>('/users/roadmap').catch(() => null),
      api.get<any>('/users/me/progress').catch(() => null),
    ])
      .then(([rm, prog]) => {
        setRoadmap(rm?.roadmap || null);
        setProgress(prog || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const dailyMins = roadmap?.dailyCommitmentMins || 15;
  const targetGoal = roadmap?.targetGoal || 'HSK 1';
  const completedLessons = progress?.completedLessonsCount || 0;
  const totalLessons = progress?.totalLessonsCount || 16;
  const nextLessonId = progress?.nextLessonId || 1;

  const dailyActions = [
    {
      index: '01',
      href: '#/courses',
      icon: Route,
      label: 'LỘ TRÌNH CHÍNH',
      title: 'Học tiếp bài trong lộ trình',
      desc: 'Hoàn thành từng Unit theo tiến độ cá nhân để mở khóa chặng tiếp theo.',
    },
    {
      index: '02',
      href: '#/speak-learn',
      icon: Languages,
      label: 'PHÁT ÂM NỀN TẢNG',
      title: 'Ôn bảng chữ cái Pinyin',
      desc: 'Luyện nghe 63 âm chuẩn phổ thông, 4 thanh điệu và các cặp âm dễ nhầm.',
    },
    {
      index: '03',
      href: '#/vocab',
      icon: BookOpen,
      label: 'TỪ VỰNG & VIẾT NÉT',
      title: 'Ôn thẻ nhớ & tập viết chữ Hán',
      desc: 'Củng cố từ vựng theo lịch SRS và thực hành nét viết trên ô Điền Tự Cách.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-9 px-5 sm:px-8 space-y-8">
      {/* Crisp SaaS Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400">
            Không gian học hôm nay
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight mt-1">
            Chào {user?.displayName || 'bạn'}
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Mục tiêu <strong className="text-zinc-950 font-semibold">{dailyMins} phút/ngày</strong> · Lộ trình{' '}
            <strong className="text-[#BE123C] font-semibold">{targetGoal}</strong>
          </p>
        </div>

        <LucianStreakFlame count={completedLessons} unit="bài" subtitle="Đã hoàn thành" />
      </div>

      {/* Primary Action Surface */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-6 sm:p-7 ios-hero-glass space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-[#BE123C] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]" />
              Bài học kế tiếp
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-950 tracking-tight">
              {loading ? 'Đang chuẩn bị bài học...' : 'Tiếp tục chặng học hôm nay'}
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Mỗi phiên học gói gọn trong {dailyMins} phút: nghe hội thoại mẫu, nắm ngữ pháp trọng tâm và củng cố từ vựng.
            </p>
          </div>

          <LucianLiquidButton
            href={`#/lessons/${nextLessonId}`}
            variant="ink"
            size="lg"
            className="shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Vào học ngay</span>
          </LucianLiquidButton>
        </div>

        <div className="pt-5 border-t border-zinc-100">
          <LucianXpBar
            current={completedLessons}
            target={totalLessons}
            label={`Tiến độ lộ trình ${targetGoal}`}
          />
        </div>
      </motion.div>

      {/* Clean 3-Step Flow */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-zinc-500 font-semibold">
            Nhịp học đề xuất hôm nay
          </h3>
          <a
            href="#/courses"
            className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="glass-light glass-light-hover rounded-2xl p-5 flex flex-col justify-between gap-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-[#BE123C]">
                      {item.index}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 group-hover:text-zinc-950 group-hover:border-zinc-300 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                      {item.label}
                    </p>
                    <h4 className="font-display font-semibold text-[15px] text-zinc-950 group-hover:text-[#BE123C] transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-700 group-hover:text-zinc-950 transition-colors">
                  <span>Mở mục này</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
