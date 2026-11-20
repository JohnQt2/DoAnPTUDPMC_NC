import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Volume2,
  ArrowRight,
  ArrowUpRight,
  Check,
  RotateCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Move,
  Play,
} from 'lucide-react';
import { ThreeMinimalZenSculpture } from '../../components/three/ThreeMinimalZenSculpture';
import { LucianLiquidButton, SmoothReveal, LUCIAN_EASE } from '../../components/ui';

/* ── 1. HERO 3D SPECIMEN CHARACTERS ── */
const SPECIMEN_CHARS = [
  { hanzi: '汉', pinyin: 'hàn', tone: 'Thanh 4', meaning: 'Chữ Hán', phrase: '汉语 · Tiếng Hán' },
  { hanzi: '你', pinyin: 'nǐ', tone: 'Thanh 3', meaning: 'Bạn', phrase: '你好 · Xin chào' },
  { hanzi: '学', pinyin: 'xué', tone: 'Thanh 2', meaning: 'Học tập', phrase: '学习 · Học hành' },
  { hanzi: '美', pinyin: 'měi', tone: 'Thanh 3', meaning: 'Đẹp đẽ', phrase: '美丽 · Tuyệt đẹp' },
  { hanzi: '道', pinyin: 'dào', tone: 'Thanh 4', meaning: 'Đạo · Con đường', phrase: '知道 · Hiểu biết' },
];

/* ── 2. INTERACTIVE 4-TONE SANDBOX ── */
const FOUR_TONES_DEMO = [
  {
    tone: 'Thanh 1',
    pitch: '55 · Cao phẳng',
    pinyin: 'mā',
    hanzi: '妈',
    meaning: 'Mẹ',
    speak: '妈',
    svgPath: 'M 10 14 L 90 14',
  },
  {
    tone: 'Thanh 2',
    pitch: '35 · Lên cao',
    pinyin: 'má',
    hanzi: '麻',
    meaning: 'Cây gai / Tê',
    speak: '麻',
    svgPath: 'M 10 38 Q 48 28 90 12',
  },
  {
    tone: 'Thanh 3',
    pitch: '214 · Xuống rồi lên',
    pinyin: 'mǎ',
    hanzi: '马',
    meaning: 'Con ngựa',
    speak: '马',
    svgPath: 'M 10 34 Q 44 54 90 22',
  },
  {
    tone: 'Thanh 4',
    pitch: '51 · Xuống dứt khoát',
    pinyin: 'mà',
    hanzi: '骂',
    meaning: 'Mắng',
    speak: '骂',
    svgPath: 'M 10 12 Q 52 24 90 48',
  },
];

/* ── 3. INTERACTIVE 3D FLASHCARD DEMO ── */
const DEMO_FLASHCARDS = [
  {
    id: 'nihao',
    level: 'HSK 1',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    meaning: 'Xin chào',
    sino: 'Nhĩ hảo',
    exampleCn: '你好，很高兴认识你！',
    examplePy: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ!',
    exampleVi: 'Xin chào, rất vui được làm quen với bạn!',
  },
  {
    id: 'xuexi',
    level: 'HSK 1',
    hanzi: '学习',
    pinyin: 'xuéxí',
    meaning: 'Học tập',
    sino: 'Học tập',
    exampleCn: '我每天学习十五分钟中文。',
    examplePy: 'Wǒ měitiān xuéxí shíwǔ fēnzhōng Zhōngwén.',
    exampleVi: 'Mỗi ngày tôi học tiếng Trung 15 phút.',
  },
  {
    id: 'xiexie',
    level: 'HSK 1',
    hanzi: '谢谢',
    pinyin: 'xièxie',
    meaning: 'Cảm ơn',
    sino: 'Tạ tạ',
    exampleCn: '谢谢你的帮助！',
    examplePy: 'Xièxie nǐ de bāngzhù!',
    exampleVi: 'Cảm ơn sự giúp đỡ của bạn!',
  },
];

/* ── 4. MINI QUIZ DEMO ── */
const MINI_QUIZ_OPTIONS = [
  { id: 'A', label: 'Bạn tên là gì?' },
  { id: 'B', label: 'Bạn có khỏe không?', correct: true },
  { id: 'C', label: 'Bạn đi đâu vậy?' },
  { id: 'D', label: 'Cảm ơn bạn rất nhiều' },
];

