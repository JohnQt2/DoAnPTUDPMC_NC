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
    <div className="text-zinc-950">
      {/* ── 01. MINIMALIST SAAS HERO ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-[11px] font-medium text-zinc-600 shadow-[0_1px_2px_rgba(9,9,11,0.03)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]" />
              <span>Hanzi4U · Lộ trình tiếng Trung chuẩn HSK 1–6</span>
            </motion.div>

            <MaskedHeadline
              lines={['Tiếng Trung bài bản,', 'tinh gọn từng nét chữ.']}
              accentLineIndex={1}
              className="text-4xl sm:text-5xl lg:text-[54px] text-zinc-950"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-[15px] sm:text-base text-zinc-600 max-w-lg leading-relaxed"
            >
              Học Pinyin 63 âm chuẩn phổ thông, xem thứ tự từng nét thư pháp, ghi nhớ từ vựng bằng
              thẻ lặp lại ngắt quãng và thi thử HSK trong một không gian tối giản, tập trung tuyệt đối.
            </motion.p>

            {/* Restrained Executive CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <LucianLiquidButton href="#/login" variant="ink" size="lg">
                <span>Bắt đầu học ngay</span>
                <ArrowRight className="w-4 h-4" />
              </LucianLiquidButton>
              <LucianLiquidButton href="#/login?tab=register" variant="glass-light" size="lg">
                <span>Tạo tài khoản miễn phí</span>
              </LucianLiquidButton>
            </motion.div>

            {/* Hairline Metric Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.36 }}
              className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-200 max-w-md"
            >
              <div>
                <p className="font-display text-2xl font-bold text-zinc-950 tabular-nums tracking-tight">
                  63
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Âm Pinyin chuẩn</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-zinc-950 tabular-nums tracking-tight">
                  HSK 1–6
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Lộ trình cá nhân</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-zinc-950 tabular-nums tracking-tight">
                  48+
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Bộ đề & bài tập</p>
              </div>
            </motion.div>
          </div>

          {/* Right Architectural 3D Crystal Specimen Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="relative h-[420px] sm:h-[470px] w-full rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_-16px_rgba(9,9,11,0.08)] overflow-hidden">
              {/* Subtle architectural dot-grid backdrop */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.45]"
                style={{
                  backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Real-Time Interactive 3D Crystal Sculpture + Floating Hanzi */}
              <ThreeLiquidHeroScene activeHanzi={active.hanzi} mode="light" className="w-full h-full relative z-[1]" />

              {/* Top-left subtle gallery tag */}
              <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/90 border border-zinc-200/80 text-[11px] font-mono text-zinc-500">
                <span>SPECIMEN</span>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-900 font-semibold">{active.tone}</span>
              </div>

              {/* Bottom Crisp Frosted Specimen Dock */}
              <div className="absolute inset-x-3.5 bottom-3.5 sm:inset-x-4 sm:bottom-4 z-10 p-2.5 sm:p-3 rounded-xl bg-white/92 backdrop-blur-md border border-zinc-200 shadow-[0_8px_24px_-8px_rgba(9,9,11,0.08)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                {/* Character Selector */}
                <div className="flex items-center gap-1">
                  {SPECIMEN_CHARS.map((item, idx) => {
                    const isSelected = idx === selectedIdx;
                    return (
                      <button
                        key={item.hanzi}
                        type="button"
                        onClick={() => setSelectedIdx(idx)}
                        className={`w-9 h-9 rounded-lg font-hanzi-serif text-base font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
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
                    <p className="text-[13px] font-mono font-bold text-zinc-950">
                      {active.pinyin}{' '}
                      <span className="font-sans font-normal text-zinc-500">· {active.meaning}</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{active.phrase}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSpeak}
                    aria-label={`Nghe phát âm chữ ${active.hanzi}`}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                      isSpeaking
                        ? 'bg-[#BE123C] border-[#BE123C] text-white'
                        : 'bg-zinc-50 hover:bg-zinc-900 border-zinc-200 hover:border-zinc-900 text-zinc-700 hover:text-white'
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

      {/* ── 02. ARCHITECTURAL FEATURE GRID ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-1.5">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
              Cấu trúc học tập
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight">
              Bốn trụ cột để tự tin dùng tiếng Trung
            </h2>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm">
            Mọi công cụ cốt lõi gói gọn trong một không gian tĩnh lặng — không quảng cáo, không hiệu ứng gây xao nhãng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-zinc-200 bg-white overflow-hidden divide-y md:divide-y-0 md:grid-rows-2">
          {EDITORIAL_PILLARS.map((item, idx) => (
            <div
              key={item.index}
              className={`p-7 sm:p-8 hover:bg-zinc-50/70 transition-colors duration-200 flex flex-col justify-between gap-6 ${
                idx % 2 === 1 ? 'md:border-l md:border-zinc-200' : ''
              } ${idx >= 2 ? 'md:border-t md:border-zinc-200' : ''}`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
                  <span className="text-[#BE123C] font-semibold">{item.index}</span>
                  <span className="text-zinc-400">{item.tag}</span>
                </div>
                <h3 className="text-lg font-display font-semibold text-zinc-950 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span className="font-mono">{item.meta}</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 03. CLEAN HSK 1–6 ROADMAP STRIP ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 border-t border-zinc-200">
        <div className="flex items-baseline justify-between mb-8 gap-4">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-950 tracking-tight">
            Lộ trình chuẩn HSK 1 đến HSK 6
          </h2>
          <a
            href="#/login?tab=register"
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors shrink-0"
          >
            <span>Khảo sát xếp trình độ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {HSK_STRIP.map((row) => (
            <div
              key={row.level}
              className="p-4 rounded-xl bg-white hover:border-zinc-300 border border-zinc-200 transition-colors space-y-2 shadow-[0_1px_2px_rgba(9,9,11,0.03)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-zinc-950">{row.level}</span>
                <span className="text-[11px] font-mono font-medium text-[#BE123C]">{row.words}</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{row.focus}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 04. QUIET CLOSING CTA ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-20">
        <div className="rounded-2xl p-8 sm:p-10 bg-white border border-zinc-200 shadow-[0_4px_20px_-8px_rgba(9,9,11,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-2xl font-display font-bold text-zinc-950 tracking-tight">
              Sẵn sàng cho 15 phút tiếng Trung đầu tiên hôm nay?
            </h2>
            <p className="text-sm text-zinc-600">
              Đăng nhập bằng Google hoặc Gmail trong 10 giây, tiến độ học được đồng bộ xuyên suốt giữa máy tính và điện thoại.
            </p>
          </div>
          <LucianLiquidButton href="#/login?tab=register" variant="ink" size="lg" className="shrink-0">
            <span>Mở lộ trình miễn phí</span>
            <ArrowRight className="w-4 h-4" />
          </LucianLiquidButton>
        </div>
      </section>
    </div>
  );
};
