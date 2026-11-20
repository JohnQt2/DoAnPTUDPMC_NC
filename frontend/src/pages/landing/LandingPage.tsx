import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, ArrowRight, ArrowUpRight } from 'lucide-react';
import { ThreeLiquidHeroScene } from '../../components/three/ThreeLiquidHeroScene';
import { LucianLiquidButton, MaskedHeadline } from '../../components/ui';

const SPECIMEN_CHARS = [
  { hanzi: '汉', pinyin: 'hàn', tone: 'Thanh 4', meaning: 'Chữ Hán', phrase: '汉语 · Tiếng Hán' },
  { hanzi: '你', pinyin: 'nǐ', tone: 'Thanh 3', meaning: 'Bạn', phrase: '你好 · Xin chào' },
  { hanzi: '学', pinyin: 'xué', tone: 'Thanh 2', meaning: 'Học tập', phrase: '学习 · Học hành' },
  { hanzi: '道', pinyin: 'dào', tone: 'Thanh 4', meaning: 'Đạo · Con đường', phrase: '知道 · Hiểu biết' },
];

const EDITORIAL_PILLARS = [
  {
    index: '01',
    tag: 'LỘ TRÌNH HSK 1–6',
    title: 'Học theo từng chặng ngắn, rõ tiến độ từng ngày',
    desc: 'Khảo sát trình độ đầu vào để sắp xếp sẵn Unit phù hợp — mỗi bài kết hợp hội thoại, ngữ pháp cốt lõi và kiểm tra mở khóa.',
    meta: '15–30 phút / ngày',
  },
  {
    index: '02',
    tag: 'BẢNG CHỮ CÁI & THANH ĐIỆU',
    title: 'Đủ 63 âm Pinyin chuẩn phổ thông, nghe và phân biệt trực tiếp',
    desc: '23 thanh mẫu, 24 vận mẫu và 16 âm tiết đọc thẳng gắn khẩu hình cụ thể, 4 thanh điệu và bài luyện nghe cặp âm dễ nhầm.',
    meta: '63 âm Pinyin chuẩn',
  },
  {
    index: '03',
    tag: 'THƯ PHÁP & GHI NHỚ SRS',
    title: 'Xem thứ tự từng nét cọ, tập viết tay và ôn lại đúng lúc sắp quên',
    desc: 'Mô phỏng nét viết chuẩn MakeMeAHanzi cho từng chữ Hán kèm bảng vẽ cảm ứng và thuật toán lặp lại ngắt quãng SM-2.',
    meta: 'Tự tách chữ · Ôn SRS',
  },
  {
    index: '04',
    tag: 'PHÒNG THI MÔ PHỎNG',
    title: '30 đề thi thử & 18 bộ sách bài tập theo từng cấp độ HSK',
    desc: 'Chấm điểm tức thì, giải thích đáp án rõ ràng và giữ phiên làm bài ổn định xuyên suốt buổi thi.',
    meta: 'HSK 1 → HSK 6',
  },
];

const HSK_STRIP = [
  { level: 'HSK 1', words: '150 từ', focus: 'Chào hỏi & Pinyin nền tảng' },
  { level: 'HSK 2', words: '300 từ', focus: 'Sinh hoạt & giao tiếp hằng ngày' },
  { level: 'HSK 3', words: '600 từ', focus: 'Học tập, du lịch & công việc' },
  { level: 'HSK 4', words: '1.200 từ', focus: 'Đọc hiểu & thảo luận độc lập' },
  { level: 'HSK 5', words: '2.500 từ', focus: 'Báo chí, phim ảnh & thuyết trình' },
  { level: 'HSK 6', words: '5.000+ từ', focus: 'Thành ngữ & tiếng Trung học thuật' },
];

