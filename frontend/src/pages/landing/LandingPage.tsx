import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  ArrowDown,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  XCircle,
  Move,
  Sparkles,
  BookOpen,
  Clock,
  GraduationCap,
  Award,
  Layers,
  PenTool,
  AudioLines,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { ThreeMinimalZenSculpture } from '../../components/three/ThreeMinimalZenSculpture';
import { ThreeStudyDioramaStage } from '../../components/three/ThreeStudyDioramaStage';
import { ThreeAmbientSealRings } from '../../components/three/ThreeAmbientSealRings';
import { HanziLogoMark } from '../../components/HanziLogo';
import { SmoothReveal, LUCIAN_EASE } from '../../components/ui';
import {
  scrollToElementById,
  consumePendingLandingTarget,
} from '../../lib/scrollNavigation';

/* ── DATA CONSTANTS ── */
const HERO_SEAL_CHARS = [
  { hanzi: '汉', pinyin: 'hàn', tone: 'Thanh 4', meaning: 'Chữ Hán', phrase: '汉语 · Tiếng Hán' },
  { hanzi: '你', pinyin: 'nǐ', tone: 'Thanh 3', meaning: 'Bạn', phrase: '你好 · Xin chào' },
  { hanzi: '学', pinyin: 'xué', tone: 'Thanh 2', meaning: 'Học tập', phrase: '学习 · Học hành' },
  { hanzi: '美', pinyin: 'měi', tone: 'Thanh 3', meaning: 'Đẹp đẽ', phrase: '美丽 · Mỹ lệ' },
  { hanzi: '道', pinyin: 'dào', tone: 'Thanh 4', meaning: 'Đạo lý', phrase: '知道 · Thấu hiểu' },
];

const FOUR_TONES = [
  {
    code: '55',
    label: 'Thanh 1',
    pinyin: 'mā',
    hanzi: '妈',
    meaning: 'Mẹ',
    hint: 'Cao & phẳng',
    color: '#00A86B',
    path: 'M 8 12 L 72 12',
  },
  {
    code: '35',
    label: 'Thanh 2',
    pinyin: 'má',
    hanzi: '麻',
    meaning: 'Cây gai',
    hint: 'Đi lên dứt khoát',
    color: '#C41E3A',
    path: 'M 8 34 Q 38 24 72 10',
  },
  {
    code: '214',
    label: 'Thanh 3',
    pinyin: 'mǎ',
    hanzi: '马',
    meaning: 'Con ngựa',
    hint: 'Trầm rồi vút lên',
    color: '#D4A017',
    path: 'M 8 26 Q 34 44 72 16',
  },
  {
    code: '51',
    label: 'Thanh 4',
    pinyin: 'mà',
    hanzi: '骂',
    meaning: 'Mắng',
    hint: 'Xuống mạnh & gọn',
    color: '#E11D48',
    path: 'M 8 10 Q 42 20 72 38',
  },
];

const STROKE_SPECIMENS = [
  { char: '永', pinyin: 'yǒng', sino: 'Vĩnh', meaning: 'Vĩnh cửu (đủ 8 nét căn bản)', strokes: 5 },
  { char: '学', pinyin: 'xué', sino: 'Học', meaning: 'Học tập, lĩnh hội', strokes: 8 },
  { char: '好', pinyin: 'hǎo', sino: 'Hảo', meaning: 'Tốt đẹp, thuận hòa', strokes: 6 },
  { char: '中', pinyin: 'zhōng', sino: 'Trung', meaning: 'Trung tâm, tiếng Trung', strokes: 4 },
];

const FLASHCARD_ITEMS = [
  {
    id: 'nihao',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    sino: 'Nhĩ hảo',
    meaning: 'Xin chào',
    exampleCn: '你好，很高兴认识你！',
    exampleVi: 'Xin chào, rất vui được làm quen với bạn!',
  },
  {
    id: 'xuexi',
    hanzi: '学习',
    pinyin: 'xuéxí',
    sino: 'Học tập',
    meaning: 'Học tập',
    exampleCn: '我每天学习十五分钟中文。',
    exampleVi: 'Mỗi ngày tôi học tiếng Trung 15 phút.',
  },
  {
    id: 'xiexie',
    hanzi: '谢谢',
    pinyin: 'xièxie',
    sino: 'Tạ tạ',
    meaning: 'Cảm ơn',
    exampleCn: '谢谢你的帮助！',
    exampleVi: 'Cảm ơn sự giúp đỡ của bạn!',
  },
];

