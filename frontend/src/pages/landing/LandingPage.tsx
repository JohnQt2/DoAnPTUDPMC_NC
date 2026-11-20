import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion';
import {
  Volume2,
  ArrowDown,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  XCircle,
  Move,
  BookOpen,
  Clock,
  GraduationCap,
  Award,
  LogIn,
  UserPlus,
  Compass,
  Sparkles,
} from 'lucide-react';
import { ThreeMinimalZenSculpture } from '../../components/three/ThreeMinimalZenSculpture';
import { HanziLogoMark } from '../../components/HanziLogo';
import { SmoothReveal, LUCIAN_EASE } from '../../components/ui';
import {
  smoothScrollToY,
  getScrollTop,
  scrollToElementById,
  consumePendingLandingTarget,
} from '../../lib/scrollNavigation';

/* ── DATA CONSTANTS ── */
const SPECIMEN_CHARS = [
  { hanzi: '汉', pinyin: 'hàn', tone: 'Thanh 4', meaning: 'Chữ Hán', phrase: '汉语 · Tiếng Hán' },
  { hanzi: '你', pinyin: 'nǐ', tone: 'Thanh 3', meaning: 'Bạn', phrase: '你好 · Xin chào' },
  { hanzi: '学', pinyin: 'xué', tone: 'Thanh 2', meaning: 'Học tập', phrase: '学习 · Học hành' },
  { hanzi: '美', pinyin: 'měi', tone: 'Thanh 3', meaning: 'Đẹp đẽ', phrase: '美丽 · Mỹ lệ' },
  { hanzi: '道', pinyin: 'dào', tone: 'Thanh 4', meaning: 'Đạo lý', phrase: '知道 · Thấu hiểu' },
];

const FOUR_TONES_BOOKS = [
  {
    code: 'TONE · 55',
    tone: 'Thanh 1',
    pinyin: 'mā',
    hanzi: '妈',
    meaning: 'Mẹ',
    hint: 'Cao & giữ phẳng',
    bg: 'bg-[#1F3A2E]',
    tilt: '-rotate-[1.5deg]',
    svgPath: 'M 10 14 L 90 14',
  },
  {
    code: 'TONE · 35',
    tone: 'Thanh 2',
    pinyin: 'má',
    hanzi: '麻',
    meaning: 'Cây gai · Tê',
    hint: 'Đi lên dứt khoát',
    bg: 'bg-[#7A2E2B]',
    tilt: 'rotate-[1deg]',
    svgPath: 'M 10 40 Q 48 28 90 12',
  },
  {
    code: 'TONE · 214',
    tone: 'Thanh 3',
    pinyin: 'mǎ',
    hanzi: '马',
    meaning: 'Con ngựa',
    hint: 'Hạ trầm rồi vút lên',
    bg: 'bg-[#2A2118]',
    tilt: '-rotate-[0.8deg]',
    svgPath: 'M 10 34 Q 44 54 90 20',
  },
  {
    code: 'TONE · 51',
    tone: 'Thanh 4',
    pinyin: 'mà',
    hanzi: '骂',
    meaning: 'Mắng',
    hint: 'Xuống mạnh & gọn',
    bg: 'bg-[#1F3A2E]',
    tilt: 'rotate-[1.4deg]',
    svgPath: 'M 10 12 Q 52 24 90 48',
  },
];

const FLASHCARD_BOOKS = [
  {
    id: 'nihao',
    code: 'HSK 1 · BÀI 01',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    meaning: 'Xin chào',
    sino: 'Nhĩ hảo',
    exampleCn: '你好，很高兴认识你！',
    examplePy: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ!',
    exampleVi: 'Xin chào, rất vui được làm quen với bạn!',
    cover: 'bg-[#1F3A2E]',
  },
  {
    id: 'xuexi',
    code: 'HSK 1 · BÀI 04',
    hanzi: '学习',
    pinyin: 'xuéxí',
    meaning: 'Học tập',
    sino: 'Học tập',
    exampleCn: '我每天学习十五分钟中文。',
    examplePy: 'Wǒ měitiān xuéxí shíwǔ fēnzhōng Zhōngwén.',
    exampleVi: 'Mỗi ngày tôi học tiếng Trung 15 phút.',
    cover: 'bg-[#7A2E2B]',
  },
  {
    id: 'xiexie',
    code: 'HSK 1 · BÀI 02',
    hanzi: '谢谢',
    pinyin: 'xièxie',
    meaning: 'Cảm ơn',
    sino: 'Tạ tạ',
    exampleCn: '谢谢你的帮助！',
    examplePy: 'Xièxie nǐ de bāngzhù!',
    exampleVi: 'Cảm ơn sự giúp đỡ của bạn!',
    cover: 'bg-[#2A2118]',
  },
];

const ARCHIVAL_KPIS = [
  {
    value: '63 âm',
    label: 'Bảng chữ cái Pinyin chuẩn',
    note: '23 thanh mẫu · 24 vận mẫu · 16 âm tiết đọc thẳng',
    bar: 'bg-[#1F3A2E]',
    icon: BookOpen,
  },
  {
    value: '15 phút',
    label: 'Thời lượng tối ưu mỗi ngày',
    note: 'Hội thoại, ngữ pháp cốt lõi và thẻ nhớ SRS',
    bar: 'bg-[#B08D3C]',
    icon: Clock,
  },
  {
    value: 'HSK 1–6',
    label: 'Lộ trình cá nhân hóa',
    note: 'Hơn 5.000 từ vựng kèm âm Hán-Việt & nét viết',
    bar: 'bg-[#7A2E2B]',
    icon: GraduationCap,
  },
  {
    value: '48+ bộ đề',
    label: 'Phòng thi mô phỏng & SBT',
    note: '30 đề thi thử & 18 bộ sách bài tập chấm điểm ngay',
    bar: 'bg-[#2A2118]',
    icon: Award,
  },
];

const RULER_BAYS = [
  { label: 'Hán tự 3D', range: '001' },
  { label: '4 Thanh điệu', range: '063' },
  { label: 'Thẻ nhớ 3D', range: '300' },
  { label: 'Lộ trình HSK', range: '600' },
  { label: 'Ghi danh', range: '900' },
];