export const LandingPage: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const active = SPECIMEN_CHARS[selectedIdx];

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(active.hanzi);
    u.lang = 'zh-CN';
    u.rate = 0.82;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="text-[#F4F2EE]">
      {/* ── 01. EDITORIAL 3D HERO (Lettra × ThreeUI × Lucian #216/#001) ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="inline-flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-white/55"
            >
              <span className="w-2 h-2 rounded-full bg-[#D93A55]" />
              <span>Hanzi4U · Học tiếng Trung chuẩn HSK 1–6</span>
            </motion.div>

            <MaskedHeadline
              lines={['Tiếng Trung bài bản,', 'tinh gọn từng nét chữ.']}
              accentLineIndex={1}
              className="text-4xl sm:text-5xl lg:text-[56px] text-[#F4F2EE]"
            />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-[15.5px] sm:text-base text-white/60 max-w-lg leading-relaxed"
            >
              Học Pinyin 63 âm chuẩn phổ thông, xem thứ tự từng nét thư pháp, ghi nhớ từ vựng bằng
              thẻ lặp lại ngắt quãng và thi thử HSK trong một không gian tập trung, gọn gàng.
            </motion.p>

            {/* Lucian #001 Magnetic Liquid Glass CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <LucianLiquidButton href="#/login" variant="vermilion" size="lg">
                <span>Bắt đầu học ngay</span>
                <ArrowRight className="w-4 h-4" />
              </LucianLiquidButton>
              <LucianLiquidButton href="#/login?tab=register" variant="glass-dark" size="lg">
                <span>Tạo tài khoản miễn phí</span>
              </LucianLiquidButton>
            </motion.div>

            {/* Quiet Hairline Editorial Stats (OTTO / Zero style) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.65, delay: 0.55 }}
              className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[0.09] max-w-md"
            >
              <div>
                <p className="font-display text-2xl font-extrabold text-white tabular-nums">63</p>
                <p className="text-[11px] text-white/45 mt-0.5">Âm Pinyin chuẩn</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold text-white tabular-nums">HSK 1–6</p>
                <p className="text-[11px] text-white/45 mt-0.5">Lộ trình cá nhân</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold text-white tabular-nums">48+</p>
                <p className="text-[11px] text-white/45 mt-0.5">Bộ đề & bài tập</p>
              </div>
            </motion.div>
          </div>

          {/* Right Interactive 3D Liquid Glass Stage (ThreeUI WebGL Physical Glass + Floating iPhone Glass Bar) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative h-[430px] sm:h-[490px] w-full rounded-[32px] border border-white/[0.09] bg-white/[0.02] overflow-hidden">
              {/* Real-Time Interactive 3D Liquid Crystal Sculpture + Floating Hanzi */}
              <ThreeLiquidHeroScene activeHanzi={active.hanzi} mode="dark" className="w-full h-full" />

              {/* Top-left subtle gallery tag */}
              <div className="pointer-events-none absolute top-5 left-5 flex items-center gap-2 text-[11px] font-mono text-white/45">
                <span>SPECIMEN · 3D GLASS</span>
                <span className="text-white/20">/</span>
                <span className="text-white/75">{active.tone}</span>
              </div>

              {/* Bottom Floating iPhone Liquid Glass Interactive Control Dock */}
              <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5 p-3 sm:p-3.5 rounded-[24px] bg-white/[0.07] backdrop-blur-2xl border border-white/[0.18] shadow-[0_20px_48px_rgba(0,0,0,0.45),inset_0_1.5px_1px_rgba(255,255,255,0.28)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                {/* Character Selector Pills */}
                <div className="flex items-center gap-1.5">
                  {SPECIMEN_CHARS.map((item, idx) => {
                    const isSelected = idx === selectedIdx;
                    return (
                      <button
                        key={item.hanzi}
                        type="button"
                        onClick={() => setSelectedIdx(idx)}
                        className={`w-10 h-10 rounded-xl font-hanzi-serif text-lg font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-[#16151B] shadow-md'
                            : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.14] hover:text-white'
                        }`}
                      >
                        {item.hanzi}
                      </button>
                    );
                  })}
                </div>

                {/* Live Reading Info + Audio */}
                <div className="flex items-center gap-3 ml-auto">
                  <div className="text-right leading-tight">
                    <p className="text-sm font-mono font-bold text-white">
                      {active.pinyin}{' '}
                      <span className="font-sans font-normal text-white/55">· {active.meaning}</span>
                    </p>
                    <p className="text-[11px] text-white/45 mt-0.5">{active.phrase}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSpeak}
                    aria-label={`Nghe phát âm chữ ${active.hanzi}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                      isSpeaking
                        ? 'bg-[#D93A55] border-[#D93A55] text-white scale-105'
                        : 'bg-white/[0.10] hover:bg-[#D93A55] border-white/20 text-white'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 02. EDITORIAL FEATURE INDEX (Hairline Catalogue inspired by OTTO & Zero) ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40">
              Cấu trúc học tập
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#F4F2EE] tracking-tight">
              Bốn trụ cột để tự tin dùng tiếng Trung
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-white/50 max-w-sm">
            Mọi công cụ cần thiết đều gói gọn trong một giao diện tĩnh lặng, không quảng cáo, không xao nhãng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-white/[0.08]">
          {EDITORIAL_PILLARS.map((item) => (
            <div
              key={item.index}
              className="p-7 sm:p-8 border-r border-b border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.04] transition-colors duration-300 flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
                  <span className="text-[#D93A55] font-bold">{item.index}</span>
                  <span className="text-white/40">{item.tag}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-display font-bold text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/45">
                <span className="font-mono">{item.meta}</span>
                <ArrowUpRight className="w-4 h-4 text-white/30" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 03. CLEAN HSK 1–6 ROADMAP STRIP ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 border-t border-white/[0.08]">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
            Lộ trình chuẩn HSK 1 đến HSK 6
          </h2>
          <a
            href="#/login?tab=register"
            className="text-xs font-semibold text-white/60 hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            <span>Khảo sát xếp trình độ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {HSK_STRIP.map((row) => (
            <div
              key={row.level}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-sm text-white">{row.level}</span>
                <span className="text-[11px] font-mono text-[#D93A55]">{row.words}</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{row.focus}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 04. QUIET CLOSING CTA ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-20">
        <div className="rounded-[32px] p-8 sm:p-12 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.12] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Sẵn sàng cho 15 phút tiếng Trung đầu tiên hôm nay?
            </h2>
            <p className="text-sm text-white/55">
              Đăng nhập bằng Google hoặc Gmail trong 10 giây, tiến độ học được đồng bộ xuyên suốt giữa máy tính và điện thoại.
            </p>
          </div>
          <LucianLiquidButton href="#/login?tab=register" variant="vermilion" size="lg" className="shrink-0">
            <span>Mở lộ trình miễn phí</span>
            <ArrowRight className="w-4 h-4" />
          </LucianLiquidButton>
        </div>
      </section>
    </div>
  );
};