const HSK_TIERS = [
  { level: 1, words: '150 từ', desc: 'Giao tiếp chào hỏi & câu căn bản' },
  { level: 2, words: '300 từ', desc: 'Hội thoại đời sống thường ngày' },
  { level: 3, words: '600 từ', desc: 'Du lịch, học tập & công việc cơ bản' },
  { level: 4, words: '1.200 từ', desc: 'Thảo luận lưu loát nhiều chủ đề' },
  { level: 5, words: '2.500 từ', desc: 'Đọc báo chí & xem phim không phụ đề' },
  { level: 6, words: '5.000+ từ', desc: 'Sử dụng học thuật & chuyên nghiệp' },
];

const SCENE_TABS = [
  { idx: 0 as const, num: '01', label: '4 Thanh điệu', title: 'Sóng Thanh Điệu 3D', icon: AudioLines },
  { idx: 1 as const, num: '02', label: 'Nét chữ 3D', title: 'Bia Điền Tự Cách 3D', icon: PenTool },
  { idx: 2 as const, num: '03', label: 'Thẻ nhớ 3D', title: 'Lật Thẻ SM-2 3D', icon: Layers },
  { idx: 3 as const, num: '04', label: 'Lộ trình HSK', title: 'Tháp Chinh Phục HSK 1–6', icon: Compass },
];

const BENTO_STATS = [
  { value: '63 âm', label: 'Bảng Pinyin chuẩn', accent: 'text-[#C41E3A]', icon: BookOpen },
  { value: '15 phút', label: 'Mỗi ngày giữ nhịp', accent: 'text-[#D4A017]', icon: Clock },
  { value: '9.500+', label: 'Nét viết mô phỏng', accent: 'text-[#00A86B]', icon: GraduationCap },
  { value: '48+ bộ', label: 'Đề thi & SBT HSK', accent: 'text-[#181415]', icon: Award },
];

