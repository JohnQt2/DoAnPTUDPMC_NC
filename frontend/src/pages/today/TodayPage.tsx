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
      {/* Clean Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#16151B]/[0.08]">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#8E8A97]">
            Không gian học hôm nay
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#16151B] tracking-tight mt-1">
            Chào {user?.displayName || 'bạn'}
          </h1>
          <p className="text-sm text-[#57535F] mt-1">
            Mục tiêu <strong className="text-[#16151B]">{dailyMins} phút/ngày</strong> · Lộ trình{' '}
            <strong className="text-[#D93A55]">{targetGoal}</strong>
          </p>
        </div>

        <LucianStreakFlame count={completedLessons} unit="bài" subtitle="Đã hoàn thành" />
      </div>

      {/* Main iPhone Liquid Glass Hero Lens (transparent over live 3D WebGL backdrop) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 ios-hero-glass space-y-6"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#D93A55] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D93A55]" />
              Bài học kế tiếp
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#16151B] tracking-tight">
              {loading ? 'Đang chuẩn bị bài học...' : 'Tiếp tục chặng học hôm nay'}
            </h2>
            <p className="text-sm text-[#57535F] leading-relaxed">
              Mỗi phiên học gói gọn trong {dailyMins} phút: nghe hội thoại mẫu, nắm ngữ pháp trọng tâm và củng cố từ vựng.
            </p>
          </div>

          <LucianLiquidButton
            href={`#/lessons/${nextLessonId}`}
            variant="vermilion"
            size="lg"
            className="shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Vào học ngay</span>
          </LucianLiquidButton>
        </div>

        {/* Lucian #372 Fill-to-Level-Up XP Progress Bar */}
        <div className="relative z-10 pt-5 border-t border-[#16151B]/[0.07]">
          <LucianXpBar
            current={completedLessons}
            target={totalLessons}
            label={`Tiến độ lộ trình ${targetGoal}`}
          />
        </div>
      </motion.div>

      {/* Clean Editorial 3-Step Flow */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono uppercase tracking-[0.16em] text-[#57535F] font-bold">
            Nhịp học đề xuất hôm nay
          </h3>
          <a
            href="#/courses"
            className="text-xs font-bold text-[#16151B] hover:text-[#D93A55] inline-flex items-center gap-1 transition-colors"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                className="glass-light glass-light-hover rounded-[24px] p-5 flex flex-col justify-between gap-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#D93A55]">
                      {item.index}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-white/65 border border-white/90 text-[#16151B] group-hover:text-[#D93A55] flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono tracking-widest text-[#8E8A97] uppercase">
                      {item.label}
                    </p>
                    <h4 className="font-display font-bold text-[15px] text-[#16151B] group-hover:text-[#D93A55] transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#57535F] leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#16151B]/[0.07] flex items-center justify-between text-xs font-bold text-[#16151B] group-hover:text-[#D93A55] transition-colors">
                  <span>Mở mục này</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