/* ── 5. INTERACTIVE HSK 1-6 ROADMAP DATA ── */
const HSK_LEVELS = [
  {
    code: 'HSK 1',
    words: '150 từ',
    weeks: '4 – 6 tuần',
    headline: 'Nền tảng phát âm chuẩn & giao tiếp sơ cấp',
    summary:
      'Làm chủ 63 âm Pinyin, 4 thanh điệu và 150 từ vựng thiết yếu để tự tin chào hỏi, giới thiệu bản thân và mua sắm cơ bản.',
    milestones: ['Đọc đúng 100% Pinyin và quy tắc biến điệu', 'Viết chuẩn nét 150 chữ Hán nền tảng', 'Hoàn thành 5 đề thi mô phỏng HSK 1'],
    sampleCn: '我每天都学一点中文。',
    sampleVi: 'Mỗi ngày tôi đều học một chút tiếng Trung.',
  },
  {
    code: 'HSK 2',
    words: '300 từ',
    weeks: '6 – 8 tuần',
    headline: 'Giao tiếp trôi chảy trong sinh hoạt & du lịch',
    summary:
      'Mở rộng vốn từ lên 300 từ, diễn đạt tự nhiên về thời gian, phương tiện, đặt món ăn và hỏi đường khi đi du lịch Trung Quốc.',
    milestones: ['Nắm chắc câu so sánh & trợ từ động thái 了/着', 'Phản xạ đối đáp nhanh trong 12 tình huống đời sống', 'Hoàn thành bộ sách bài tập & 5 đề HSK 2'],
    sampleCn: '坐地铁去市中心又快又方便。',
    sampleVi: 'Đi tàu điện ngầm vào trung tâm vừa nhanh vừa tiện.',
  },
  {
    code: 'HSK 3',
    words: '600 từ',
    weeks: '10 – 12 tuần',
    headline: 'Độc lập xử lý học tập, du lịch & công việc',
    summary:
      'Đủ năng lực đọc đoạn văn ngắn không cần Pinyin, trình bày quan điểm cá nhân và giao tiếp tự tin với đối tác, bạn bè bản xứ.',
    milestones: ['Làm chủ câu chữ 把, câu bị động 被 và bổ ngữ kết quả', 'Ghi nhớ bền vững 600 từ với lịch ôn lặp lại SRS', 'Đạt chuẩn đầu vào du học hệ ngôn ngữ'],
    sampleCn: '虽然汉字有点难，但是非常有意思。',
    sampleVi: 'Tuy chữ Hán hơi khó nhưng lại vô cùng thú vị.',
  },
  {
    code: 'HSK 4',
    words: '1.200 từ',
    weeks: '14 – 16 tuần',
    headline: 'Thảo luận công sở, phỏng vấn & thuyết trình',
    summary:
      'Bước ngoặt chuyên nghiệp: đọc hiểu văn bản báo chí, viết đoạn luận ngắn và tự tin phỏng vấn tuyển dụng bằng tiếng Trung.',
    milestones: ['Sử dụng thành thạo liên từ phức hợp & văn phong trang trọng', 'Luyện phản xạ nghe hiểu tốc độ bản xứ', 'Đạt điều kiện học bổng đại học Trung Quốc'],
    sampleCn: '只要坚持科学的方法，就一定能成功。',
    sampleVi: 'Chỉ cần kiên trì phương pháp khoa học, nhất định sẽ thành công.',
  },
  {
    code: 'HSK 5',
    words: '2.500 từ',
    weeks: '20 – 24 tuần',
    headline: 'Đọc báo chí, xem phim & phân tích chuyên sâu',
    summary:
      'Tích lũy 2.500 từ vựng và cấu trúc văn viết học thuật, xem phim Hoa ngữ ít phụ đề và tham gia họp chuyên môn trôi chảy.',
    milestones: ['Phân biệt sắc thái từ đồng nghĩa tinh tế', 'Đọc hiểu bài bình luận, kinh tế và công nghệ', 'Chinh phục 5 đề mô phỏng HSK 5 chuẩn cấu trúc'],
    sampleCn: '语言不仅是工具，更是理解文化的窗口。',
    sampleVi: 'Ngôn ngữ không chỉ là công cụ mà còn là cánh cửa hiểu văn hóa.',
  },
  {
    code: 'HSK 6',
    words: '5.000+ từ',
    weeks: '24+ tuần',
    headline: 'Thành ngữ, văn phong học thuật & diễn đạt bản xứ',
    summary:
      'Đỉnh cao năng lực HSK: vận dụng linh hoạt thành ngữ bốn chữ, tóm tắt bài viết dài và diễn đạt sắc bén trong mọi bối cảnh.',
    milestones: ['Làm chủ kho thành ngữ (成语) tần suất cao', 'Đọc lướt & phân tích lập luận văn bản dài', 'Hoàn thiện bộ đề luyện thi HSK 6 chuyên sâu'],
    sampleCn: '滴水穿石，非一日之功。',
    sampleVi: 'Nước chảy đá mòn, không phải công sức một ngày.',
  },
];