export const LandingPage: React.FC = () => {
  // Hero 3D Imperial Seal State
  const [heroCharIdx, setHeroCharIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Interactive 3D Diorama Stage State (4 Morphing Scenes)
  const [activeScene, setActiveScene] = useState<0 | 1 | 2 | 3>(0);
  const [activeToneIdx, setActiveToneIdx] = useState(1); // Highlight Crimson Tone 2 initially
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [activeHskLevel, setActiveHskLevel] = useState(4);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);

  const chapterRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null]);
  const manualLockUntilRef = useRef<number>(0);

  const activeHeroChar = HERO_SEAL_CHARS[heroCharIdx];
  const activeStroke = STROKE_SPECIMENS[strokeIdx];
  const activeSceneMeta = SCENE_TABS[activeScene];

  const speakChinese = useCallback((text: string, rate = 0.78) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  // Scroll-choreographed chapter observer: scrolling vertically seamlessly morphs the sticky 3D canvas!
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < manualLockUntilRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.sceneIdx);
            if (idx >= 0 && idx <= 3) {
              setActiveScene(idx as 0 | 1 | 2 | 3);
            }
          }
        });
      },
      { rootMargin: '-28% 0px -42% 0px', threshold: 0.15 }
    );

    chapterRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  const jumpToScene = useCallback((idx: 0 | 1 | 2 | 3, shouldScroll = true) => {
    manualLockUntilRef.current = performance.now() + 750;
    setActiveScene(idx);
    if (shouldScroll) {
      scrollToElementById(`scene-card-${idx}`, 108, 560);
    }
  }, []);

  // Support deep navigation from Navbar / Login
  useEffect(() => {
    const onGotoScene = (e: Event) => {
      const detail = (e as CustomEvent<{ sceneIdx: number }>).detail;
      if (detail && detail.sceneIdx >= 0 && detail.sceneIdx <= 3) {
        jumpToScene(detail.sceneIdx as 0 | 1 | 2 | 3, true);
      }
    };
    window.addEventListener('hanzi:goto-scene', onGotoScene);

    const pending = consumePendingLandingTarget();
    if (pending) {
      requestAnimationFrame(() => {
        if (pending.type === 'section') scrollToElementById(pending.id, pending.offsetPx, 560);
        else jumpToScene(pending.sceneIdx as 0 | 1 | 2 | 3, true);
      });
    }

    return () => window.removeEventListener('hanzi:goto-scene', onGotoScene);
  }, [jumpToScene]);

  return (
    <div className="bg-[#FAF8F6] text-[#181415]">
      {/* ═══════════════════════════════════════════════════════════════════
          ACT 1: ASYMMETRIC ARCHITECTURAL 3D HERO — IMPERIAL LACQUER SEAL
          (100% Original Hanzi4U Crimson × Porcelain × Gold Identity)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[#EAE3DE]">
        {/* Soft Atmospheric Chinese Study Backdrop veiled in Warm Porcelain */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <img
            src="/images/hero-chinese-study.webp"
            alt=""
            decoding="async"
            className="w-full h-full object-cover object-center opacity-[0.11]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 18% 24%, rgba(196, 30, 58, 0.06) 0%, transparent 60%), linear-gradient(180deg, rgba(250,248,246,0.72) 0%, rgba(250,248,246,0.92) 70%, #FAF8F6 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Editorial Pitch (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: LUCIAN_EASE }}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#EAE3DE] shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#C41E3A]" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#181415]">
                  HỌC VIỆN HÁN NGỮ 3D · HSK 1 → 6
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.06, ease: LUCIAN_EASE }}
                className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[56px] text-[#181415] leading-[1.08] tracking-[-0.03em]"
              >
                Chinh phục tiếng Trung trong{' '}
                <span className="text-[#C41E3A]">không gian 3D</span> sắc nét
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14, ease: LUCIAN_EASE }}
                className="text-base sm:text-[17px] text-[#5F5658] leading-relaxed max-w-xl"
              >
                Trải nghiệm cách học chữ Hán trực quan thế hệ mới cho người Việt — xoay từng ấn triện
                3D, nghe chuẩn <strong className="font-semibold text-[#181415]">63 âm Pinyin</strong>,
                mô phỏng thứ tự nét viết và luyện 48+ bộ đề HSK chỉ với 15 phút mỗi ngày.
              </motion.p>

              {/* High-Conversion CTA Pair */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.22, ease: LUCIAN_EASE }}
                className="flex flex-wrap items-center gap-3.5 pt-1"
              >
                <a
                  href="#/login?tab=register"
                  className="h-12 px-7 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white font-semibold text-sm inline-flex items-center gap-2 transition-all duration-200 shadow-[0_12px_28px_-8px_rgba(196,30,58,0.55)] active:scale-[0.98]"
                >
                  <span>Đăng ký học miễn phí</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => scrollToElementById('khong-gian-3d', 76, 600)}
                  className="h-12 px-6 rounded-xl bg-white hover:bg-[#F5F0EB] text-[#181415] border border-[#EAE3DE] hover:border-[#C41E3A]/40 font-semibold text-sm inline-flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  <ArrowDown className="w-4 h-4 text-[#C41E3A]" />
                  <span>Khám phá Phòng Học 3D</span>
                </button>
              </motion.div>

              {/* Crisp Architectural Metrics Row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.34 }}
                className="pt-5 border-t border-[#EAE3DE] grid grid-cols-3 gap-4 max-w-lg"
              >
                <div>
                  <p className="font-display text-2xl font-extrabold text-[#181415]">63 âm</p>
                  <p className="text-xs text-[#5F5658]">Pinyin chuẩn bản xứ</p>
                </div>
                <div className="border-l border-[#EAE3DE] pl-4">
                  <p className="font-display text-2xl font-extrabold text-[#C41E3A]">HSK 1–6</p>
                  <p className="text-xs text-[#5F5658]">Lộ trình cá nhân hóa</p>
                </div>
                <div className="border-l border-[#EAE3DE] pl-4">
                  <p className="font-display text-2xl font-extrabold text-[#00A86B]">100%</p>
                  <p className="text-xs text-[#5F5658]">Miễn phí khởi đầu</p>
                </div>
              </motion.div>
            </div>

            {/* Right Interactive 3D Imperial Lacquer Seal Jewel-Box (6 cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.1, ease: LUCIAN_EASE }}
              className="lg:col-span-6"
            >
              <div className="relative rounded-[28px] bg-gradient-to-br from-[#1C1618] via-[#141112] to-[#241318] border border-[#2F2427] shadow-[0_30px_70px_-24px_rgba(20,17,18,0.5)] overflow-hidden">
                {/* Subtle Crimson-Gold Top Rim Light */}
                <div
                  aria-hidden="true"
                  className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C41E3A] to-[#D4A017]"
                />

                {/* Top Interactive HUD */}
                <div className="flex items-center justify-between px-5 pt-4 pb-1 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-mono font-semibold text-[#F2D16B]">
                    <Move className="w-3 h-3" />
                    Kéo xoay ấn triện 3D 360°
                  </span>

                  <button
                    type="button"
                    onClick={() => speakChinese(activeHeroChar.hanzi, 0.78)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      isSpeaking
                        ? 'bg-[#C41E3A] text-white'
                        : 'bg-white/10 hover:bg-[#C41E3A] text-white border border-white/15'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>
                      {activeHeroChar.pinyin} · {activeHeroChar.meaning}
                    </span>
                  </button>
                </div>

                {/* Live Interactive 3D WebGL Imperial Lacquer Seal Stage */}
                <div className="h-[340px] sm:h-[390px] w-full">
                  <ThreeMinimalZenSculpture
                    activeHanzi={activeHeroChar.hanzi}
                    activePinyin={activeHeroChar.pinyin}
                    tone="obsidian"
                    className="w-full h-full"
                  />
                </div>

                {/* Bottom Character Morph Selector Bar */}
                <div className="px-5 pb-5 pt-2 border-t border-white/10 bg-black/25 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {HERO_SEAL_CHARS.map((item, idx) => {
                      const active = idx === heroCharIdx;
                      return (
                        <button
                          key={item.hanzi}
                          type="button"
                          onClick={() => {
                            setHeroCharIdx(idx);
                            speakChinese(item.hanzi, 0.78);
                          }}
                          className={`w-10 h-10 rounded-xl font-hanzi-serif text-lg font-bold transition-all cursor-pointer border ${
                            active
                              ? 'bg-[#C41E3A] text-white border-[#E6BE4C]/70 shadow-[0_6px_16px_-4px_rgba(196,30,58,0.65)] scale-105'
                              : 'bg-white/10 hover:bg-white/15 text-white/80 border-white/10'
                          }`}
                        >
                          {item.hanzi}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-right leading-tight">
                    <p className="text-[11px] font-mono text-[#E6BE4C] font-semibold">
                      {activeHeroChar.tone}
                    </p>
                    <p className="text-xs text-white/75">{activeHeroChar.phrase}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ACT 2: FULL-EXPERIENCE SCROLL-CHOREOGRAPHED 3D LEARNING STAGE
          (Left Sticky Morphing 4-Scene 3D Viewport × Right Interactive Cards)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="khong-gian-3d" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          {/* Editorial Section Header */}
          <SmoothReveal>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
              <div className="space-y-3 max-w-2xl">
                <span className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
                  <Sparkles className="w-3.5 h-3.5" />
                  PHÒNG HỌC TƯƠNG TÁC 3D · 4 MÔ HÌNH TRỰC QUAN
                </span>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#181415] leading-[1.12]">
                  Mọi kỹ năng tiếng Trung đều sống động trong 3D
                </h2>
                <p className="text-sm sm:text-base text-[#5F5658] leading-relaxed">
                  Cuộn dọc hoặc chọn trực tiếp từng mô hình bên trái — sân khấu 3D tự động chuyển
                  hóa giữa 4 thanh điệu, bia viết chữ Hán, thẻ nhớ lật thực tế và tháp HSK 1–6.
                </p>
              </div>

              {/* Compact Quick Scene Jump Tabs */}
              <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-[#EAE3DE] shadow-xs self-start lg:self-auto">
                {SCENE_TABS.map((tab) => {
                  const active = activeScene === tab.idx;
                  return (
                    <button
                      key={tab.num}
                      type="button"
                      onClick={() => jumpToScene(tab.idx, true)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#C41E3A] text-white shadow-xs'
                          : 'text-[#5F5658] hover:text-[#181415] hover:bg-[#FAF8F6]'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-80">{tab.num}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SmoothReveal>

          {/* Sticky 3D Viewport (Left 7 cols) + Scrolling Interactive Chapters (Right 5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT STICKY FULL-HEIGHT 3D DIORAMA STAGE */}
            <div className="lg:col-span-7 lg:sticky lg:top-24">
              <div className="relative rounded-[28px] bg-[#141112] border border-[#2C2326] shadow-[0_32px_80px_-28px_rgba(20,17,18,0.55)] overflow-hidden">
                {/* Top Crimson-Gold Architectural HUD */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/25">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#C41E3A] text-white font-mono text-[11px] font-bold">
                      SCENE {activeSceneMeta.num} / 04
                    </span>
                    <span className="text-sm font-display font-bold text-white">
                      {activeSceneMeta.title}
                    </span>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-white/55">
                    <Move className="w-3.5 h-3.5 text-[#E6BE4C]" />
                    Kéo để xoay góc nhìn 3D
                  </span>
                </div>

                {/* Live Morphing 4-Scene 3D WebGL Canvas */}
                <div className="h-[360px] sm:h-[440px] lg:h-[490px] w-full relative">
                  <ThreeStudyDioramaStage
                    activeScene={activeScene}
                    activeToneIdx={activeToneIdx}
                    activeStrokeChar={activeStroke.char}
                    activeStrokePinyin={activeStroke.pinyin}
                    activeStrokeCount={activeStroke.strokes}
                    flippedCards={flippedCards}
                    activeCardIdx={activeCardIdx}
                    activeHskLevel={activeHskLevel}
                    className="w-full h-full"
                  />
                </div>

                {/* Bottom Integrated Scene Switcher Strip */}
                <div className="grid grid-cols-4 border-t border-white/10 bg-black/35">
                  {SCENE_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeScene === tab.idx;
                    return (
                      <button
                        key={tab.num}
                        type="button"
                        onClick={() => jumpToScene(tab.idx, false)}
                        className={`relative py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'text-white bg-white/10'
                            : 'text-white/55 hover:text-white/90 hover:bg-white/5'
                        }`}
                      >
                        {active && (
                          <span className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#C41E3A] to-[#E6BE4C]" />
                        )}
                        <Icon
                          className={`w-3.5 h-3.5 ${active ? 'text-[#E6BE4C]' : 'text-white/45'}`}
                        />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT INTERACTIVE STORY CHAPTERS (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* ── CHAPTER 01: 4 TONES 3D ACOUSTIC RIBBONS ── */}
              <div
                id="scene-card-0"
                ref={(el) => {
                  chapterRefs.current[0] = el;
                }}
                data-scene-idx={0}
                onClick={() => setActiveScene(0)}
                className={`rounded-2xl bg-white border p-6 transition-all duration-200 cursor-pointer ${
                  activeScene === 0
                    ? 'border-[#C41E3A] shadow-[0_18px_40px_-18px_rgba(196,30,58,0.22)] ring-1 ring-[#C41E3A]/15'
                    : 'border-[#EAE3DE] hover:border-[#D4A017]/60 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-[#C41E3A] uppercase">
                    01 · NGỮ ÂM & 63 ÂM PINYIN
                  </span>
                  <span className="text-[11px] font-mono text-[#5F5658]">Sóng 3D trực quan</span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-[#181415]">
                  Nghe & nhìn rõ 4 thanh điệu trong không gian 3D
                </h3>
                <p className="text-xs sm:text-sm text-[#5F5658] mt-1.5 leading-relaxed">
                  Bấm vào từng thanh điệu để làm nổi bật dải sóng cao độ trên sân khấu 3D và nghe
                  phát âm chuẩn phổ thông.
                </p>

                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  {FOUR_TONES.map((tone, idx) => {
                    const selected = activeToneIdx === idx;
                    return (
                      <button
                        key={tone.pinyin}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScene(0);
                          setActiveToneIdx(idx);
                          speakChinese(tone.hanzi, 0.72);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#181415] text-white border-[#181415] shadow-md'
                            : 'bg-[#FAF8F6] hover:bg-white text-[#181415] border-[#EAE3DE]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-hanzi-serif text-2xl font-bold">{tone.hanzi}</span>
                          <svg viewBox="0 0 80 46" className="w-12 h-7" aria-hidden="true">
                            <path
                              d={tone.path}
                              fill="none"
                              stroke={selected ? '#E6BE4C' : tone.color}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div className="flex items-baseline justify-between mt-1.5">
                          <span
                            className={`font-mono text-sm font-bold ${
                              selected ? 'text-[#E6BE4C]' : 'text-[#C41E3A]'
                            }`}
                          >
                            {tone.pinyin}
                          </span>
                          <span
                            className={`text-[11px] ${
                              selected ? 'text-white/75' : 'text-[#5F5658]'
                            }`}
                          >
                            {tone.meaning}
                          </span>
                        </div>
                        <p
                          className={`text-[10.5px] mt-1 ${
                            selected ? 'text-white/60' : 'text-[#8C7F82]'
                          }`}
                        >
                          {tone.label} ({tone.code}) · {tone.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── CHAPTER 02: 3D TIANZIGE CALLIGRAPHY TABLET & BRUSH ── */}
              <div
                id="scene-card-1"
                ref={(el) => {
                  chapterRefs.current[1] = el;
                }}
                data-scene-idx={1}
                onClick={() => setActiveScene(1)}
                className={`rounded-2xl bg-white border p-6 transition-all duration-200 cursor-pointer ${
                  activeScene === 1
                    ? 'border-[#C41E3A] shadow-[0_18px_40px_-18px_rgba(196,30,58,0.22)] ring-1 ring-[#C41E3A]/15'
                    : 'border-[#EAE3DE] hover:border-[#D4A017]/60 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-[#C41E3A] uppercase">
                    02 · THỨ TỰ NÉT CHỮ HÁN
                  </span>
                  <span className="text-[11px] font-mono text-[#5F5658]">9.500+ chữ Hán</span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-[#181415]">
                  Bia tập viết Điền Tự Cách & bút lông 3D
                </h3>
                <p className="text-xs sm:text-sm text-[#5F5658] mt-1.5 leading-relaxed">
                  Chọn một chữ Hán mẫu để khắc trực tiếp lên bia sứ Điền Tự Cách 3D, xem số nét
                  chuẩn và âm Hán-Việt giúp nhớ mặt chữ nhanh gấp 3 lần.
                </p>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  {STROKE_SPECIMENS.map((item, idx) => {
                    const selected = strokeIdx === idx;
                    return (
                      <button
                        key={item.char}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScene(1);
                          setStrokeIdx(idx);
                          speakChinese(item.char, 0.78);
                        }}
                        className={`py-3 rounded-xl border text-center transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-sm'
                            : 'bg-[#FAF8F6] hover:bg-white text-[#181415] border-[#EAE3DE]'
                        }`}
                      >
                        <p className="font-hanzi-serif text-2xl font-bold">{item.char}</p>
                        <p
                          className={`font-mono text-[11px] mt-0.5 ${
                            selected ? 'text-[#F2D16B]' : 'text-[#5F5658]'
                          }`}
                        >
                          {item.pinyin}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3.5 p-3.5 rounded-xl bg-[#FAF8F6] border border-[#EAE3DE] flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-bold text-[#181415]">
                      Hán-Việt: <span className="text-[#C41E3A]">{activeStroke.sino}</span> ·{' '}
                      {activeStroke.strokes} nét chuẩn
                    </p>
                    <p className="text-[#5F5658] mt-0.5">{activeStroke.meaning}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakChinese(activeStroke.char, 0.75);
                    }}
                    aria-label={`Nghe đọc chữ ${activeStroke.char}`}
                    className="w-9 h-9 rounded-lg bg-[#181415] hover:bg-[#C41E3A] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── CHAPTER 03: PHYSICAL 3D FLIPPING FLASHCARDS (SM-2) ── */}
              <div
                id="scene-card-2"
                ref={(el) => {
                  chapterRefs.current[2] = el;
                }}
                data-scene-idx={2}
                onClick={() => setActiveScene(2)}
                className={`rounded-2xl bg-white border p-6 transition-all duration-200 cursor-pointer ${
                  activeScene === 2
                    ? 'border-[#C41E3A] shadow-[0_18px_40px_-18px_rgba(196,30,58,0.22)] ring-1 ring-[#C41E3A]/15'
                    : 'border-[#EAE3DE] hover:border-[#D4A017]/60 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-[#C41E3A] uppercase">
                    03 · THẺ NHỚ 3D & THUẬT TOÁN SM-2
                  </span>
                  <span className="text-[11px] font-mono text-[#00A86B] font-semibold">
                    Lật thật 180°
                  </span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-[#181415]">
                  Lật thẻ từ vựng 3D & nhớ sâu theo chu kỳ khoa học
                </h3>
                <p className="text-xs sm:text-sm text-[#5F5658] mt-1.5 leading-relaxed">
                  Bấm nút lật trên từng thẻ bên dưới để xoay chính tấm thẻ tương ứng trên sân khấu 3D
                  và xem câu giao tiếp thực tế.
                </p>

                <div className="space-y-2.5 mt-4">
                  {FLASHCARD_ITEMS.map((card, idx) => {
                    const flipped = !!flippedCards[card.id];
                    const focused = activeCardIdx === idx;
                    return (
                      <div
                        key={card.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScene(2);
                          setActiveCardIdx(idx);
                          setFlippedCards((prev) => ({ ...prev, [card.id]: !prev[card.id] }));
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          focused
                            ? 'bg-[#FAF8F6] border-[#C41E3A]/60 shadow-xs'
                            : 'bg-white hover:bg-[#FAF8F6] border-[#EAE3DE]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-12 h-11 rounded-lg bg-[#181415] text-white font-hanzi-serif text-lg font-bold flex items-center justify-center shrink-0">
                            {card.hanzi}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#181415] flex items-center gap-2">
                              <span className="font-mono text-[#C41E3A]">{card.pinyin}</span>
                              <span>· {card.meaning}</span>
                            </p>
                            <p className="text-[11px] text-[#5F5658] truncate mt-0.5">
                              {flipped
                                ? `${card.exampleCn} (${card.exampleVi})`
                                : `Hán-Việt: ${card.sino} — Bấm để lật 3D`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakChinese(flipped ? card.exampleCn : card.hanzi, 0.8);
                            }}
                            aria-label={`Nghe ${card.hanzi}`}
                            className="w-8 h-8 rounded-lg bg-white border border-[#EAE3DE] hover:border-[#C41E3A] text-[#181415] flex items-center justify-center cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <span
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 ${
                              flipped
                                ? 'bg-[#00A86B] text-white'
                                : 'bg-[#C41E3A] text-white'
                            }`}
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>{flipped ? 'Mặt sau' : 'Lật 3D'}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── CHAPTER 04: 3D ASCENDING HSK 1 → 6 PAGODA & MINI QUIZ ── */}
              <div
                id="scene-card-3"
                ref={(el) => {
                  chapterRefs.current[3] = el;
                }}
                data-scene-idx={3}
                onClick={() => setActiveScene(3)}
                className={`rounded-2xl bg-white border p-6 transition-all duration-200 cursor-pointer ${
                  activeScene === 3
                    ? 'border-[#C41E3A] shadow-[0_18px_40px_-18px_rgba(196,30,58,0.22)] ring-1 ring-[#C41E3A]/15'
                    : 'border-[#EAE3DE] hover:border-[#D4A017]/60 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-[#C41E3A] uppercase">
                    04 · LỘ TRÌNH CHỨNG CHỈ HSK 1 — 6
                  </span>
                  <span className="text-[11px] font-mono text-[#D4A017] font-bold">
                    HSK {activeHskLevel}
                  </span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-[#181415]">
                  6 bậc tháp kiến thức & trắc nghiệm nhanh 10 giây
                </h3>

                {/* HSK 1-6 Tier Selector driving the 3D Pagoda Beacon */}
                <div className="grid grid-cols-6 gap-1.5 mt-4">
                  {HSK_TIERS.map((tier) => {
                    const selected = activeHskLevel === tier.level;
                    return (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScene(3);
                          setActiveHskLevel(tier.level);
                        }}
                        className={`py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer border ${
                          selected
                            ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-xs'
                            : 'bg-[#FAF8F6] hover:bg-white text-[#181415] border-[#EAE3DE]'
                        }`}
                      >
                        HSK {tier.level}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-[#5F5658] mt-2.5 bg-[#FAF8F6] px-3 py-2 rounded-lg border border-[#EAE3DE]">
                  <strong className="text-[#181415]">
                    HSK {activeHskLevel} ({HSK_TIERS[activeHskLevel - 1].words}):
                  </strong>{' '}
                  {HSK_TIERS[activeHskLevel - 1].desc}
                </p>

                {/* Interactive HSK 1 10-Second Mini Quiz */}
                <div className="mt-4 pt-4 border-t border-[#EAE3DE] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#181415]">
                      Thử nhanh: <span className="font-hanzi-serif text-base text-[#C41E3A]">「你好吗？」</span> nghĩa là gì?
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese('你好吗', 0.78);
                      }}
                      className="text-[11px] font-semibold text-[#C41E3A] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'A', label: 'Bạn tên là gì?' },
                      { id: 'B', label: 'Bạn có khỏe không?', ok: true },
                      { id: 'C', label: 'Bạn đi đâu vậy?' },
                      { id: 'D', label: 'Cảm ơn nhiều' },
                    ].map((opt) => {
                      const picked = quizChoice === opt.id;
                      const answered = quizChoice !== null;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveScene(3);
                            setQuizChoice(opt.id);
                          }}
                          className={`px-3 py-2 rounded-xl border text-left text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                            answered
                              ? opt.ok
                                ? 'bg-[#00A86B] border-[#00A86B] text-white'
                                : picked
                                  ? 'bg-[#C41E3A] border-[#C41E3A] text-white'
                                  : 'bg-[#FAF8F6] border-[#EAE3DE] text-[#8C7F82]'
                              : 'bg-[#FAF8F6] hover:bg-white border-[#EAE3DE] hover:border-[#C41E3A]/50 text-[#181415]'
                          }`}
                        >
                          <span>
                            <strong className="font-mono mr-1">{opt.id}.</strong>
                            {opt.label}
                          </span>
                          {answered && opt.ok && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          {answered && picked && !opt.ok && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ACT 3: ASYMMETRIC ARCHITECTURAL PHOTO BENTO GALLERY (#thu-vien-anh)
          (Original Hanzi4U Editorial Layout with Custom Chinese-Study .webp)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="thu-vien-anh" className="py-16 lg:py-20 bg-white border-y border-[#EAE3DE]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
          <SmoothReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
                  PHƯƠNG PHÁP HỌC TINH GỌN
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#181415]">
                  Thiết kế riêng cho tư duy học chữ Hán của người Việt
                </h2>
              </div>
              <p className="text-sm text-[#5F5658] max-w-md leading-relaxed">
                Không quảng cáo, không nhồi nhét ngữ pháp rời rạc — kết nối trực tiếp từ âm Hán-Việt,
                thứ tự nét bút đến bài thi HSK thực chiến.
              </p>
            </div>
          </SmoothReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Large Editorial Visual Card (7 cols) */}
            <SmoothReveal className="lg:col-span-7">
              <div className="group relative h-full min-h-[380px] lg:min-h-[470px] rounded-[24px] overflow-hidden border border-[#EAE3DE] shadow-sm">
                <img
                  src="/images/intro-hanzi-notebook.webp"
                  alt="Vở tập viết chữ Hán Điền Tự Cách bằng bút lông và dấu ấn đỏ trong nắng chiều"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#141112]/90 via-[#141112]/25 to-transparent"
                />
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white space-y-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C41E3A] text-white text-[10.5px] font-mono font-bold uppercase tracking-wider">
                    TƯ DUY HÁN-VIỆT & ĐIỀN TỰ CÁCH
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
                    Viết đúng từng nét bút, nhớ mặt chữ tự nhiên không học vẹt
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 max-w-lg leading-relaxed">
                    Mỗi từ vựng đều phân tách bộ thủ, thứ tự nét chuẩn xác và liên kết âm Hán-Việt
                    gần gũi để người Việt đọc hiểu nhanh ngay từ tuần đầu tiên.
                  </p>
                </div>
              </div>
            </SmoothReveal>

            {/* Right Asymmetric Stack (5 cols): 2x2 Bento Stats + Study Atmosphere Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <SmoothReveal delay={0.06}>
                <div className="grid grid-cols-2 gap-4">
                  {BENTO_STATS.map((st) => {
                    const Icon = st.icon;
                    return (
                      <div
                        key={st.value}
                        className="p-5 rounded-2xl bg-[#FAF8F6] border border-[#EAE3DE] hover:border-[#C41E3A]/35 transition-colors space-y-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#EAE3DE] flex items-center justify-center">
                          <Icon className={`w-4 h-4 ${st.accent}`} />
                        </div>
                        <p className={`font-display text-2xl font-extrabold ${st.accent}`}>
                          {st.value}
                        </p>
                        <p className="text-xs font-medium text-[#5F5658]">{st.label}</p>
                      </div>
                    );
                  })}
                </div>
              </SmoothReveal>

              <SmoothReveal delay={0.12} className="flex-1">
                <div className="group relative h-full min-h-[210px] rounded-[24px] overflow-hidden border border-[#EAE3DE]">
                  <img
                    src="/images/hero-chinese-study.webp"
                    alt="Không gian bàn học tiếng Trung tĩnh tại với giáo trình và tách trà"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#141112]/88 via-[#141112]/40 to-transparent"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1.5">
                    <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#E6BE4C] font-bold">
                      KHÔNG GIAN TẬP TRUNG TUYỆT ĐỐI
                    </span>
                    <p className="font-display text-lg font-bold leading-snug">
                      15 phút mỗi ngày — đồng bộ tiến độ tự động trên điện thoại & máy tính
                    </p>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ACT 4: FULL-WIDTH 3D LACQUER CONVERSION PAVILION (#bat-dau)
          (Ambient 3D Orbital Seal Rings behind Crisp High-Conversion CTA)
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="bat-dau" className="py-20 lg:py-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[32px] bg-[#141112] border border-[#2D2326] shadow-[0_32px_90px_-28px_rgba(20,17,18,0.6)] overflow-hidden">
            {/* Subtle Crimson-Gold Top Edge Accent */}
            <div
              aria-hidden="true"
              className="h-[3px] w-full bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#00A86B]"
            />

            {/* Live Ambient 3D Orbital Rings & Floating Gold Dust Canvas */}
            <ThreeAmbientSealRings className="absolute inset-0 w-full h-full opacity-85" />

            {/* Subtle dark vignette keeping copy razor-sharp */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 68% 72% at 50% 50%, rgba(20,17,18,0.68) 0%, rgba(20,17,18,0.92) 100%)',
              }}
            />

            <div className="relative z-10 px-6 sm:px-12 py-14 sm:py-18 text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex flex-col items-center gap-3">
                <HanziLogoMark variant="dark" className="w-14 h-14" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-[#E6BE4C]">
                  BẮT ĐẦU MIỄN PHÍ TRONG 10 GIÂY
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-white leading-[1.12] tracking-[-0.025em]">
                Mở khóa lộ trình HSK cá nhân hóa của riêng bạn ngay hôm nay
              </h2>

              <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-xl mx-auto">
                Đăng ký bằng Google hoặc Gmail OTP trong một chạm để học trọn bộ 63 âm Pinyin,
                luyện viết chữ Hán, ôn thẻ nhớ 3D SM-2 và thử sức phòng thi HSK.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
                <a
                  href="#/login?tab=register"
                  className="h-12 px-8 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white font-semibold text-sm inline-flex items-center gap-2 transition-all shadow-[0_14px_32px_-8px_rgba(196,30,58,0.65)] active:scale-[0.98]"
                >
                  <span>Tạo tài khoản học miễn phí</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#/login"
                  className="h-12 px-7 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm inline-flex items-center gap-2 transition-all backdrop-blur-sm active:scale-[0.98]"
                >
                  <span>Đăng nhập tài khoản</span>
                </a>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" />
                  Không yêu cầu thẻ thanh toán
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E6BE4C]" />
                  Hỗ trợ Google OAuth & Gmail OTP
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C41E3A]" />
                  Đầy đủ lộ trình HSK 1 → 6
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