const DECORATIVE_SPINES_LEFT = [
  { title: 'Hán Ngữ Nhập Môn', code: 'HSK 1', bg: 'bg-[#1F3A2E]', h: 'h-[260px]' },
  { title: 'Ngữ Âm Pinyin', code: '063.1', bg: 'bg-[#7A2E2B]', h: 'h-[232px]' },
  { title: 'Thư Pháp Điền Tự', code: '214.0', bg: 'bg-[#3D2E22]', h: 'h-[248px]' },
  { title: 'Từ Điển Hán-Việt', code: '500.2', bg: 'bg-[#2A2118]', h: 'h-[288px]' },
];

const DECORATIVE_SPINES_RIGHT = [
  { title: 'Hội Thoại Đời Sống', code: 'HSK 2', bg: 'bg-[#1F3A2E]', h: 'h-[256px]' },
  { title: 'Ngữ Pháp Cốt Lõi', code: 'HSK 3', bg: 'bg-[#7A2E2B]', h: 'h-[236px]' },
  { title: 'Thành Ngữ Cổ Điển', code: 'HSK 5', bg: 'bg-[#3B2B1E]', h: 'h-[268px]' },
  { title: 'Tuyển Tập Đề Thi', code: 'HSK 6', bg: 'bg-[#2A2118]', h: 'h-[288px]' },
  { title: 'Văn Hóa Trung Hoa', code: '909.5', bg: 'bg-[#1F3A2E]', h: 'h-[248px]' },
];

/** Decorative vertical Chinese textbook spine sitting flush on the rosewood shelf */
const BookSpineStack: React.FC<{
  books: Array<{ title: string; code: string; bg: string; h: string }>;
}> = ({ books }) => (
  <div className="hidden xl:flex items-end gap-[3px] shrink-0 select-none" aria-hidden="true">
    {books.map((b) => (
      <div
        key={b.title}
        className={`${b.bg} ${b.h} w-8 rounded-t-[3px] border-t border-x border-[#B08D3C]/35 flex flex-col items-center justify-between gap-2 py-3 px-0.5 shadow-md`}
      >
        <span className="w-4 h-[1px] bg-[#B08D3C]/65 shrink-0" />
        <span
          className="text-[9.5px] leading-none font-editorial tracking-wide text-[#FBF7EC]/90 whitespace-nowrap my-auto"
          style={{ writingMode: 'vertical-rl' }}
        >
          {b.title}
        </span>
        <span className="px-1 py-0.5 bg-[#FBF7EC] text-[#2A2118] text-[7.5px] leading-none font-mono font-bold rounded-[2px] whitespace-nowrap shrink-0">
          {b.code}
        </span>
      </div>
    ))}
  </div>
);

/** Minimalist potted bamboo in arched library niche (echoing Libri's Bay 5 architectural accent) */
const BambooArchNiche: React.FC = () => (
  <div
    aria-hidden="true"
    className="hidden xl:flex flex-col items-center justify-end w-40 h-72 rounded-t-full border border-[#DECFAA] bg-[#EFE6D2]/55 pt-8 pb-0 shrink-0 relative overflow-hidden"
  >
    <svg viewBox="0 0 120 180" className="w-28 h-44" fill="none">
      {/* Slender Bamboo Stems & Leaves in Forest Jade */}
      <path d="M60 122 C58 92 54 68 42 36" stroke="#1F3A2E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M62 122 C65 94 72 72 86 44" stroke="#1F3A2E" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M60 122 C60 88 62 56 64 24" stroke="#2B4F3F" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M48 56 C32 50 22 54 16 62 C28 64 40 62 48 56Z" fill="#1F3A2E" />
      <path d="M62 48 C76 34 88 32 98 34 C88 44 76 50 62 48Z" fill="#2B4F3F" />
      <path d="M76 74 C92 66 102 68 110 74 C98 80 86 80 76 74Z" fill="#1F3A2E" />
      <path d="M52 84 C36 78 24 82 18 90 C32 92 44 90 52 84Z" fill="#2B4F3F" />
      <path d="M63 26 C56 14 54 8 56 2 C64 10 66 18 63 26Z" fill="#1F3A2E" />
      {/* Clay Scholar Pot */}
      <path d="M36 122 H84 L77 176 H43 L36 122Z" fill="#6B3D2E" stroke="#3D2016" strokeWidth="1.5" />
      <rect x="33" y="116" width="54" height="8" rx="2" fill="#7D4938" stroke="#3D2016" strokeWidth="1.5" />
    </svg>
  </div>
);