/* ── 6. AUTHENTIC LEARNER STORIES ── */
const LEARNER_STORIES = [
  {
    quote:
      'Giao diện sạch và rất dễ tập trung. Mỗi tối mình mở máy học đúng 15 phút phần Pinyin rồi lật thẻ SRS, sau 3 tuần đã tự đọc được menu và bảng chỉ dẫn.',
    name: 'Minh Anh',
    role: 'Sinh viên năm 3 · Đạt HSK 2 sau 2 tháng',
  },
  {
    quote:
      'Thích nhất mục xem thứ tự nét chữ Hán và tách từng chữ để tô lại. Không bị rối mắt bởi quảng cáo hay popup nên giữ được thói quen học mỗi sáng.',
    name: 'Quốc Bảo',
    role: 'Kỹ sư phần mềm · Mục tiêu HSK 4 công sở',
  },
  {
    quote:
      'Kho 30 đề thi mô phỏng và bài luyện nghe cặp âm dễ nhầm giúp mình sửa hẳn lỗi bật hơi z/c/s và zh/ch/sh trước kỳ thi HSK 3.',
    name: 'Thanh Trúc',
    role: 'Chuyên viên xuất nhập khẩu · Đạt 278/300 HSK 3',
  },
];

export const LandingPage: React.FC = () => {
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Interactive Sandbox state
  const [demoTab, setDemoTab] = useState<'tones' | 'cards' | 'quiz'>('tones');
  const [activeToneIdx, setActiveToneIdx] = useState<number>(0);
  const [flippedDemo, setFlippedDemo] = useState<Record<string, boolean>>({});
  const [quizChoice, setQuizChoice] = useState<string | null>(null);

  // Interactive HSK Roadmap Explorer state
  const [activeHskIdx, setActiveHskIdx] = useState(0);

  // Silky GPU parallax for Hero Misty Mountain WebP background
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroBgY = useTransform(heroScroll, [0, 1], ['0%', '14%']);
  const heroBgOpacity = useTransform(heroScroll, [0, 0.9], [0.22, 0.04]);

  const activeChar = SPECIMEN_CHARS[selectedCharIdx];
  const activeHsk = HSK_LEVELS[activeHskIdx];

  const speakChinese = (text: string, rate = 0.8) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const scrollToTryout = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('trai-nghiem')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="text-zinc-950">
      {/* ═══════════════════════════════════════════════════════════════════
          01. FULL-BLEED MISTY MOUNTAIN WEBP + INTERACTIVE 3D HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Real Local .webp Huangshan Sea of Clouds (GPU Parallax + Soft Alabaster Veil) */}
        <motion.div
          aria-hidden="true"
          style={{ y: heroBgY, opacity: heroBgOpacity }}
          className="pointer-events-none absolute inset-0 -top-10 -bottom-16 will-change-transform"
        >
          <img
            src="/images/hero-huangshan-mist.webp"
            alt=""
            decoding="async"
            className="w-full h-full object-cover object-center grayscale-[30%] contrast-[0.95]"
          />
        </motion.div>

        {/* Seamless Alabaster Fade Mask so Typography stays WCAG AAA Crisp */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(250,250,249,0.72) 0%, rgba(250,250,249,0.45) 42%, rgba(250,250,249,0.92) 86%, #FAFAF9 100%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-20 lg:pt-18 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Editorial Conversion Column */}
            <div className="lg:col-span-6 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: LUCIAN_EASE }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-zinc-200/90 text-[11.5px] font-medium text-zinc-700 shadow-[0_1px_2px_rgba(9,9,11,0.03)] backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BE123C] opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BE123C]" />
                </span>
                <span>Hanzi4U · Chuẩn HSK 1–6 · Miễn phí bắt đầu</span>
              </motion.div>

              {/* Editorial Mixed-Serif Masked Headline */}
              <div className="space-y-1">
                <div className="overflow-hidden">
                  <motion.h1
                    initial={{ y: '105%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.06, ease: LUCIAN_EASE }}
                    className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] tracking-[-0.03em] text-zinc-950"
                  >
                    Tiếng Trung bài bản,
                  </motion.h1>
                </div>
                <div className="overflow-hidden pb-1">
                  <motion.p
                    initial={{ y: '105%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.14, ease: LUCIAN_EASE }}
                    className="font-editorial italic font-medium text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] tracking-[-0.015em] text-[#BE123C]"
                  >
                    tinh gọn từng nét chữ.
                  </motion.p>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24, ease: LUCIAN_EASE }}
                className="text-[15.5px] sm:text-base text-zinc-600 max-w-lg leading-relaxed"
              >
                Chỉ <strong className="font-semibold text-zinc-950">15 phút mỗi ngày</strong>: làm
                chủ 63 âm Pinyin chuẩn phổ thông, xem mô phỏng từng nét thư pháp, ôn thẻ lặp lại
                ngắt quãng SRS và luyện 30 đề thi thử HSK trong một không gian tĩnh lặng.
              </motion.p>

              {/* Conversion CTA Pair */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32, ease: LUCIAN_EASE }}
                className="flex flex-wrap items-center gap-3 pt-1"
              >
                <LucianLiquidButton href="#/login?tab=register" variant="ink" size="lg">
                  <span>Tạo tài khoản miễn phí</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </LucianLiquidButton>
                <LucianLiquidButton
                  href="#trai-nghiem"
                  onClick={scrollToTryout}
                  variant="glass-light"
                  size="lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#BE123C]" />
                  <span>Thử học 10 giây</span>
                </LucianLiquidButton>
              </motion.div>

              {/* Frictionless Trust Micro-Copy */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-500"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Miễn phí lộ trình HSK 1
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Vào học sau 10 giây với Google
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Không quảng cáo
                </span>
              </motion.div>

              {/* Hairline Editorial Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.46, ease: LUCIAN_EASE }}
                className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-200/90 max-w-md"
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
                  <p className="text-xs text-zinc-500 mt-0.5">Đề thi & bài tập</p>
                </div>
              </motion.div>
            </div>

            {/* Right Interactive 3D Crystal Sculpture Gallery Stage */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.14, ease: LUCIAN_EASE }}
              className="lg:col-span-6 relative"
            >
              <div className="relative h-[435px] sm:h-[490px] w-full rounded-2xl border border-zinc-200/90 bg-white/80 backdrop-blur-md shadow-[0_20px_56px_-24px_rgba(9,9,11,0.14)] overflow-hidden">
                {/* Delicate architectural dot grid */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.45]"
                  style={{
                    backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                />

                {/* Real-Time Interactive 3D Crystal Halo + Crisp Center Hanzi */}
                <ThreeMinimalZenSculpture
                  activeHanzi={activeChar.hanzi}
                  className="w-full h-full relative z-[1]"
                />

                {/* Top Subtle Gallery Metadata */}
                <div className="pointer-events-none absolute top-4 inset-x-4 z-10 flex items-center justify-between text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 border border-zinc-200/80 text-zinc-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C]" />
                    <span>{activeChar.tone}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/85 border border-zinc-200/70 text-zinc-400">
                    <Move className="w-3 h-3" />
                    <span>Kéo để xoay 3D</span>
                  </span>
                </div>

                {/* Bottom Porcelain Specimen Control Dock */}
                <div className="absolute inset-x-3.5 bottom-3.5 sm:inset-x-4 sm:bottom-4 z-10 p-2.5 sm:p-3 rounded-xl bg-white/95 backdrop-blur-md border border-zinc-200 shadow-[0_10px_28px_-10px_rgba(9,9,11,0.1)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1">
                    {SPECIMEN_CHARS.map((item, idx) => {
                      const isSelected = idx === selectedCharIdx;
                      return (
                        <button
                          key={item.hanzi}
                          type="button"
                          onClick={() => {
                            setSelectedCharIdx(idx);
                            speakChinese(item.hanzi, 0.8);
                          }}
                          className={`relative w-9 h-9 rounded-lg font-hanzi-serif text-base font-bold transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-white'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                          }`}
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="hero-3d-char-pill"
                              transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                              className="absolute inset-0 rounded-lg bg-zinc-950"
                            />
                          )}
                          <span className="relative z-10">{item.hanzi}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right leading-tight">
                      <p className="text-[13px] font-mono font-bold text-zinc-950">
                        {activeChar.pinyin}{' '}
                        <span className="font-sans font-normal text-zinc-500">
                          · {activeChar.meaning}
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{activeChar.phrase}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakChinese(activeChar.hanzi, 0.78)}
                      aria-label={`Nghe phát âm chữ ${activeChar.hanzi}`}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                        isSpeaking
                          ? 'bg-[#BE123C] border-[#BE123C] text-white'
                          : 'bg-zinc-50 hover:bg-zinc-950 border-zinc-200 hover:border-zinc-950 text-zinc-700 hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          02. INTERACTIVE 10-SECOND LIVE MINI-LESSON SANDBOX
          (Lets visitors experience Hanzi4U immediately — high sign-up conversion!)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="trai-nghiem" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t border-zinc-200">
        <SmoothReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#BE123C] font-semibold">
                Trải nghiệm ngay · Không cần đăng nhập
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight">
                Thử học 10 giây để cảm nhận sự khác biệt
              </h2>
            </div>

            {/* Silky Spring Segmented Control */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 self-start">
              {[
                { id: 'tones' as const, label: '4 Thanh điệu' },
                { id: 'cards' as const, label: 'Thẻ nhớ 3D' },
                { id: 'quiz' as const, label: 'Thử nhanh HSK 1' },
              ].map((t) => {
                const active = demoTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDemoTab(t.id)}
                    className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="landing-demo-tab"
                        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                        className="absolute inset-0 rounded-lg bg-zinc-950"
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-[0_4px_24px_-12px_rgba(9,9,11,0.06)]">
            <AnimatePresence mode="wait">
              {/* TAB 1: 4 TONES INTERACTIVE CONTOURS */}
              {demoTab === 'tones' && (
                <motion.div
                  key="demo-tones"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: LUCIAN_EASE }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
                    <p className="text-sm text-zinc-600">
                      Cùng một âm tiết <strong className="font-mono text-zinc-950">ma</strong> nhưng
                      đổi thanh điệu sẽ thành 4 nghĩa hoàn toàn khác nhau — bấm từng thẻ để nghe:
                    </p>
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                      Âm thanh chuẩn zh-CN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FOUR_TONES_DEMO.map((t, idx) => {
                      const active = activeToneIdx === idx;
                      return (
                        <button
                          key={t.pinyin}
                          type="button"
                          onClick={() => {
                            setActiveToneIdx(idx);
                            speakChinese(t.speak, 0.72);
                          }}
                          className={`group text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                            active
                              ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                              : 'bg-[#FAFAF9] hover:bg-white border-zinc-200 hover:border-zinc-300 text-zinc-950'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className={active ? 'text-zinc-300' : 'text-zinc-500'}>
                              {t.tone}
                            </span>
                            <Volume2
                              className={`w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-110 ${
                                active ? 'text-[#FB7185]' : 'text-zinc-400 group-hover:text-[#BE123C]'
                              }`}
                            />
                          </div>

                          {/* Minimalist Tone Pitch Contour SVG */}
                          <svg
                            viewBox="0 0 100 60"
                            className="w-full h-12 my-3"
                            aria-hidden="true"
                          >
                            <line
                              x1="8"
                              y1="14"
                              x2="92"
                              y2="14"
                              stroke={active ? 'rgba(255,255,255,0.12)' : 'rgba(9,9,11,0.07)'}
                              strokeDasharray="2 3"
                            />
                            <line
                              x1="8"
                              y1="48"
                              x2="92"
                              y2="48"
                              stroke={active ? 'rgba(255,255,255,0.12)' : 'rgba(9,9,11,0.07)'}
                              strokeDasharray="2 3"
                            />
                            <path
                              d={t.svgPath}
                              fill="none"
                              stroke={active ? '#FB7185' : '#BE123C'}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>

                          <div className="flex items-baseline justify-between gap-2">
                            <div>
                              <span className="font-hanzi-serif text-3xl font-bold mr-2">
                                {t.hanzi}
                              </span>
                              <span
                                className={`font-mono text-base font-bold ${
                                  active ? 'text-[#FB7185]' : 'text-[#BE123C]'
                                }`}
                              >
                                {t.pinyin}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                active ? 'text-zinc-200' : 'text-zinc-600'
                              }`}
                            >
                              {t.meaning}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] font-mono mt-2 ${
                              active ? 'text-zinc-400' : 'text-zinc-400'
                            }`}
                          >
                            {t.pitch}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: 3D FLIP FLASHCARDS */}
              {demoTab === 'cards' && (
                <motion.div
                  key="demo-cards"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: LUCIAN_EASE }}
                  className="space-y-5"
                >
                  <p className="text-sm text-zinc-600 pb-4 border-b border-zinc-100">
                    Bấm vào bất kỳ thẻ nào để lật 3D xem âm Hán-Việt và câu ví dụ giao tiếp thật:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DEMO_FLASHCARDS.map((card) => {
                      const flipped = !!flippedDemo[card.id];
                      return (
                        <div
                          key={card.id}
                          onClick={() =>
                            setFlippedDemo((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
                          }
                          className="perspective-1000 h-[220px] cursor-pointer select-none group"
                        >
                          <div
                            className={`relative w-full h-full flip-3d-inner ${
                              flipped ? 'rotate-y-180' : ''
                            }`}
                          >
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden rounded-xl bg-[#FAFAF9] hover:bg-white border border-zinc-200 hover:border-zinc-300 p-5 flex flex-col justify-between transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded bg-zinc-200/70 text-[10px] font-mono font-semibold text-zinc-700">
                                  {card.level}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakChinese(card.hanzi, 0.8);
                                  }}
                                  aria-label={`Nghe ${card.hanzi}`}
                                  className="w-8 h-8 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-950 hover:border-zinc-950 text-zinc-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-center space-y-1">
                                <p className="font-hanzi-serif text-4xl font-bold text-zinc-950">
                                  {card.hanzi}
                                </p>
                                <p className="text-sm font-mono font-semibold text-[#BE123C]">
                                  {card.pinyin}
                                </p>
                                <p className="text-sm font-medium text-zinc-700">{card.meaning}</p>
                              </div>

                              <p className="text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1">
                                <RotateCw className="w-3 h-3 transition-transform duration-300 group-hover:rotate-90" />
                                Bấm để lật thẻ
                              </p>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-zinc-950 text-white p-5 flex flex-col justify-between border border-zinc-800">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-hanzi-serif text-lg font-bold">
                                  {card.hanzi}{' '}
                                  <span className="font-mono text-xs text-[#FB7185]">
                                    {card.pinyin}
                                  </span>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-zinc-300">
                                  Hán-Việt: {card.sino}
                                </span>
                              </div>

                              <div className="p-3 rounded-lg bg-white/[0.06] border border-white/10 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-hanzi-serif text-sm font-semibold text-white">
                                    {card.exampleCn}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      speakChinese(card.exampleCn, 0.82);
                                    }}
                                    aria-label="Nghe câu ví dụ"
                                    className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-[11px] font-mono text-[#FB7185]">
                                  {card.examplePy}
                                </p>
                                <p className="text-[11px] text-zinc-300">{card.exampleVi}</p>
                              </div>

                              <p className="text-[11px] text-zinc-400 text-center">
                                Bấm để lật lại mặt trước
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 3: MINI HSK 1 QUIZ */}
              {demoTab === 'quiz' && (
                <motion.div
                  key="demo-quiz"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: LUCIAN_EASE }}
                  className="max-w-2xl mx-auto space-y-5"
                >
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-zinc-400">
                        Câu hỏi thử · HSK 1
                      </span>
                      <h3 className="text-lg sm:text-xl font-display font-bold text-zinc-950 mt-1">
                        Câu <span className="font-hanzi-serif text-[#BE123C]">「你好吗？」</span>{' '}
                        <span className="font-mono text-sm font-medium text-zinc-500">
                          (Nǐ hǎo ma?)
                        </span>{' '}
                        có nghĩa là gì?
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakChinese('你好吗', 0.78)}
                      aria-label="Nghe câu hỏi"
                      className="w-10 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-950 text-zinc-700 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MINI_QUIZ_OPTIONS.map((opt) => {
                      const picked = quizChoice === opt.id;
                      const answered = quizChoice !== null;
                      const isRight = !!opt.correct;

                      let cls =
                        'bg-[#FAFAF9] hover:bg-white border-zinc-200 hover:border-zinc-400 text-zinc-900';
                      if (answered) {
                        if (isRight) {
                          cls = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                        } else if (picked) {
                          cls = 'bg-rose-50 border-rose-400 text-rose-900';
                        } else {
                          cls = 'bg-zinc-50 border-zinc-200 text-zinc-400';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQuizChoice(opt.id)}
                          className={`p-4 rounded-xl border text-left text-sm font-medium transition-colors cursor-pointer flex items-center justify-between gap-2 ${cls}`}
                        >
                          <span>
                            <strong className="font-mono mr-2">{opt.id}.</strong>
                            {opt.label}
                          </span>
                          {answered && isRight && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {answered && picked && !isRight && (
                            <XCircle className="w-4 h-4 text-[#BE123C] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizChoice && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: LUCIAN_EASE }}
                      className="p-4 rounded-xl bg-zinc-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">
                          {quizChoice === 'B'
                            ? 'Chính xác! 你好吗 (Nǐ hǎo ma?) là lời hỏi thăm sức khỏe quen thuộc nhất.'
                            : 'Đáp án đúng là B — 你好吗 (Nǐ hǎo ma?) nghĩa là “Bạn có khỏe không?”.'}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Tạo tài khoản miễn phí để làm bài xếp trình độ và mở lộ trình riêng cho bạn.
                        </p>
                      </div>
                      <LucianLiquidButton
                        href="#/login?tab=register"
                        variant="porcelain"
                        size="sm"
                        className="shrink-0"
                      >
                        <span>Mở lộ trình miễn phí</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </LucianLiquidButton>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SmoothReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          03. EDITORIAL PHOTOGRAPHY BENTO SHOWCASE (3 CURATED LOCAL .WEBP)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="phuong-phap" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t border-zinc-200">
        <SmoothReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                Triết lý thiết kế & Phương pháp
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight">
                Không gian tĩnh lặng để{' '}
                <span className="font-editorial italic font-medium text-[#BE123C]">
                  ghi nhớ sâu hơn
                </span>
              </h2>
            </div>
            <p className="text-sm text-zinc-600 max-w-sm">
              Lược bỏ hoàn toàn sự xao nhãng — mọi chi tiết đều phục vụ việc nghe chuẩn, viết đúng
              và phản xạ tự nhiên.
            </p>
          </div>
        </SmoothReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 01 — Wide Feature with Suzhou Museum Minimalist Architecture (.webp) */}
          <SmoothReveal className="lg:col-span-7 flex" delay={0.04}>
            <div className="group w-full rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-[0_2px_12px_-6px_rgba(9,9,11,0.05)] hover:border-zinc-300 transition-colors flex flex-col">
              <div className="relative h-64 sm:h-80 lg:h-[340px] overflow-hidden bg-zinc-100">
                <img
                  src="/images/suzhou-courtyard.webp"
                  alt="Kiến trúc tối giản Bảo tàng Tô Châu phản chiếu trên mặt nước"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-white/95 border border-zinc-200/80 shadow-sm text-[11px] font-mono font-semibold text-zinc-950">
                  01 · LỘ TRÌNH CÁ NHÂN HÓA
                </span>
              </div>
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <h3 className="text-xl font-display font-bold text-zinc-950 leading-snug">
                    Khảo sát 4 bước, sắp xếp sẵn từng Unit HSK 1–6 cho riêng bạn
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Dù bạn mới bắt đầu từ con số 0 hay muốn ôn thi HSK 4–6 cho công việc, hệ thống
                    tự tính thời lượng mỗi ngày (15–120 phút) và mở khóa từng chặng học theo đúng
                    nhịp của bạn.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    {[
                      { k: 'Hội thoại mẫu', v: 'Nghe & đọc chậm' },
                      { k: 'Ngữ pháp cốt lõi', v: 'Ví dụ thực tế' },
                      { k: 'Kiểm tra mở chặng', v: 'Nắm chắc bài cũ' },
                    ].map((pill) => (
                      <div
                        key={pill.k}
                        className="p-2.5 rounded-lg bg-[#FAFAF9] border border-zinc-200/80"
                      >
                        <p className="text-xs font-semibold text-zinc-900">{pill.k}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{pill.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900">
                  <span className="font-mono text-zinc-500">15–30 phút / ngày</span>
                  <a
                    href="#/login?tab=register"
                    className="inline-flex items-center gap-1 text-[#BE123C] hover:underline underline-offset-4"
                  >
                    <span>Thiết lập lộ trình</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </SmoothReveal>

          {/* Right Stacked Column — 2 Curated WebP Cards */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Card 02 — Macro Crimson Xuan Calligraphy Brushes (.webp) */}
            <SmoothReveal delay={0.1} className="flex-1 flex">
              <div className="group w-full rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-[0_2px_12px_-6px_rgba(9,9,11,0.05)] hover:border-zinc-300 transition-colors flex flex-col">
                <div className="relative h-44 overflow-hidden bg-zinc-950">
                  <img
                    src="/images/calligraphy-brushes.webp"
                    alt="Bút lông thư pháp Hán tự trên gác bút sứ thanh hoa"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] will-change-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-md bg-white/95 border border-zinc-200/80 shadow-sm text-[11px] font-mono font-semibold text-zinc-950">
                    02 · THƯ PHÁP & VIẾT NÉT
                  </span>
                </div>
                <div className="p-5 sm:p-6 space-y-1.5 flex-1">
                  <h3 className="text-base sm:text-lg font-display font-bold text-zinc-950">
                    Mô phỏng thứ tự từng nét & bảng tập viết cảm ứng
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-zinc-600 leading-relaxed">
                    Tự tách từ ghép nhiều chữ để xem hướng cọ chuẩn và luyện viết trực tiếp trên ô
                    Điền Tự Cách (田字格) bằng chuột hoặc màn hình cảm ứng.
                  </p>
                </div>
              </div>
            </SmoothReveal>

            {/* Card 03 — Misty West Lake Hangzhou (.webp) */}
            <SmoothReveal delay={0.16} className="flex-1 flex">
              <div className="group w-full rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-[0_2px_12px_-6px_rgba(9,9,11,0.05)] hover:border-zinc-300 transition-colors flex flex-col">
                <div className="relative h-44 overflow-hidden bg-zinc-100">
                  <img
                    src="/images/westlake-tranquil.webp"
                    alt="Mặt hồ Tây Hồ Hàng Châu thanh tĩnh trong sương sớm"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] will-change-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent" />
                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-md bg-white/95 border border-zinc-200/80 shadow-sm text-[11px] font-mono font-semibold text-zinc-950">
                    03 · PINYIN & PHÒNG THI
                  </span>
                </div>
                <div className="p-5 sm:p-6 space-y-1.5 flex-1">
                  <h3 className="text-base sm:text-lg font-display font-bold text-zinc-950">
                    Đủ 63 âm Pinyin chuẩn & 48+ bộ đề thi HSK 1–6
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-zinc-600 leading-relaxed">
                    Nghe phân biệt cặp âm dễ nhầm, học 3 quy tắc biến điệu thực tế và luyện 30 đề
                    thi mô phỏng + 18 sách bài tập chấm điểm tức thì.
                  </p>
                </div>
              </div>
            </SmoothReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          04. INTERACTIVE HSK 1 → 6 ROADMAP EXPLORER
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="lo-trinh" className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t border-zinc-200">
        <SmoothReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                Bản đồ năng lực HSK 1 → 6
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight">
                Chọn mục tiêu của bạn để xem chi tiết lộ trình
              </h2>
            </div>
            <p className="text-xs font-mono text-zinc-500">
              Bấm từng cấp độ để xem từ vựng & cột mốc đạt được
            </p>
          </div>

          {/* 6-Level Crisp Segmented Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1.5 rounded-xl bg-zinc-100 border border-zinc-200/80 mb-5">
            {HSK_LEVELS.map((lvl, idx) => {
              const active = activeHskIdx === idx;
              return (
                <button
                  key={lvl.code}
                  type="button"
                  onClick={() => setActiveHskIdx(idx)}
                  className={`relative rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    active ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="landing-hsk-tab"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute inset-0 rounded-lg bg-zinc-950"
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="font-display font-bold text-sm">{lvl.code}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                        active ? 'opacity-100 bg-[#FB7185]' : 'opacity-0'
                      }`}
                    />
                  </div>
                  <p
                    className={`relative z-10 text-[11px] font-mono mt-0.5 ${
                      active ? 'text-zinc-300' : 'text-zinc-400'
                    }`}
                  >
                    {lvl.words}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Interactive HSK Detail Panel */}
          <div className="rounded-2xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-[0_4px_24px_-12px_rgba(9,9,11,0.06)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeHsk.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LUCIAN_EASE }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-950 text-white font-semibold">
                      {activeHsk.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700">
                      {activeHsk.words}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[#BE123C] font-semibold">
                      Dự kiến {activeHsk.weeks}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-950 tracking-tight">
                    {activeHsk.headline}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{activeHsk.summary}</p>

                  <ul className="space-y-2 pt-1">
                    {activeHsk.milestones.map((m) => (
                      <li key={m} className="flex items-start gap-2.5 text-sm text-zinc-700">
                        <Check className="w-4 h-4 text-[#BE123C] shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-5 rounded-xl bg-[#FAFAF9] border border-zinc-200 p-5 sm:p-6 space-y-5">
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Mẫu câu đạt chuẩn {activeHsk.code}
                    </span>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-hanzi-serif text-xl font-bold text-zinc-950 leading-relaxed">
                        {activeHsk.sampleCn}
                      </p>
                      <button
                        type="button"
                        onClick={() => speakChinese(activeHsk.sampleCn, 0.82)}
                        aria-label="Nghe câu mẫu"
                        className="w-9 h-9 rounded-lg bg-white hover:bg-zinc-950 border border-zinc-200 hover:border-zinc-950 text-zinc-700 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-600 italic">“{activeHsk.sampleVi}”</p>
                  </div>

                  <div className="pt-4 border-t border-zinc-200/80">
                    <LucianLiquidButton
                      href="#/login?tab=register"
                      variant="ink"
                      size="md"
                      className="w-full"
                    >
                      <span>Bắt đầu lộ trình {activeHsk.code} miễn phí</span>
                      <ArrowRight className="w-4 h-4" />
                    </LucianLiquidButton>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </SmoothReveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          05. AUTHENTIC LEARNER OUTCOMES + DRAMATIC OBSIDIAN WEBP CTA FINALE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 border-t border-zinc-200 space-y-16">
        {/* Learner Outcomes */}
        <SmoothReveal>
          <div className="space-y-8">
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-500">
                Trải nghiệm thực tế
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight">
                Vì sao người học gắn bó mỗi ngày với Hanzi4U
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {LEARNER_STORIES.map((story, idx) => (
                <SmoothReveal key={story.name} delay={idx * 0.06}>
                  <div className="h-full p-6 rounded-2xl bg-white border border-zinc-200 flex flex-col justify-between gap-6 shadow-[0_1px_3px_rgba(9,9,11,0.03)]">
                    <p className="text-sm text-zinc-700 leading-relaxed">“{story.quote}”</p>
                    <div className="pt-4 border-t border-zinc-100">
                      <p className="text-sm font-display font-bold text-zinc-950">{story.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{story.role}</p>
                    </div>
                  </div>
                </SmoothReveal>
              ))}
            </div>
          </div>
        </SmoothReveal>

        {/* Dramatic Obsidian Architectural CTA Card with Veiled Local .webp Backdrop */}
        <SmoothReveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#0B0B0E] text-white p-8 sm:p-12 lg:p-14 border border-zinc-800 shadow-[0_24px_64px_-20px_rgba(9,9,11,0.38)]">
            {/* Subtly veiled Suzhou courtyard .webp texture */}
            <img
              src="/images/suzhou-courtyard.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.16] grayscale mix-blend-luminosity"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B0B0E] via-[#0B0B0E]/88 to-[#0B0B0E]/65"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#FB7185] font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Bắt đầu miễn phí trong 10 giây
                </span>
                <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight leading-[1.12] text-white">
                  15 phút hôm nay,{' '}
                  <span className="font-editorial italic font-normal text-zinc-300">
                    một ngôn ngữ mới cho tương lai.
                  </span>
                </h2>
                <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
                  Đăng ký bằng Google hoặc Gmail để làm khảo sát xếp trình độ và mở ngay khóa học
                  HSK cá nhân hóa. Toàn bộ tiến độ học được đồng bộ liền mạch trên mọi thiết bị.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
                <LucianLiquidButton href="#/login?tab=register" variant="porcelain" size="lg">
                  <span>Đăng ký miễn phí ngay</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </LucianLiquidButton>
                <a
                  href="#/login"
                  className="text-center text-xs font-medium text-zinc-400 hover:text-white transition-colors py-1"
                >
                  Đã có tài khoản? <span className="underline underline-offset-4">Đăng nhập</span>
                </a>
              </div>
            </div>
          </div>
        </SmoothReveal>
      </section>
    </div>
  );
};
