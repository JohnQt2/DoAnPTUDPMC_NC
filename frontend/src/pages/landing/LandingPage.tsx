import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  ArrowRight,
  BookOpen,
  Mic,
  FileText,
  Route,
  CheckCircle2,
  Sparkles,
  Flame,
  PenTool,
  GraduationCap,
} from 'lucide-react';
import { GlassCard, ShimmerButton, Marquee, BlurText, NumberTicker, BorderBeam } from '../../components/ui';

const DEMO_CHARACTERS = [
  { hanzi: '你', pinyin: 'nǐ', tone: 'Thanh 3', meaning: 'Bạn', example: '你好 — Xin chào' },
  { hanzi: '好', pinyin: 'hǎo', tone: 'Thanh 3', meaning: 'Tốt, khỏe', example: '很好 — Rất tốt' },
  { hanzi: '学', pinyin: 'xué', tone: 'Thanh 2', meaning: 'Học tập', example: '学习 — Học hành' },
  { hanzi: '汉', pinyin: 'hàn', tone: 'Thanh 4', meaning: 'Chữ Hán', example: '汉语 — Tiếng Hán' },
];

const MARQUEE_VOCAB = [
  { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào', level: 'HSK 1' },
  { hanzi: '谢谢', pinyin: 'xiè xie', meaning: 'Cảm ơn', level: 'HSK 1' },
  { hanzi: '学习', pinyin: 'xué xí', meaning: 'Học tập', level: 'HSK 1' },
  { hanzi: '朋友', pinyin: 'péng you', meaning: 'Bạn bè', level: 'HSK 1' },
  { hanzi: '准备', pinyin: 'zhǔn bèi', meaning: 'Chuẩn bị', level: 'HSK 2' },
  { hanzi: '希望', pinyin: 'xī wàng', meaning: 'Hy vọng', level: 'HSK 2' },
  { hanzi: '环境', pinyin: 'huán jìng', meaning: 'Môi trường', level: 'HSK 3' },
  { hanzi: '文化', pinyin: 'wén huà', meaning: 'Văn hóa', level: 'HSK 3' },
  { hanzi: '坚持', pinyin: 'jiān chí', meaning: 'Kiên trì', level: 'HSK 4' },
  { hanzi: '发展', pinyin: 'fā zhǎn', meaning: 'Phát triển', level: 'HSK 4' },
];

const BENTO_FEATURES = [
  {
    icon: Route,
    title: 'Lộ trình cá nhân hóa HSK 1–6',
    desc: 'Khảo sát trình độ & quỹ thời gian thực tế để tự động đề xuất lộ trình từng Unit phù hợp nhất với bạn.',
    badge: 'Cá nhân hóa',
    span: 'lg:col-span-2',
    accent: 'from-primary-500/25 to-rose-500/10',
  },
  {
    icon: PenTool,
    title: 'Tập viết chữ Hán & Thẻ ghi nhớ',
    desc: 'Ôn từ vựng theo lịch lặp lại thông minh kết hợp khung Điền Tự Cách luyện viết từng nét chuẩn.',
    badge: 'Ghi nhớ lâu',
    span: 'lg:col-span-1',
    accent: 'from-secondary-500/25 to-amber-500/10',
  },
  {
    icon: Mic,
    title: 'Học phát âm & Luyện nói 4 thanh điệu',
    desc: 'Bảng Pinyin trực quan kèm đo cao độ giọng nói và luyện câu giao tiếp theo tình huống.',
    badge: 'Phát âm chuẩn',
    span: 'lg:col-span-1',
    accent: 'from-emerald-500/25 to-teal-500/10',
  },
  {
    icon: FileText,
    title: 'Đề thi thử HSK & Theo dõi tiến độ',
    desc: 'Làm bài kiểm tra mô phỏng theo từng cấp độ, chấm điểm tức thì và lưu biểu đồ tiến độ mỗi ngày.',
    badge: 'Thi thử HSK',
    span: 'lg:col-span-2',
    accent: 'from-indigo-500/25 to-primary-500/10',
  },
];

export const LandingPage: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeChar = DEMO_CHARACTERS[selectedIdx];

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(activeChar.hanzi);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="text-white">
      {/* ── HERO SECTION ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md text-xs font-semibold text-secondary-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
              <span>Lộ trình học tiếng Trung chuẩn HSK 1 – 6 cho người Việt</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-white leading-[1.12]">
              <BlurText text="Chinh phục tiếng Trung" className="justify-center lg:justify-start" />
              <span className="block mt-1 bg-gradient-to-r from-primary-400 via-rose-300 to-secondary-300 bg-clip-text text-transparent">
                dễ dàng cùng Hanzi4U
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-white/65 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Chỉ 15 phút mỗi ngày với lộ trình cá nhân hóa: học Pinyin chuẩn 4 thanh điệu, luyện viết chữ Hán, ôn từ bằng thẻ nhớ thông minh và làm đề thi thử HSK.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <ShimmerButton href="#/login" size="lg" className="w-full sm:w-auto">
                <span>Đăng nhập vào học</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
              <ShimmerButton
                href="#/login?tab=register"
                variant="glass-dark"
                size="lg"
                className="w-full sm:w-auto"
              >
                <span>Tạo tài khoản mới</span>
              </ShimmerButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-white/55"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Miễn phí bắt đầu
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Khảo sát & tạo lộ trình riêng
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Học mọi lúc trên Web & Mobile
              </span>
            </motion.div>
          </div>

          {/* Right Interactive Glass Hanzi Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <GlassCard
              variant="dark"
              className="w-full max-w-sm p-6 space-y-5 relative overflow-hidden"
            >
              <BorderBeam duration={7} colorFrom="#f43f5e" colorTo="#fbbf24" />
              {/* Subtle top glow inside card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-primary-500/25 blur-3xl"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                  Trải nghiệm thẻ chữ Hán
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-500/20 text-primary-300 border border-primary-400/30">
                  HSK 1
                </span>
              </div>

              {/* Character Switcher */}
              <div className="grid grid-cols-4 gap-2">
                {DEMO_CHARACTERS.map((item, idx) => {
                  const isActive = idx === selectedIdx;
                  return (
                    <button
                      key={item.hanzi}
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className={`relative py-2.5 rounded-xl font-chinese font-bold text-lg transition-all cursor-pointer ${
                        isActive
                          ? 'text-white'
                          : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="landing-demo-pill"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary-600 to-rose-500 shadow-md shadow-primary-600/30"
                        />
                      )}
                      <span className="relative z-10">{item.hanzi}</span>
                    </button>
                  );
                })}
              </div>

              {/* TianZiGe Interactive Display */}
              <div className="relative text-center py-7 px-4 rounded-2xl border border-white/15 bg-black/25 overflow-hidden">
                <button
                  type="button"
                  onClick={handleSpeak}
                  aria-label="Nghe phát âm"
                  className={`absolute top-3 right-3 w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-primary-500 text-white border-primary-400 scale-105 shadow-lg shadow-primary-500/40'
                      : 'bg-white/10 text-white/85 hover:bg-white/20 border-white/15'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChar.hanzi}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-2"
                  >
                    <span className="text-7xl font-bold font-chinese text-white block drop-shadow-[0_4px_20px_rgba(196,30,58,0.35)]">
                      {activeChar.hanzi}
                    </span>
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xl font-extrabold text-secondary-300">
                        {activeChar.pinyin}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/65">
                        {activeChar.tone}
                      </span>
                    </div>
                    <p className="text-sm text-white/85 font-semibold">{activeChar.meaning}</p>
                    <p className="text-xs text-white/45 pt-1">{activeChar.example}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* ── STATS STRIP (NumberTicker) ── */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: GraduationCap, label: 'Cấp độ chuẩn hóa', value: 6, prefix: 'HSK 1–', suffix: '' },
            { icon: BookOpen, label: 'Từ vựng cốt lõi', value: 5000, prefix: '', suffix: '+' },
            { icon: Flame, label: 'Thời lượng mỗi ngày', value: 15, prefix: '', suffix: ' phút' },
            { icon: Sparkles, label: 'Chủ đề giao tiếp', value: 60, prefix: '', suffix: '+' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <GlassCard
                key={stat.label}
                variant="dark"
                className="px-5 py-4 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-secondary-300 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-white leading-tight">
                    <NumberTicker value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-white/50 font-medium">{stat.label}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* ── MAGIC UI VOCABULARY MARQUEE ── */}
      <section className="py-6 border-y border-white/[0.08] bg-black/20">
        <Marquee fadeColor="#14080c">
          {MARQUEE_VOCAB.map((word) => (
            <div
              key={word.hanzi}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md"
            >
              <span className="font-chinese text-2xl font-bold text-white">{word.hanzi}</span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-secondary-300">{word.pinyin}</p>
                <p className="text-xs text-white/60">{word.meaning}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-500/20 text-primary-300">
                {word.level}
              </span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── BENTO GRID FEATURES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary-300">
            Hệ sinh thái học tập toàn diện
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Mọi công cụ bạn cần để giỏi tiếng Trung
          </h2>
          <p className="text-sm sm:text-base text-white/55">
            Thiết kế khoa học, trực quan và bám sát khung năng lực HSK giúp bạn tiến bộ rõ rệt sau từng tuần.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {BENTO_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <GlassCard
                key={feat.title}
                variant="dark"
                hoverable
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`p-7 relative overflow-hidden ${feat.span}`}
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${feat.accent} blur-3xl`}
                />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-secondary-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/75 border border-white/10">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">{feat.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{feat.desc}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <GlassCard
          variant="dark"
          className="mt-14 p-8 sm:p-10 text-center space-y-5 relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-600/15 via-transparent to-secondary-500/15"
          />
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Sẵn sàng tạo lộ trình HSK của riêng bạn?
            </h3>
            <p className="text-sm text-white/60">
              Chỉ mất 1 phút làm khảo sát đầu vào để mở khóa bài học đầu tiên phù hợp nhất với trình độ hiện tại.
            </p>
            <div className="pt-2">
              <ShimmerButton href="#/login?tab=register" size="lg">
                <span>Tạo tài khoản miễn phí</span>
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