export const LandingPage: React.FC = () => {
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [activeToneIdx, setActiveToneIdx] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [activeBay, setActiveBay] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktopViewport(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Silky 120fps Vertical-Scroll-to-Horizontal Bookshelf Engine (aligned exactly to sticky top-16 = 64px)
  const shelfContainerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: shelfProgress } = useScroll({
    target: shelfContainerRef,
    offset: ['start 64px', 'end end'],
  });
  const smoothShelf = useSpring(shelfProgress, {
    stiffness: 185,
    damping: 30,
    mass: 0.24,
  });
  const shelfX = useTransform(smoothShelf, [0, 1], ['0%', '-80%']);

  useMotionValueEvent(shelfProgress, 'change', (latest) => {
    const idx = Math.min(4, Math.max(0, Math.round(latest * 4)));
    setActiveBay((prev) => (prev === idx ? prev : idx));
  });

  // Hero subtle parallax
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImgY = useTransform(heroScroll, [0, 1], ['0%', '14%']);

  const activeChar = SPECIMEN_CHARS[selectedCharIdx];

  const speakChinese = (text: string, rate = 0.78) => {
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

  /** Smoothly scroll vertically so the horizontal wooden shelf pans directly to the selected bay */
  const scrollToBay = useCallback((bayIdx: number) => {
    const clampedIdx = Math.min(4, Math.max(0, bayIdx));
    setActiveBay(clampedIdx);

    const el = shelfContainerRef.current;
    if (!el) return;

    if (window.innerWidth < 1024) {
      const mobileTargetId = clampedIdx === 4 ? 'ghi-danh-mobile' : `shelf-bay-${Math.min(clampedIdx, 1)}`;
      scrollToElementById(mobileTargetId, 72, 560);
      return;
    }

    const navHeight = 64;
    const rect = el.getBoundingClientRect();
    const elTopDoc = rect.top + getScrollTop();
    // Exact range matching useScroll offset: ['start 64px', 'end end']
    const startY = elTopDoc - navHeight;
    const scrollable = Math.max(1, el.offsetHeight - (window.innerHeight - navHeight));
    const targetY = startY + (clampedIdx / 4) * scrollable;
    smoothScrollToY(targetY, 600);
  }, []);

  // Listen to Navbar / Footer bay-jump requests & handle pending jumps from #/login
  useEffect(() => {
    const onGotoBay = (e: Event) => {
      const detail = (e as CustomEvent<{ bayIdx: number }>).detail;
      if (detail && typeof detail.bayIdx === 'number') {
        scrollToBay(detail.bayIdx);
      }
    };
    window.addEventListener('hanzi:goto-bay', onGotoBay);

    const pending = consumePendingLandingTarget();
    if (pending) {
      requestAnimationFrame(() => {
        if (pending.type === 'bay') scrollToBay(pending.bayIdx);
        else scrollToElementById(pending.id, pending.offsetPx, 560);
      });
    }

    return () => window.removeEventListener('hanzi:goto-bay', onGotoBay);
  }, [scrollToBay]);

  const scrollToShelf = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToBay(0);
  };

  return (
    <div className="bg-[#F3ECDC] text-[#2A2118]">
      {/* ═══════════════════════════════════════════════════════════════════
          01. FULL-BLEED DARK-ACADEMIA CHINESE STUDY LIBRARY HERO
          (Inspired directly by libri.id.vn's atmospheric full-bleed Hero)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-[#1A130D]"
      >
        {/* Custom Photorealistic Chinese Study Library .webp with Silky GPU Parallax */}
        <motion.div
          aria-hidden="true"
          style={{ y: heroImgY }}
          className="pointer-events-none absolute inset-0 -top-8 -bottom-16 will-change-transform"
        >
          <img
            src="/images/hero-chinese-study.webp"
            alt=""
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>

        {/* Moody Heritage Vignette for Effortless Ivory Typography Contrast */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 65% at 50% 42%, rgba(22, 16, 11, 0.56) 0%, rgba(18, 13, 9, 0.78) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1E1610] to-transparent"
        />

        {/* Centered Editorial Lockup */}
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 py-16 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: LUCIAN_EASE }}
            className="inline-flex flex-col items-center gap-3"
          >
            <HanziLogoMark variant="dark" className="w-12 h-12" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#D4B26A]">
              THƯ PHÒNG HÁN NGỮ · CHUẨN HSK 1 — 6
            </span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.08, ease: LUCIAN_EASE }}
              className="font-editorial font-semibold text-5xl sm:text-6xl lg:text-[74px] tracking-[0.06em] text-[#FBF7EC] leading-[1.06] drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
            >
              THƯ PHÒNG HANZI4U
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: LUCIAN_EASE }}
            className="text-base sm:text-lg text-[#FBF7EC]/85 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Nơi mỗi nét bút mở ra một ngôn ngữ mới — học đủ{' '}
            <strong className="font-semibold text-[#FBF7EC]">63 âm Pinyin chuẩn</strong>, xem thứ tự
            từng nét thư pháp, ôn thẻ nhớ 3D và luyện 48+ bộ đề HSK trong không gian tĩnh lặng.
          </motion.p>

          {/* Antique Brass Primary CTA + Translucent Register CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: LUCIAN_EASE }}
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <a
              href="#thu-phong"
              onClick={scrollToShelf}
              className="h-12 px-7 rounded-[6px] bg-[#B08D3C] hover:bg-[#9C7B30] text-[#1E1610] font-semibold text-sm inline-flex items-center gap-2 transition-all duration-200 shadow-[0_10px_28px_-6px_rgba(176,141,60,0.5)] active:scale-[0.98]"
            >
              <ArrowDown className="w-4 h-4" />
              <span>Đi dọc kệ học HSK</span>
            </a>

            <a
              href="#/login?tab=register"
              className="h-12 px-7 rounded-[6px] bg-[#1F3A2E]/85 hover:bg-[#1F3A2E] text-[#FBF7EC] border border-[#D4B26A]/50 font-semibold text-sm inline-flex items-center gap-2 transition-all duration-200 backdrop-blur-sm active:scale-[0.98]"
            >
              <span>Đăng ký học miễn phí</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Quiet Gold Hairline Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-[#FBF7EC]/65 font-mono"
          >
            <span>63 ÂM PINYIN CHUẨN</span>
            <span className="text-[#B08D3C]">·</span>
            <span>LỘ TRÌNH HSK 1 → 6</span>
            <span className="text-[#B08D3C]">·</span>
            <span>MIỄN PHÍ BẮT ĐẦU</span>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          02. DARK ESPRESSO 50/50 EDITORIAL MANIFESTO (#gioi-thieu)
          (Mirrors libri.id.vn's sunlit macro open-book split section)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="gioi-thieu"
        className="bg-[#1E1610] text-[#FBF7EC] border-y border-[#B08D3C]/20"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left: Sunlit Macro TianZiGe Chinese Calligraphy Practice Notebook (.webp) */}
          <div className="lg:col-span-6 relative min-h-[340px] sm:min-h-[460px] lg:min-h-[580px] overflow-hidden">
            <img
              src="/images/intro-hanzi-notebook.webp"
              alt="Vở tập viết chữ Hán Điền Tự Cách bằng bút lông và dấu ấn đỏ trong ánh nắng chiều"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1E1610]/70 hidden lg:block"
            />
          </div>

          {/* Right: Editorial Manifesto & 3 Gold-Labeled Archival Rows */}
          <div className="lg:col-span-6 px-6 sm:px-12 lg:px-14 py-14 lg:py-20 flex flex-col justify-center space-y-7">
            <SmoothReveal>
              <div className="space-y-4">
                <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#B08D3C]">
                  GIỚI THIỆU HỌC VIỆN
                </p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#FBF7EC] leading-[1.18]">
                  Thư phòng tiếng Trung dành cho người Việt
                </h2>
                <p className="text-sm sm:text-[15px] text-[#FBF7EC]/75 leading-relaxed">
                  Học chữ Hán không cần vội vã hay nhồi nhét. Hanzi4U tái hiện sự tĩnh tại của một
                  thư phòng cổ điển kết hợp công nghệ học tập hiện đại — giúp bạn giữ nhịp 15 phút
                  mỗi ngày mà nhớ sâu bền vững.
                </p>
              </div>
            </SmoothReveal>

            <SmoothReveal delay={0.08}>
              <div className="divide-y divide-[#DECFAA]/15 border-t border-b border-[#DECFAA]/15">
                {[
                  {
                    label: 'Định danh',
                    text: 'Nền tảng tự học tiếng Trung bài bản từ con số 0 đến HSK 6, thiết kế tối ưu cho tư duy âm Hán-Việt.',
                  },
                  {
                    label: 'Phương pháp',
                    text: 'Kết hợp 63 âm Pinyin chuẩn phổ thông, mô phỏng thứ tự từng nét thư pháp và thuật toán lặp lại ngắt quãng SM-2.',
                  },
                  {
                    label: 'Cam kết',
                    text: 'Không quảng cáo, không hiệu ứng gây xao nhãng — chỉ tập trung vào độ chuẩn xác và trải nghiệm mượt mà nhất.',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline"
                  >
                    <span className="sm:col-span-3 font-editorial font-semibold text-sm text-[#D4B26A]">
                      {row.label}
                    </span>
                    <p className="sm:col-span-9 text-xs sm:text-[13.5px] text-[#FBF7EC]/80 leading-relaxed">
                      {row.text}
                    </p>
                  </div>
                ))}
              </div>
            </SmoothReveal>

            <SmoothReveal delay={0.14}>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <a
                  href="#/login?tab=register"
                  className="h-11 px-6 rounded-[6px] bg-[#B08D3C] hover:bg-[#9C7B30] text-[#1E1610] font-semibold text-sm inline-flex items-center gap-2 transition-colors"
                >
                  <span>Tạo thẻ học viên miễn phí</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#thu-phong"
                  onClick={scrollToShelf}
                  className="text-xs font-semibold text-[#D4B26A] hover:text-[#FBF7EC] inline-flex items-center gap-1.5 transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  <span>Khám phá 5 gian kệ học bên dưới</span>
                </a>
              </div>
            </SmoothReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          03. SIGNATURE SCROLL-TO-HORIZONTAL TACTILE WOODEN STUDY SHELF (#thu-phong)
          (5 Interactive Chinese-Learning Bays + Rosewood Plank + Floating HSK RULER Dock!)
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        id="thu-phong"
        ref={shelfContainerRef}
        className="relative bg-[#F3ECDC] lg:h-[4600px]"
      >
        <div className="lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:overflow-hidden flex flex-col justify-center relative">
          {/* Subtle Architectural Parchment Wall Line-Art Background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 hidden lg:block"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(222,207,170,0.22) 1px, transparent 1px)',
              backgroundSize: '280px 100%',
            }}
          />

          {/* Horizontal Sliding Track on Desktop (Vertical Stack on Mobile) */}
          <motion.div
            style={{ x: shelfX }}
            className="hidden lg:flex w-[500%] h-full items-center will-change-transform"
          >
            {/* ── BAY 1 (001 — 005): INTERACTIVE 3D HANZI ARMILLARY EXHIBIT ── */}
            <section className="w-[20%] shrink-0 h-full px-10 xl:px-16 flex flex-col justify-center pb-14 relative">
              {/* Oversized Archival Watermark */}
              <span
                aria-hidden="true"
                className="pointer-events-none select-none absolute top-14 left-1/2 -translate-x-1/2 font-editorial text-[210px] font-bold text-[#DECFAA]/35 leading-none"
              >
                01
              </span>

              <div className="relative z-10 max-w-6xl w-full mx-auto">
                {/* Bay Header */}
                <div className="text-center mb-7 space-y-1.5">
                  <span className="inline-block text-[11px] font-mono font-bold tracking-[0.22em] text-[#B08D3C] border-b border-[#B08D3C] pb-1">
                    001 — 005
                  </span>
                  <h2 className="font-editorial text-4xl font-bold text-[#2A2118]">
                    Triển Lãm Hán Tự 3D
                  </h2>
                  <p className="text-sm text-[#6B5B4B] max-w-xl mx-auto">
                    Kéo xoay khối hỗn thiên nghi bằng đồng và ngọc thạch 3D, bấm chọn từng chữ Hán
                    để nghe phát âm chuẩn phổ thông.
                  </p>
                </div>

                {/* Bay Content resting on Wooden Shelf */}
                <div className="flex items-end justify-center gap-6">
                  <BookSpineStack books={DECORATIVE_SPINES_LEFT} />

                  <div className="flex-1 max-w-4xl rounded-t-[10px] rounded-b-[4px] bg-[#FBF7EC] border border-[#DECFAA] shadow-[0_12px_36px_-14px_rgba(42,33,24,0.18)] grid grid-cols-12 overflow-hidden">
                    {/* Left 3D Stage */}
                    <div className="col-span-6 h-[360px] relative bg-[#F3ECDC]/55 border-r border-[#DECFAA]">
                      {isDesktopViewport && (
                        <ThreeMinimalZenSculpture
                          activeHanzi={activeChar.hanzi}
                          tone="parchment"
                          className="w-full h-full"
                        />
                      )}
                      <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#FBF7EC]/95 border border-[#DECFAA] text-[10px] font-mono font-semibold text-[#6B5B4B]">
                        <Move className="w-3 h-3 text-[#B08D3C]" />
                        Kéo để xoay 3D
                      </span>
                    </div>

                    {/* Right Specimen Controls */}
                    <div className="col-span-6 p-7 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-dashed border-[#DECFAA] pb-3">
                          <span className="text-[11px] font-mono font-bold tracking-widest text-[#B08D3C] uppercase">
                            MẪU CHỮ · {activeChar.tone}
                          </span>
                          <button
                            type="button"
                            onClick={() => speakChinese(activeChar.hanzi, 0.78)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer ${
                              isSpeaking
                                ? 'bg-[#7A2E2B] text-[#FBF7EC]'
                                : 'bg-[#1F3A2E] hover:bg-[#172D23] text-[#FBF7EC]'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe đọc</span>
                          </button>
                        </div>

                        <div className="flex items-baseline gap-4">
                          <span className="font-hanzi-serif text-6xl font-bold text-[#2A2118]">
                            {activeChar.hanzi}
                          </span>
                          <div>
                            <p className="font-mono text-xl font-bold text-[#7A2E2B]">
                              {activeChar.pinyin}
                            </p>
                            <p className="text-sm font-semibold text-[#2A2118]">
                              {activeChar.meaning}
                            </p>
                            <p className="text-xs text-[#6B5B4B] mt-0.5">{activeChar.phrase}</p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-[11px] font-mono uppercase tracking-wider text-[#6B5B4B] mb-2">
                            Chọn chữ Hán khác
                          </p>
                          <div className="flex items-center gap-2">
                            {SPECIMEN_CHARS.map((item, idx) => {
                              const active = idx === selectedCharIdx;
                              return (
                                <button
                                  key={item.hanzi}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCharIdx(idx);
                                    speakChinese(item.hanzi, 0.78);
                                  }}
                                  className={`w-11 h-11 rounded-[6px] font-hanzi-serif text-xl font-bold transition-all cursor-pointer border ${
                                    active
                                      ? 'bg-[#1F3A2E] text-[#FBF7EC] border-[#1F3A2E] shadow-sm'
                                      : 'bg-[#F3ECDC]/70 hover:bg-[#EADFC5] text-[#2A2118] border-[#DECFAA]'
                                  }`}
                                >
                                  {item.hanzi}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-dashed border-[#DECFAA] flex items-center justify-between text-xs">
                        <span className="text-[#6B5B4B]">Tích hợp hơn 9.500 nét viết chuẩn</span>
                        <a
                          href="#/login?tab=register"
                          className="font-semibold text-[#7A2E2B] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Tập viết ngay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continuous Dark Rosewood Bookshelf Plank */}
                <div className="h-6 w-full rounded-[3px] wood-shelf-plank" />
              </div>
            </section>

            {/* ── BAY 2 (010 — 063): 4 TONES STANDING BOOK COVERS ── */}
            <section className="w-[20%] shrink-0 h-full px-10 xl:px-16 flex flex-col justify-center pb-14 relative">
              <span
                aria-hidden="true"
                className="pointer-events-none select-none absolute top-14 left-1/2 -translate-x-1/2 font-editorial text-[210px] font-bold text-[#DECFAA]/35 leading-none"
              >
                02
              </span>

              <div className="relative z-10 max-w-6xl w-full mx-auto">
                <div className="text-center mb-8 space-y-1.5">
                  <span className="inline-block text-[11px] font-mono font-bold tracking-[0.22em] text-[#B08D3C] border-b border-[#B08D3C] pb-1">
                    010 — 063
                  </span>
                  <h2 className="font-editorial text-4xl font-bold text-[#2A2118]">
                    4 Thanh Điệu & 63 Âm Pinyin
                  </h2>
                  <p className="text-sm text-[#6B5B4B] max-w-xl mx-auto">
                    Bấm trực tiếp vào từng cuốn sổ thanh điệu trên kệ để nghe sự khác biệt cao độ
                    giữa <strong className="font-mono text-[#2A2118]">mā · má · mǎ · mà</strong>.
                  </p>
                </div>

                {/* Tactile Tilted Book Covers Resting on Shelf (Libri signature!) */}
                <div className="grid grid-cols-4 gap-5 px-4 items-end">
                  {FOUR_TONES_BOOKS.map((book, idx) => {
                    const active = activeToneIdx === idx;
                    return (
                      <button
                        key={book.pinyin}
                        type="button"
                        onClick={() => {
                          setActiveToneIdx(idx);
                          speakChinese(book.hanzi, 0.72);
                        }}
                        className={`group text-left rounded-t-[8px] rounded-b-[3px] p-5 ${book.bg} text-[#FBF7EC] border border-[#B08D3C]/35 shadow-[0_14px_28px_-10px_rgba(30,22,16,0.38)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2.5 hover:rotate-0 cursor-pointer relative ${
                          active ? '-translate-y-2 rotate-0 ring-2 ring-[#B08D3C]' : book.tilt
                        }`}
                      >
                        {/* Inner gold stitched hairline */}
                        <div className="border border-dashed border-[#D4B26A]/35 rounded-[4px] p-4 space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#D4B26A]">
                            <span>{book.code}</span>
                            <Volume2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                          </div>

                          <svg viewBox="0 0 100 58" className="w-full h-11" aria-hidden="true">
                            <line
                              x1="8"
                              y1="14"
                              x2="92"
                              y2="14"
                              stroke="rgba(251,247,236,0.16)"
                              strokeDasharray="2 3"
                            />
                            <line
                              x1="8"
                              y1="48"
                              x2="92"
                              y2="48"
                              stroke="rgba(251,247,236,0.16)"
                              strokeDasharray="2 3"
                            />
                            <path
                              d={book.svgPath}
                              fill="none"
                              stroke="#D4B26A"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </svg>

                          <div className="text-center space-y-1">
                            <p className="font-hanzi-serif text-5xl font-bold text-[#FBF7EC]">
                              {book.hanzi}
                            </p>
                            <p className="font-mono text-lg font-bold text-[#D4B26A]">
                              {book.pinyin}
                            </p>
                            <p className="font-editorial italic text-sm text-[#FBF7EC]/85">
                              {book.meaning}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-[#FBF7EC]/15 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FBF7EC] text-[#2A2118] text-[10.5px] font-semibold">
                              {book.tone} · {book.hint}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="h-6 w-full rounded-[3px] wood-shelf-plank" />
              </div>
            </section>

            {/* ── BAY 3 (100 — 300): INTERACTIVE 3D FLIP FLASHCARD VOLUMES ── */}
            <section className="w-[20%] shrink-0 h-full px-10 xl:px-16 flex flex-col justify-center pb-14 relative">
              <span
                aria-hidden="true"
                className="pointer-events-none select-none absolute top-14 left-1/2 -translate-x-1/2 font-editorial text-[210px] font-bold text-[#DECFAA]/35 leading-none"
              >
                03
              </span>

              <div className="relative z-10 max-w-6xl w-full mx-auto">
                <div className="text-center mb-8 space-y-1.5">
                  <span className="inline-block text-[11px] font-mono font-bold tracking-[0.22em] text-[#B08D3C] border-b border-[#B08D3C] pb-1">
                    100 — 300
                  </span>
                  <h2 className="font-editorial text-4xl font-bold text-[#2A2118]">
                    Thẻ Nhớ 3D & Từ Vựng Hán-Việt
                  </h2>
                  <p className="text-sm text-[#6B5B4B] max-w-xl mx-auto">
                    Bấm vào từng cuốn thẻ trên kệ để lật 3D xem âm Hán-Việt, câu giao tiếp thực tế
                    và nghe giọng đọc bản xứ.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 px-6">
                  {FLASHCARD_BOOKS.map((card) => {
                    const flipped = !!flippedCards[card.id];
                    return (
                      <div
                        key={card.id}
                        onClick={() =>
                          setFlippedCards((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
                        }
                        className="perspective-1000 h-[310px] cursor-pointer select-none group"
                      >
                        <div
                          className={`relative w-full h-full flip-3d-inner ${
                            flipped ? 'rotate-y-180' : ''
                          }`}
                        >
                          {/* Front: Archival Dark Book Cover */}
                          <div
                            className={`absolute inset-0 backface-hidden rounded-t-[8px] rounded-b-[3px] ${card.cover} text-[#FBF7EC] p-5 border border-[#B08D3C]/35 shadow-[0_14px_30px_-12px_rgba(30,22,16,0.4)] flex flex-col justify-between`}
                          >
                            <div className="flex items-center justify-between text-[10.5px] font-mono text-[#D4B26A]">
                              <span>{card.code}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakChinese(card.hanzi, 0.8);
                                }}
                                aria-label={`Nghe ${card.hanzi}`}
                                className="w-8 h-8 rounded-full bg-[#FBF7EC]/10 hover:bg-[#B08D3C] text-[#FBF7EC] hover:text-[#1E1610] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="text-center space-y-2 py-2 border-y border-dashed border-[#D4B26A]/30">
                              <p className="font-hanzi-serif text-5xl font-bold text-[#FBF7EC]">
                                {card.hanzi}
                              </p>
                              <p className="font-mono text-base font-semibold text-[#D4B26A]">
                                {card.pinyin}
                              </p>
                              <p className="font-editorial italic text-base text-[#FBF7EC]/90">
                                {card.meaning}
                              </p>
                            </div>

                            <p className="text-[11px] text-[#FBF7EC]/65 text-center flex items-center justify-center gap-1.5">
                              <RotateCw className="w-3.5 h-3.5 text-[#D4B26A] transition-transform duration-300 group-hover:rotate-90" />
                              <span>Bấm để lật xem ví dụ & âm Hán-Việt</span>
                            </p>
                          </div>

                          {/* Back: Warm Xuan Paper Page */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-t-[8px] rounded-b-[3px] bg-[#FBF7EC] text-[#2A2118] p-6 border border-[#DECFAA] shadow-lg flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-dashed border-[#DECFAA] pb-3">
                              <span className="font-hanzi-serif text-2xl font-bold text-[#1F3A2E]">
                                {card.hanzi}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#F3ECDC] border border-[#DECFAA] text-[11px] font-semibold text-[#7A2E2B]">
                                Hán-Việt: {card.sino}
                              </span>
                            </div>

                            <div className="p-4 rounded-[6px] bg-[#F3ECDC]/75 border border-[#DECFAA] space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-hanzi-serif text-base font-bold text-[#2A2118]">
                                  {card.exampleCn}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakChinese(card.exampleCn, 0.8);
                                  }}
                                  aria-label="Nghe câu ví dụ"
                                  className="w-7 h-7 rounded-full bg-[#1F3A2E] text-[#FBF7EC] flex items-center justify-center shrink-0 cursor-pointer"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="font-mono text-[11.5px] text-[#7A2E2B] font-semibold">
                                {card.examplePy}
                              </p>
                              <p className="text-xs text-[#6B5B4B]">{card.exampleVi}</p>
                            </div>

                            <p className="text-[11px] text-[#6B5B4B] text-center">
                              Ôn lại tự động theo thuật toán lặp lại SM-2
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="h-6 w-full rounded-[3px] wood-shelf-plank" />
              </div>
            </section>

            {/* ── BAY 4 (HSK 1 — HSK 6): ARCHIVAL KPI CARDS & MINI HSK QUIZ ── */}
            <section className="w-[20%] shrink-0 h-full px-10 xl:px-16 flex flex-col justify-center pb-14 relative">
              <span
                aria-hidden="true"
                className="pointer-events-none select-none absolute top-14 left-1/2 -translate-x-1/2 font-editorial text-[210px] font-bold text-[#DECFAA]/35 leading-none"
              >
                04
              </span>

              <div className="relative z-10 max-w-6xl w-full mx-auto">
                <div className="text-center mb-7 space-y-1.5">
                  <span className="inline-block text-[11px] font-mono font-bold tracking-[0.22em] text-[#B08D3C] border-b border-[#B08D3C] pb-1">
                    HSK 1 — HSK 6
                  </span>
                  <h2 className="font-editorial text-4xl font-bold text-[#2A2118]">
                    Quy Chuẩn Lộ Trình & Kiểm Tra Nhanh
                  </h2>
                  <p className="text-sm text-[#6B5B4B] max-w-xl mx-auto">
                    Hệ thống giáo trình tinh gọn cùng bài thử nhanh 10 giây để đánh giá phản xạ tiếng
                    Trung của bạn.
                  </p>
                </div>

                {/* 4 Archival Ivory Cards with 3px Top Color Bar (Libri Bay 3 style!) */}
                <div className="grid grid-cols-4 gap-4 mb-5">
                  {ARCHIVAL_KPIS.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                      <div
                        key={kpi.value}
                        className="rounded-[8px] bg-[#FBF7EC] border border-[#DECFAA] overflow-hidden shadow-xs"
                      >
                        <div className={`h-1 w-full ${kpi.bar}`} />
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-editorial text-2xl font-bold text-[#2A2118]">
                              {kpi.value}
                            </span>
                            <Icon className="w-4 h-4 text-[#B08D3C]" />
                          </div>
                          <p className="text-xs font-semibold text-[#2A2118]">{kpi.label}</p>
                          <p className="text-[11px] text-[#6B5B4B] leading-relaxed border-t border-dashed border-[#DECFAA] pt-2">
                            {kpi.note}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mini HSK 1 Interactive Test Card resting right on the Wooden Shelf */}
                <div className="rounded-t-[8px] rounded-b-[3px] bg-[#FBF7EC] border border-[#DECFAA] p-5 shadow-md flex items-center justify-between gap-6">
                  <div className="space-y-1 shrink-0 max-w-xs">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A2E2B] font-bold">
                      TRẮC NGHIỆM NHANH · HSK 1
                    </span>
                    <p className="font-editorial text-lg font-bold text-[#2A2118]">
                      Câu <span className="font-hanzi-serif text-[#7A2E2B]">「你好吗？」</span> nghĩa là
                      gì?
                    </p>
                    <button
                      type="button"
                      onClick={() => speakChinese('你好吗', 0.78)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F3A2E] hover:underline cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe câu hỏi (Nǐ hǎo ma?)</span>
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'A', label: 'Bạn tên là gì?' },
                      { id: 'B', label: 'Bạn có khỏe không?', ok: true },
                      { id: 'C', label: 'Bạn đi đâu vậy?' },
                      { id: 'D', label: 'Cảm ơn rất nhiều' },
                    ].map((opt) => {
                      const picked = quizChoice === opt.id;
                      const answered = quizChoice !== null;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQuizChoice(opt.id)}
                          className={`px-3.5 py-2.5 rounded-[6px] border text-left text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                            answered
                              ? opt.ok
                                ? 'bg-[#1F3A2E] border-[#1F3A2E] text-[#FBF7EC]'
                                : picked
                                  ? 'bg-[#7A2E2B] border-[#7A2E2B] text-[#FBF7EC]'
                                  : 'bg-[#F3ECDC]/60 border-[#DECFAA] text-[#6B5B4B]'
                              : 'bg-white hover:bg-[#F3ECDC] border-[#DECFAA] hover:border-[#B08D3C] text-[#2A2118]'
                          }`}
                        >
                          <span>
                            <strong className="font-mono mr-1.5">{opt.id}.</strong>
                            {opt.label}
                          </span>
                          {answered && opt.ok && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          {answered && picked && !opt.ok && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-6 w-full rounded-[3px] wood-shelf-plank" />
              </div>
            </section>

            {/* ── BAY 5 (GHI DANH): QUẦY NHẬP HỌC HANZI4U (Directly echoing Libri Bay 5!) ── */}
            <section className="w-[20%] shrink-0 h-full px-10 xl:px-16 flex flex-col justify-center pb-14 relative">
              <span
                aria-hidden="true"
                className="pointer-events-none select-none absolute top-14 left-1/2 -translate-x-1/2 font-editorial text-[210px] font-bold text-[#DECFAA]/35 leading-none"
              >
                05
              </span>

              <div className="relative z-10 max-w-6xl w-full mx-auto">
                <div className="text-center mb-8 space-y-1.5">
                  <span className="inline-block text-[11px] font-mono font-bold tracking-[0.22em] text-[#B08D3C] border-b border-[#B08D3C] pb-1">
                    GHI DANH HỌC VIÊN
                  </span>
                  <h2 className="font-editorial text-4xl font-bold text-[#2A2118]">
                    Quầy Nhập Học Hanzi4U
                  </h2>
                  <p className="text-sm text-[#6B5B4B] max-w-xl mx-auto">
                    Cấp tài khoản miễn phí trong 10 giây, làm khảo sát xếp trình độ và mở ngay khóa
                    học HSK cá nhân hóa.
                  </p>
                </div>

                {/* Concierge Card flanked by Book Spines & Bamboo Arch Niche (Libri Bay 5!) */}
                <div className="flex items-end justify-center gap-5">
                  <BookSpineStack books={DECORATIVE_SPINES_LEFT} />

                  <div className="relative flex-1 max-w-xl rounded-t-[10px] rounded-b-[4px] bg-[#FBF7EC] border border-[#DECFAA] px-7 pt-9 pb-7 shadow-[0_14px_38px_-14px_rgba(42,33,24,0.2)]">
                    {/* Floating Dark Jade Crown Pill */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-[#1F3A2E] border border-[#B08D3C]/60 text-[10.5px] font-mono font-bold tracking-[0.16em] text-[#FBF7EC] uppercase whitespace-nowrap shadow-md">
                      BÀN GHI DANH & XẾP LỘ TRÌNH HSK 1–6
                    </div>

                    <div className="grid grid-cols-2 gap-6 pb-5 border-b border-[#DECFAA]">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#1F3A2E] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#B08D3C]" />
                          Quyền Lợi Miễn Phí
                        </p>
                        <p className="text-xs font-semibold text-[#2A2118]">
                          Trọn bộ 63 âm Pinyin & HSK 1
                        </p>
                        <p className="text-[11px] text-[#6B5B4B]">
                          Tập viết chữ Hán, thẻ nhớ SRS & đề thi thử
                        </p>
                      </div>
                      <div className="space-y-1 border-l border-[#DECFAA] pl-5">
                        <p className="text-xs font-bold text-[#1F3A2E] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#B08D3C]" />
                          Khởi Tạo Nhanh Chóng
                        </p>
                        <p className="text-xs font-semibold text-[#2A2118]">
                          Google OAuth hoặc Gmail OTP
                        </p>
                        <p className="text-[11px] text-[#6B5B4B]">
                          Đồng bộ tiến độ xuyên suốt mọi thiết bị
                        </p>
                      </div>
                    </div>

                    <p className="py-3.5 text-center text-xs text-[#6B5B4B] border-b border-[#DECFAA]">
                      Hỗ trợ đầy đủ lộ trình từ người mới bắt đầu đến mục tiêu chứng chỉ{' '}
                      <strong className="text-[#7A2E2B]">HSK 6</strong> · Không yêu cầu thẻ thanh toán
                    </p>

                    <div className="pt-5 grid grid-cols-2 gap-3">
                      <a
                        href="#/login?tab=register"
                        className="h-11 rounded-[6px] bg-[#1F3A2E] hover:bg-[#172D23] text-[#FBF7EC] font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <UserPlus className="w-4 h-4 text-[#D4B26A]" />
                        <span>Đăng Ký Học Miễn Phí</span>
                      </a>
                      <a
                        href="#/login"
                        className="h-11 rounded-[6px] bg-[#FBF7EC] hover:bg-[#F3ECDC] text-[#2A2118] border border-[#DECFAA] hover:border-[#B08D3C] font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <LogIn className="w-4 h-4 text-[#1F3A2E]" />
                        <span>Đăng Nhập Tài Khoản</span>
                      </a>
                    </div>
                  </div>

                  <BookSpineStack books={DECORATIVE_SPINES_RIGHT} />
                  <BambooArchNiche />
                </div>

                <div className="h-6 w-full rounded-[3px] wood-shelf-plank" />
              </div>
            </section>
          </motion.div>

          {/* ── FLOATING BOTTOM 'HSK RULER' NAVIGATION DOCK (Desktop, mirrors Libri's DDC RULER!) ── */}
          <div className="hidden lg:flex justify-center absolute bottom-5 inset-x-0 z-30 pointer-events-none">
            <div className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#1F3A2E] border border-[#B08D3C]/45 shadow-[0_14px_34px_-8px_rgba(20,34,26,0.55)]">
              <span className="px-3 text-[10.5px] font-mono font-bold tracking-[0.18em] text-[#D4B26A] uppercase border-r border-[#FBF7EC]/15 mr-1">
                HSK RULER
              </span>
              {RULER_BAYS.map((bay, idx) => {
                const active = activeBay === idx;
                return (
                  <button
                    key={bay.label}
                    type="button"
                    onClick={() => scrollToBay(idx)}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      active ? 'text-[#1F3A2E] font-semibold' : 'text-[#FBF7EC]/75 hover:text-[#FBF7EC]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="hsk-ruler-active"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-full bg-[#FBF7EC] shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{bay.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── MOBILE / TABLET CLEAN VERTICAL FALLBACK (< lg) ── */}
          <div className="lg:hidden px-5 py-12 space-y-12">
            {/* Mobile Bay 1: 3D Specimen */}
            <div id="shelf-bay-0" className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-[#B08D3C]">001 — 005</span>
                <h2 className="font-editorial text-2xl font-bold text-[#2A2118]">
                  Triển Lãm Hán Tự 3D
                </h2>
              </div>
              <div className="rounded-[10px] bg-[#FBF7EC] border border-[#DECFAA] overflow-hidden">
                <div className="h-72 bg-[#F3ECDC]/60 border-b border-[#DECFAA]">
                  {!isDesktopViewport && (
                    <ThreeMinimalZenSculpture activeHanzi={activeChar.hanzi} tone="parchment" />
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold text-[#7A2E2B]">
                        {activeChar.pinyin}{' '}
                        <span className="font-sans text-sm text-[#2A2118]">· {activeChar.meaning}</span>
                      </p>
                      <p className="text-xs text-[#6B5B4B]">{activeChar.phrase}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakChinese(activeChar.hanzi, 0.78)}
                      className="w-10 h-10 rounded-[6px] bg-[#1F3A2E] text-[#FBF7EC] flex items-center justify-center cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {SPECIMEN_CHARS.map((c, idx) => (
                      <button
                        key={c.hanzi}
                        type="button"
                        onClick={() => {
                          setSelectedCharIdx(idx);
                          speakChinese(c.hanzi, 0.78);
                        }}
                        className={`flex-1 h-10 rounded-[6px] font-hanzi-serif text-lg font-bold border ${
                          idx === selectedCharIdx
                            ? 'bg-[#1F3A2E] text-[#FBF7EC] border-[#1F3A2E]'
                            : 'bg-[#F3ECDC] text-[#2A2118] border-[#DECFAA]'
                        }`}
                      >
                        {c.hanzi}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Bay 2: 4 Tones */}
            <div id="shelf-bay-1" className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono font-bold text-[#B08D3C]">010 — 063</span>
                <h2 className="font-editorial text-2xl font-bold text-[#2A2118]">
                  4 Thanh Điệu Chuẩn
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {FOUR_TONES_BOOKS.map((book) => (
                  <button
                    key={book.pinyin}
                    type="button"
                    onClick={() => speakChinese(book.hanzi, 0.72)}
                    className={`p-4 rounded-[8px] ${book.bg} text-[#FBF7EC] text-center space-y-1.5 border border-[#B08D3C]/40`}
                  >
                    <p className="font-hanzi-serif text-3xl font-bold">{book.hanzi}</p>
                    <p className="font-mono text-sm font-bold text-[#D4B26A]">{book.pinyin}</p>
                    <p className="text-xs text-[#FBF7EC]/80">{book.meaning}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Bay 5: Registration Desk */}
            <div
              id="ghi-danh-mobile"
              className="rounded-[10px] bg-[#FBF7EC] border border-[#DECFAA] p-6 text-center space-y-4 shadow-sm"
            >
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#1F3A2E] text-[#D4B26A] text-[10px] font-mono font-bold uppercase tracking-widest">
                QUẦY GHI DANH HANZI4U
              </span>
              <h3 className="font-editorial text-2xl font-bold text-[#2A2118]">
                Sẵn sàng mở lộ trình HSK miễn phí?
              </h3>
              <p className="text-xs text-[#6B5B4B] leading-relaxed">
                Đăng ký bằng Google hoặc Gmail trong 10 giây để bắt đầu học Pinyin, tập viết chữ
                Hán và ôn thẻ SRS.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href="#/login?tab=register"
                  className="h-11 rounded-[6px] bg-[#1F3A2E] text-[#FBF7EC] font-semibold text-sm inline-flex items-center justify-center gap-2"
                >
                  <span>Đăng Ký Miễn Phí</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#/login"
                  className="h-11 rounded-[6px] bg-white border border-[#DECFAA] text-[#2A2118] font-semibold text-sm inline-flex items-center justify-center"
                >
                  Đăng Nhập
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct anchor helper for Navbar 'Ghi danh' on desktop */}
      <div id="ghi-danh" className="h-px" />
    </div>
  );
};
