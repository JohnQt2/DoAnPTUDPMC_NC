import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCw,
  CheckCircle2,
  XCircle,
  Share2,
  Check,
  User,
  Move,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { ThreeMinimalZenSculpture } from '../../components/three/ThreeMinimalZenSculpture';
import { ThreeStudyDioramaStage } from '../../components/three/ThreeStudyDioramaStage';
import { ThreeAmbientSealRings } from '../../components/three/ThreeAmbientSealRings';
import { HanziLogoMark } from '../../components/HanziLogo';
import {
  ArchitecturalBlueprintGrid,
  DiamondCrosshairFrame,
  FiligreeCinemaFrame,
  LotusVoiceButton,
  EqualizerBars,
} from '../../components/landing/ArchitecturalOrnaments';

/* ── CHAPTER & SHOWCASE DATA ── */
const CHAPTERS = [
  { id: 0, code: '壹', label: 'Khởi Đầu' },
  { id: 1, code: '贰', label: 'Thanh Điệu 3D' },
  { id: 2, code: '叁', label: 'Thư Pháp 3D' },
  { id: 3, code: '肆', label: 'Chương Trình HSK' },
  { id: 4, code: '伍', label: 'Không Gian 3D' },
];

const SPECIMEN_TONES = [
  {
    hanzi: '妈',
    pinyin: 'mā',
    title: 'Thanh 1 · mā',
    cipher: '阴 平 · 声 调 五 五',
    pitchCode: 'Cao độ 55',
    sino: 'Hán-Việt: Mẫu (Mẹ)',
    lore: 'Giữ âm cao, phẳng và trong như một nét mực ngang kéo đều tay. Nền tảng để phân biệt rạch ròi mọi thanh điệu trong tiếng Phổ thông.',
    accent: '#00A86B',
    wash: 'linear-gradient(180deg, rgba(0, 145, 92, 0.52) 0%, rgba(12, 168, 112, 0.22) 34%, rgba(236, 232, 226, 0) 68%)',
    badgeBg: 'bg-[#00A86B]/15 text-[#00744A] border-[#00A86B]/40',
    toneIdx: 0,
  },
  {
    hanzi: '麻',
    pinyin: 'má',
    title: 'Thanh 2 · má',
    cipher: '阳 平 · 声 调 三 五',
    pitchCode: 'Cao độ 35',
    sino: 'Hán-Việt: Ma (Cây gai)',
    lore: 'Âm vút lên dứt khoát từ quãng giữa lên cao như dấu sắc tiếng Việt, tạo sắc thái hỏi nhẹ đầy biểu cảm trong giao tiếp hằng ngày.',
    accent: '#C41E3A',
    wash: 'linear-gradient(180deg, rgba(196, 30, 58, 0.56) 0%, rgba(196, 30, 58, 0.24) 34%, rgba(236, 232, 226, 0) 68%)',
    badgeBg: 'bg-[#C41E3A]/15 text-[#9E162E] border-[#C41E3A]/40',
    toneIdx: 1,
  },
  {
    hanzi: '马',
    pinyin: 'mǎ',
    title: 'Thanh 3 · mǎ',
    cipher: '上 声 · 声 调 二 一 四',
    pitchCode: 'Cao độ 214',
    sino: 'Hán-Việt: Mã (Con ngựa)',
    lore: 'Hạ trầm xuống đáy giọng rồi uốn cong vút nhẹ lên — thanh điệu giàu nhạc tính nhất, là chìa khóa giúp phát âm tự nhiên như người bản xứ.',
    accent: '#C48B0A',
    wash: 'linear-gradient(180deg, rgba(202, 144, 18, 0.55) 0%, rgba(212, 160, 23, 0.24) 34%, rgba(236, 232, 226, 0) 68%)',
    badgeBg: 'bg-[#D4A017]/15 text-[#8F6504] border-[#D4A017]/45',
    toneIdx: 2,
  },
  {
    hanzi: '骂',
    pinyin: 'mà',
    title: 'Thanh 4 · mà',
    cipher: '去 声 · 声 调 五 一',
    pitchCode: 'Cao độ 51',
    sino: 'Hán-Việt: Mạ (Mắng)',
    lore: 'Rơi nhanh, mạnh và gọn từ đỉnh cao xuống thấp trong một nhịp thở dứt khoát — mang lại độ sắc nét và uy lực cho câu nói tiếng Trung.',
    accent: '#9F1239',
    wash: 'linear-gradient(180deg, rgba(136, 19, 55, 0.62) 0%, rgba(159, 18, 57, 0.25) 34%, rgba(236, 232, 226, 0) 68%)',
    badgeBg: 'bg-[#9F1239]/15 text-[#881337] border-[#9F1239]/40',
    toneIdx: 3,
  },
  {
    hanzi: '汉',
    pinyin: 'hàn',
    title: 'Hán Tự · hàn',
    cipher: '汉 语 · 六 十 三 拼 音',
    pitchCode: '63 Âm Pinyin',
    sino: 'Hán-Việt: Hán (Chữ Hán)',
    lore: 'Chinh phục đầy đủ 23 thanh mẫu, 24 vận mẫu và 16 âm tiết đọc thẳng — kết nối trực tiếp giữa mặt chữ tượng hình, thanh điệu và âm Hán-Việt.',
    accent: '#181415',
    wash: 'linear-gradient(180deg, rgba(38, 22, 27, 0.68) 0%, rgba(158, 22, 46, 0.22) 34%, rgba(236, 232, 226, 0) 68%)',
    badgeBg: 'bg-[#181415]/10 text-[#181415] border-[#181415]/30',
    toneIdx: 3,
  },
];

const CALLIGRAPHY_SPECIMENS = [
  {
    char: '永',
    pinyin: 'yǒng',
    sino: 'Vĩnh',
    strokes: 5,
    title: 'Vĩnh Tự Bát Pháp',
    desc: 'Chữ 永 hội tụ trọn vẹn 8 quy tắc bút pháp căn bản của thư pháp Trung Hoa: chấm, ngang, sổ, móc, hất, phẩy dài, phẩy ngắn và mác.',
  },
  {
    char: '学',
    pinyin: 'xué',
    sino: 'Học',
    strokes: 8,
    title: 'Học Tập Khai Trí',
    desc: 'Viết theo trình tự từ trên xuống dưới, bộ Tử (子) nâng đỡ phía dưới mái nhà — giúp người Việt ghi nhớ hình tự ngay từ lần đầu tập viết.',
  },
  {
    char: '好',
    pinyin: 'hǎo',
    sino: 'Hảo',
    strokes: 6,
    title: 'Hội Ý Tốt Đẹp',
    desc: 'Kết hợp bộ Nữ (女) bên trái và bộ Tử (子) bên phải — ví dụ kinh điển cho phương pháp học chiết tự bộ thủ thay vì học vẹt máy móc.',
  },
  {
    char: '中',
    pinyin: 'zhōng',
    sino: 'Trung',
    strokes: 4,
    title: 'Trung Chính Cân Bằng',
    desc: 'Nét sổ thẳng cuối cùng chia đôi khung Điền Tự Cách một cách chuẩn xác — rèn cảm giác tỷ lệ cân đối cho hơn 9.500 chữ Hán tiếp theo.',
  },
];

const CURRICULUM_SLIDES = [
  {
    id: 'hall',
    tag: '01 · LỘ TRÌNH TOÀN DIỆN',
    title: 'Học Viện Hán Ngữ HSK 1 — 6',
    image: '/images/wuwa-academy-hall.webp',
    thumbLabel: 'Học viện HSK',
    summary:
      'Khởi đầu từ con số 0 với khảo sát xếp trình độ cá nhân hóa. Hệ thống tự sắp xếp từng Unit ngữ âm, từ vựng, ngữ pháp và hội thoại thực tế.',
    highlights: ['63 âm Pinyin chuẩn', '5.000+ từ vựng HSK 1–6', 'Đồng bộ đa thiết bị'],
  },
  {
    id: 'notebook',
    tag: '02 · THƯ PHÁP & HÁN-VIỆT',
    title: 'Tập Viết Ô Điền Tự Cách',
    image: '/images/intro-hanzi-notebook.webp',
    thumbLabel: 'Điền Tự Cách',
    summary:
      'Mô phỏng sống động thứ tự từng nét bút cho hơn 9.500 chữ Hán, hỗ trợ vẽ tay trực tiếp trên cảm ứng và máy tính kèm giải nghĩa âm Hán-Việt.',
    highlights: ['9.500+ chữ có thứ tự nét', 'Phân tích bộ thủ', 'Âm Hán-Việt chuẩn'],
  },
  {
    id: 'study',
    tag: '03 · NHỊP HỌC 15 PHÚT',
    title: 'Ôn Luyện Lặp Lại Thông Minh SM-2',
    image: '/images/hero-chinese-study.webp',
    thumbLabel: 'Nhịp 15 phút',
    summary:
      'Thuật toán SM-2 tự nhắc lại từ vựng ngay trước thời điểm bạn sắp quên — giữ thói quen nhẹ nhàng 15 phút mỗi ngày mà nhớ sâu bền vững.',
    highlights: ['Lịch ôn tự động SM-2', 'Nghe giọng đọc bản xứ', 'Không quảng cáo'],
  },
  {
    id: 'exam',
    tag: '04 · PHÒNG THI THỰC CHIẾN',
    title: '48+ Bộ Đề Thi & Sách Bài Tập HSK',
    image: '/images/login-study-desk.webp',
    thumbLabel: '48+ Bộ đề',
    summary:
      '30 đề thi thử mô phỏng chuẩn thời gian thực và 18 bộ sách bài tập chấm điểm tức thì, giải thích cặn kẽ từng đáp án giúp tăng tốc đạt chứng chỉ.',
    highlights: ['30 Đề thi mô phỏng', '18 Sách bài tập SBT', 'Chấm điểm tức thì'],
  },
  {
    id: 'quiz',
    tag: '05 · THỬ THÁCH 10 GIÂY',
    title: 'Kiểm Tra Nhanh Phản Xạ HSK 1',
    image: '/images/wuwa-academy-hall.webp',
    thumbLabel: 'Thử nhanh HSK',
    summary: 'Thử ngay câu hỏi giao tiếp HSK 1 kinh điển ngay trên khung chiếu này.',
    highlights: [],
  },
];

const FLASHCARD_DECK = [
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
    exampleCn: '我每天学习中文。',
    exampleVi: 'Mỗi ngày tôi đều học tiếng Trung.',
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

const HSK_LEVELS = [
  { level: 1, words: '150 từ', note: 'Chào hỏi & giao tiếp căn bản' },
  { level: 2, words: '300 từ', note: 'Hội thoại đời sống hằng ngày' },
  { level: 3, words: '600 từ', note: 'Du lịch, học tập & công việc' },
  { level: 4, words: '1.200 từ', note: 'Thảo luận lưu loát nhiều chủ đề' },
  { level: 5, words: '2.500 từ', note: 'Đọc báo & xem phim bản xứ' },
  { level: 6, words: '5.000+ từ', note: 'Học thuật & chuyên nghiệp' },
];

export const LandingPage: React.FC = () => {
  // Full-viewport 5-chapter fade engine + Slide-up Footer (WuWa 3.8 architecture)
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Subtle Hero mouse parallax
  const [heroParallax, setHeroParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Slide 2 (Reactive 3D Tone & Hanzi Showcase)
  const [specimenIdx, setSpecimenIdx] = useState<number>(1); // Imperial Crimson '麻 má' default!
  const [slide2Mode, setSlide2Mode] = useState<'seal' | 'ribbons'>('seal');

  // Slide 3 (Calligraphy & 3D TianZiGe Tablet)
  const [calligraphyIdx, setCalligraphyIdx] = useState<number>(0);

  // Slide 4 (Filigree Curriculum Carousel + Filmstrip)
  const [curriculumIdx, setCurriculumIdx] = useState<number>(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);

  // Slide 5 (3D Sanctuary: Flashcard Flip vs HSK 1-6 Tower)
  const [sanctuaryMode, setSanctuaryMode] = useState<'cards' | 'pagoda'>('cards');
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [activeHskLevel, setActiveHskLevel] = useState<number>(4);

  const wheelLockRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);

  const activeSpecimen = SPECIMEN_TONES[specimenIdx];
  const activeCalligraphy = CALLIGRAPHY_SPECIMENS[calligraphyIdx];
  const activeCurriculum = CURRICULUM_SLIDES[curriculumIdx];

  const speakChinese = useCallback(
    (text: string, rate = 0.78) => {
      if (!audioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = rate;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [audioEnabled]
  );

  const goToSlide = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    setShowFooter(false);
    setActiveSlide(clamped);
  }, []);

  const stepChapter = useCallback((dir: 1 | -1) => {
    const now = performance.now();
    if (now < wheelLockRef.current) return;
    wheelLockRef.current = now + 520;

    if (dir === 1) {
      setActiveSlide((prev) => {
        if (prev < CHAPTERS.length - 1) {
          setShowFooter(false);
          return prev + 1;
        }
        setShowFooter(true);
        return prev;
      });
    } else {
      setShowFooter((footerOpen) => {
        if (footerOpen) return false;
        setActiveSlide((prev) => Math.max(0, prev - 1));
        return false;
      });
    }
  }, []);

  // Preload inner chapter key visuals on mount so cross-fading slides is 0ms instant
  useEffect(() => {
    [
      '/images/wuwa-calligraphy-ink.webp',
      '/images/wuwa-academy-hall.webp',
      '/images/intro-hanzi-notebook.webp',
      '/images/hero-chinese-study.webp',
      '/images/login-study-desk.webp',
    ].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Desktop Full-Viewport Wheel & Keyboard Chapter Switching
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      if (Math.abs(e.deltaY) < 18) return;
      e.preventDefault();
      stepChapter(e.deltaY > 0 ? 1 : -1);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth < 1024) return;
      if (['ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        stepChapter(1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        stepChapter(-1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [stepChapter]);

  // Subtle pointer parallax on Slide 0 Hero key visual
  const handleHeroPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * -16;
    const ny = (e.clientY / window.innerHeight - 0.5) * -10;
    setHeroParallax({ x: nx, y: ny });
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const isHero = activeSlide === 0;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#141112] text-[#181415] select-none"
      onTouchStart={(e) => {
        touchStartYRef.current = e.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartYRef.current === null) return;
        const dy = touchStartYRef.current - (e.changedTouches[0]?.clientY ?? touchStartYRef.current);
        touchStartYRef.current = null;
        if (Math.abs(dy) > 48) stepChapter(dy > 0 ? 1 : -1);
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          PERSISTENT FLOATING AAA CHROME (ZERO GENERIC SAAS NAVBAR!)
      ═══════════════════════════════════════════════════════════════════ */}

      {/* TOP-LEFT: Hero Floating Wordmark → Inner Slides Vertical Chinese Seal Tag */}
      <div className="fixed top-6 left-6 sm:left-8 z-40 flex items-start gap-3">
        {isHero ? (
          <button
            type="button"
            onClick={() => goToSlide(0)}
            className="group flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none"
          >
            <HanziLogoMark variant="dark" className="w-9 h-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-[15px] tracking-[0.18em] text-white uppercase drop-shadow">
                HANZI<span className="text-[#E6BE4C]">4U</span>
              </span>
              <span className="font-mono text-[9px] tracking-[0.26em] text-white/70 uppercase mt-1">
                汉语学院 · 3D
              </span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goToSlide(0)}
            title="Về màn hình khởi đầu"
            className="group flex flex-col items-center gap-1.5 cursor-pointer focus-visible:outline-none"
          >
            <span className="w-7 h-7 border border-white/60 bg-[#C41E3A] text-white font-hanzi-serif text-sm font-bold flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              汉
            </span>
            <span
              className="text-[10px] font-hanzi-serif tracking-[0.28em] text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
              style={{ writingMode: 'vertical-rl' }}
            >
              第{CHAPTERS[activeSlide].code}章 · 汉语
            </span>
          </button>
        )}
      </div>

      {/* TOP-RIGHT: Compact Floating Frosted Glass HUD ([Share] [Audio Eq] [Login] [ĐĂNG KÝ]) */}
      <div className="fixed top-5 right-5 sm:right-8 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          aria-label="Sao chép liên kết trang"
          title="Sao chép liên kết"
          className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#181415] border border-white/90 shadow-md backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
        >
          {copiedLink ? <Check className="w-4 h-4 text-[#00A86B]" /> : <Share2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setAudioEnabled((prev) => {
              if (prev && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              return !prev;
            });
          }}
          aria-label={audioEnabled ? 'Tắt phát âm mẫu' : 'Bật phát âm mẫu'}
          title={audioEnabled ? 'Âm thanh phát âm: Bật' : 'Âm thanh phát âm: Tắt'}
          className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#181415] border border-white/90 shadow-md backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
        >
          <EqualizerBars active={audioEnabled} />
        </button>

        <a
          href="#/login"
          aria-label="Đăng nhập"
          title="Đăng nhập tài khoản"
          className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#181415] border border-white/90 shadow-md backdrop-blur-md flex items-center justify-center transition-transform hover:scale-105"
        >
          <User className="w-4 h-4" />
        </a>

        <a
          href="#/login?tab=register"
          className="h-9 px-5 rounded-full bg-white/90 hover:bg-[#C41E3A] text-[#181415] hover:text-white border border-white shadow-md backdrop-blur-md font-display text-xs font-extrabold tracking-[0.14em] uppercase inline-flex items-center justify-center transition-colors"
        >
          ĐĂNG KÝ
        </a>
      </div>

      {/* LEFT MARGIN VERTICAL TICK RAIL (Hidden on Hero Slide 0, fades in on Slides 1–4) */}
      <AnimatePresence>
        {!isHero && (
          <motion.nav
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3 }}
            aria-label="Điều hướng chương"
            className="fixed left-5 sm:left-7 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-3"
          >
            {CHAPTERS.map((chap) => {
              const active = activeSlide === chap.id;
              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => goToSlide(chap.id)}
                  aria-label={chap.label}
                  className="group relative py-1 px-2 flex items-center cursor-pointer focus-visible:outline-none"
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      active
                        ? 'w-[4px] h-8 bg-[#C41E3A] shadow-[0_0_12px_rgba(196,30,58,0.6)]'
                        : 'w-[3px] h-3.5 bg-[#181415]/35 group-hover:bg-[#181415]/75 group-hover:h-5'
                    }`}
                  />
                  {/* Hover Chapter Label */}
                  <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-6 px-2.5 py-1 bg-[#181415]/90 text-white text-[10.5px] font-mono tracking-wider uppercase whitespace-nowrap shadow-lg">
                    0{chap.id + 1} · {chap.label}
                  </span>
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN 5-CHAPTER FULL-VIEWPORT FADE STAGE (Translates up when Footer opens)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        animate={{ y: showFooter ? -144 : 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full h-full will-change-transform"
      >
        <AnimatePresence initial={false}>
          {/* ────────────────────────────────────────────────────────────────
              SLIDE 0: FULL-BLEED CINEMATIC GUOCHAO KEY VISUAL HERO
          ──────────────────────────────────────────────────────────────── */}
          {activeSlide === 0 && (
            <motion.section
              key="slide-hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              onPointerMove={handleHeroPointerMove}
              className="absolute inset-0 w-full h-full overflow-hidden bg-[#131118]"
            >
              {/* Full-Bleed Custom Guochao Key Visual with Subtle Pointer Parallax */}
              <div
                aria-hidden="true"
                style={{
                  transform: `translate3d(${heroParallax.x.toFixed(1)}px, ${heroParallax.y.toFixed(1)}px, 0) scale(1.04)`,
                }}
                className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
              >
                <img
                  src="/images/wuwa-hero-guochao.webp"
                  alt=""
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Transparent Live 3D Orbital Gold/Crimson Particles drifting over the courtyard */}
              <ThreeAmbientSealRings className="absolute inset-0 w-full h-full opacity-55" />

              {/* Dual Cinematic Gradient Masks preserving luminous scroll center & crisp bottom contrast */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#131118]/65 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[54%] bg-gradient-to-t from-[#120E14] via-[#140F16]/75 to-transparent"
              />

              {/* Bottom-Center Monumental Engraved Title Lockup & Action Strip */}
              <div className="relative z-20 h-full flex flex-col items-center justify-end pb-10 sm:pb-12 px-5 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-3xl w-full space-y-4"
                >
                  {/* Engraved Title + Flanking Crimson-Gold 3D Preview Play Emblem */}
                  <div className="relative inline-flex items-center justify-center gap-4 sm:gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.28em] text-[#F2D16B]">
                        <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[#E6BE4C]" />
                        <span>汉语之境 · HỌC VIỆN 3D</span>
                        <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[#E6BE4C]" />
                      </div>

                      <h1 className="font-display font-extrabold text-5xl sm:text-7xl lg:text-[78px] tracking-[0.08em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#FFF6EC] to-[#E9C8B8] drop-shadow-[0_6px_32px_rgba(196,30,58,0.45)]">
                        HANZI4U
                      </h1>

                      <p className="font-hanzi-serif text-base sm:text-xl tracking-[0.16em] text-white/90 pt-1">
                        Mỗi Nét Mực · Mở Một Thế Giới Tiếng Trung
                      </p>
                    </div>

                    {/* Signature Circular Luminous Play / Enter 3D Emblem (echoing WuWa Hero PV button) */}
                    <button
                      type="button"
                      onClick={() => goToSlide(1)}
                      aria-label="Khám phá không gian học 3D"
                      title="Khám phá Phòng Học 3D"
                      className="hidden sm:flex group relative w-14 h-14 rounded-full border border-[#E6BE4C]/80 bg-[#C41E3A]/80 hover:bg-[#C41E3A] text-white items-center justify-center shadow-[0_0_28px_rgba(196,30,58,0.75)] transition-transform duration-300 hover:scale-110 cursor-pointer"
                    >
                      <span className="absolute -inset-2 rounded-full border border-[#E6BE4C]/35 animate-ping opacity-40" />
                      <svg viewBox="0 0 24 24" className="w-5 h-5 translate-x-0.5 fill-current">
                        <path d="M6 4l15 8-15 8V4z" />
                      </svg>
                    </button>
                  </div>

                  {/* Release / Curriculum Subtitle Line */}
                  <p className="text-xs sm:text-sm font-mono tracking-[0.16em] text-white/80">
                    Lộ trình chuẩn <span className="text-[#F2D16B] font-bold">HSK 1 — 6</span> · 63 Âm Pinyin · 9.500+ Nét Chữ · 48+ Bộ Đề
                  </p>

                  {/* Crisp AAA Dark-Lacquer & Imperial Crimson Action Bar (zero generic SaaS pills) */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href="#/login?tab=register"
                      className="h-12 px-8 bg-[#C41E3A] hover:bg-[#A51730] text-white border border-[#E6BE4C]/65 font-display text-xs sm:text-[13px] font-extrabold tracking-[0.14em] uppercase inline-flex items-center gap-2.5 shadow-[0_12px_34px_-6px_rgba(196,30,58,0.75)] transition-all active:scale-[0.98]"
                    >
                      <span>ĐĂNG KÝ MIỄN PHÍ</span>
                      <ArrowRight className="w-4 h-4 text-[#F2D16B]" />
                    </a>

                    <button
                      type="button"
                      onClick={() => goToSlide(1)}
                      className="h-12 px-7 bg-[#141112]/80 hover:bg-[#1E191B] text-white border border-white/30 hover:border-[#E6BE4C]/70 backdrop-blur-md font-display text-xs sm:text-[13px] font-bold tracking-[0.12em] uppercase inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#E6BE4C]" />
                      <span>KHÁM PHÁ 3D</span>
                    </button>

                    <a
                      href="#/login"
                      className="h-12 px-6 bg-[#141112]/70 hover:bg-[#1E191B] text-white/90 hover:text-white border border-white/20 hover:border-white/45 backdrop-blur-md font-display text-xs sm:text-[13px] font-bold tracking-[0.12em] uppercase inline-flex items-center justify-center transition-all"
                    >
                      ĐĂNG NHẬP
                    </a>
                  </div>

                  {/* Subtle Scroll-Down Cue */}
                  <button
                    type="button"
                    onClick={() => goToSlide(1)}
                    className="pt-2 inline-flex flex-col items-center gap-1 text-[10px] font-mono uppercase tracking-[0.24em] text-white/55 hover:text-[#F2D16B] transition-colors cursor-pointer"
                  >
                    <span>Cuộn xuống để mở chương tiếp theo</span>
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                  </button>
                </motion.div>
              </div>

              {/* Bottom-Right Edge-Peeking Quick-Entry Card (Signature WuWa micro-detail!) */}
              <a
                href="#/login?tab=register"
                className="hidden xl:flex group fixed right-0 bottom-10 z-30 items-center gap-3 pl-3 pr-5 py-2.5 bg-[#141112]/90 border-y border-l border-[#E6BE4C]/55 backdrop-blur-md shadow-2xl translate-x-2 hover:translate-x-0 transition-transform duration-300"
              >
                <img
                  src="/images/wuwa-academy-hall.webp"
                  alt=""
                  className="w-14 h-10 object-cover border border-[#E6BE4C]/40"
                />
                <div className="leading-tight">
                  <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E6BE4C] font-bold">
                    MIỄN PHÍ 100%
                  </p>
                  <p className="text-xs font-display font-bold text-white flex items-center gap-1 mt-0.5">
                    <span>Xếp lộ trình HSK</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C41E3A] group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </div>
              </a>
            </motion.section>
          )}

          {/* ────────────────────────────────────────────────────────────────
              SLIDE 1: REACTIVE 3D TONE & HANZI SHOWCASE (WuWa 'RESONATORS' DNA)
              Open Stone-Parchment Canvas + Reactive Atmospheric Wash + Open 3D!
          ──────────────────────────────────────────────────────────────── */}
          {activeSlide === 1 && (
            <motion.section
              key="slide-tones"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full overflow-hidden bg-[#ECE8E2]"
            >
              {/* Reactive Top-Down Atmospheric Color Wash (morphs smoothly per selected Hanzi/Tone!) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-all duration-500 ease-out"
                style={{ backgroundImage: activeSpecimen.wash }}
              />

              {/* Subtle Architectural Drafting-Compass Blueprint Hairlines */}
              <ArchitecturalBlueprintGrid />

              {/* Main Split Stage (Zero Rounded SaaS Cards — Pure Editorial & Open 3D Canvas!) */}
              <div className="relative z-10 h-full max-w-[1380px] mx-auto px-6 sm:px-14 lg:pl-24 lg:pr-14 pt-14 pb-16 grid grid-cols-1 lg:grid-cols-12 items-center gap-4">
                {/* LEFT COLUMN: Editorial Header, Watermark Cipher, Lotus Voice Play, Lore & 5 Seal Avatars */}
                <div className="lg:col-span-5 flex flex-col justify-between h-full max-h-[640px] py-2">
                  {/* Top Engraved Section Title */}
                  <div>
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[42px] uppercase tracking-[0.1em] text-white drop-shadow-[0_3px_14px_rgba(24,20,21,0.35)]">
                      THANH ĐIỆU
                    </h2>
                  </div>

                  {/* Center Specimen Lockup (Instant smooth swap with zero blank gap) */}
                  <motion.div
                    key={activeSpecimen.hanzi}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-4 my-auto py-4"
                  >
                      {/* Faint Diegetic Chinese Cipher Watermark */}
                      <p className="font-hanzi-serif text-lg sm:text-xl tracking-[0.34em] text-[#181415]/20 select-none">
                        {activeSpecimen.cipher}
                      </p>

                      {/* Bespoke 4-Petal Lotus Audio Emblem + Specimen Title */}
                      <div className="flex items-center gap-3.5">
                        <LotusVoiceButton
                          onClick={() => speakChinese(activeSpecimen.hanzi, 0.72)}
                          active={isSpeaking}
                          accentColor={activeSpecimen.accent}
                          label={`Nghe phát âm ${activeSpecimen.pinyin}`}
                        />
                        <div>
                          <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-[#181415] tracking-tight leading-none">
                            {activeSpecimen.title}
                          </h3>
                          {/* 5 Luminous Gold Diamond Rarity/Mastery Pips */}
                          <div className="flex items-center gap-2 mt-2.5" aria-hidden="true">
                            {[0, 1, 2, 3, 4].map((d) => (
                              <span
                                key={d}
                                className="w-2.5 h-2.5 rotate-45 bg-gradient-to-br from-[#F7E08A] to-[#D4A017] shadow-[0_0_8px_rgba(212,160,23,0.65)]"
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Dual Sleek Reactive Metadata Pills */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <span
                          className={`px-3.5 py-1 rounded-full border text-xs font-mono font-bold ${activeSpecimen.badgeBg}`}
                        >
                          {activeSpecimen.pitchCode}
                        </span>
                        <span className="px-3.5 py-1 rounded-full border border-[#181415]/20 bg-white/65 text-xs font-semibold text-[#181415]">
                          {activeSpecimen.sino}
                        </span>
                      </div>

                      {/* Concise High-Contrast Editorial Lore Copy */}
                      <p className="text-[13.5px] sm:text-sm text-[#262123] leading-relaxed max-w-md font-medium">
                        {activeSpecimen.lore}
                      </p>
                  </motion.div>

                  {/* Bottom 5 Circular Ink-Seal Specimen Selectors (WuWa Resonator Avatar Row!) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#5F5658]">
                      Chọn mẫu thanh điệu & chữ Hán
                    </p>
                    <div className="flex items-center gap-3">
                      {SPECIMEN_TONES.map((spec, idx) => {
                        const selected = idx === specimenIdx;
                        return (
                          <button
                            key={spec.hanzi}
                            type="button"
                            onClick={() => {
                              setSpecimenIdx(idx);
                              speakChinese(spec.hanzi, 0.72);
                            }}
                            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-transform duration-150 cursor-pointer border-2 ${
                              selected
                                ? 'scale-110 bg-[#181415] text-white shadow-lg'
                                : 'bg-white/85 hover:bg-white text-[#181415] border-[#181415]/20 hover:border-[#C41E3A]/60'
                            }`}
                            style={selected ? { borderColor: spec.accent } : undefined}
                          >
                            <span className="font-hanzi-serif text-xl sm:text-2xl font-bold leading-none">
                              {spec.hanzi}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold mt-0.5 ${
                                selected ? 'text-[#F2D16B]' : 'text-[#5F5658]'
                              }`}
                            >
                              {spec.pinyin}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: OPEN-CANVAS TRANSPARENT 3D STAGE (ZERO BOX!) + 2-MODE VERTICAL SWITCHER */}
                <div className="lg:col-span-7 relative h-[360px] sm:h-[460px] lg:h-[620px] flex items-center justify-center">
                  {/* Subtle radial ink-aura behind the floating 3D object */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-12 rounded-full blur-3xl opacity-25 transition-colors duration-500"
                    style={{ backgroundColor: activeSpecimen.accent }}
                  />

                  {/* Live Open-Canvas Transparent 3D Artifact */}
                  <div className="relative z-10 w-full h-full">
                    {slide2Mode === 'seal' ? (
                      <ThreeMinimalZenSculpture
                        activeHanzi={activeSpecimen.hanzi}
                        activePinyin={activeSpecimen.pinyin}
                        tone="porcelain"
                        className="w-full h-full"
                      />
                    ) : (
                      <ThreeStudyDioramaStage
                        activeScene={0}
                        activeToneIdx={activeSpecimen.toneIdx}
                        activeStrokeChar={activeSpecimen.hanzi}
                        activeStrokePinyin={activeSpecimen.pinyin}
                        activeStrokeCount={6}
                        flippedCards={{}}
                        activeCardIdx={0}
                        activeHskLevel={1}
                        theme="light"
                        className="w-full h-full"
                      />
                    )}
                  </div>

                  {/* Subtle Drag Hint floating bottom-center under open 3D object */}
                  <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#5F5658]">
                    <Move className="w-3.5 h-3.5 text-[#C41E3A]" />
                    Kéo trực tiếp để xoay 3D 360°
                  </span>

                  {/* Far-Right Vertical 2-Mode Switcher (echoing WuWa .display-mode-switch!) */}
                  <div className="hidden sm:flex flex-col gap-2 absolute right-0 top-1/2 -translate-y-1/2 z-20">
                    {[
                      { id: 'seal' as const, label: 'Ấn Triện 3D', glyph: '印' },
                      { id: 'ribbons' as const, label: 'Sóng Thanh 3D', glyph: '声' },
                    ].map((m) => {
                      const active = slide2Mode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSlide2Mode(m.id)}
                          className={`w-[68px] py-3 px-1.5 border flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            active
                              ? 'border-[#D4A017] shadow-lg'
                              : 'border-[#181415]/20 hover:border-[#C41E3A]'
                          }`}
                          style={{
                            backgroundColor: active ? '#181415' : 'rgba(255, 255, 255, 0.94)',
                          }}
                        >
                          <span
                            className={`font-hanzi-serif text-lg font-bold leading-none ${
                              active ? 'text-[#E6BE4C]' : 'text-[#C41E3A]'
                            }`}
                          >
                            {m.glyph}
                          </span>
                          <span
                            className={`text-[9.5px] font-mono font-bold tracking-tight text-center leading-tight ${
                              active ? 'text-white' : 'text-[#181415]'
                            }`}
                          >
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ────────────────────────────────────────────────────────────────
              SLIDE 2: INK-MASKED CALLIGRAPHY ARTISTRY & 3D TIANZIGE (WuWa 'NEW OUTFIT' DNA)
          ──────────────────────────────────────────────────────────────── */}
          {activeSlide === 2 && (
            <motion.section
              key="slide-calligraphy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full overflow-hidden bg-[#ECE8E2]"
            >
              {/* Deep Obsidian-Crimson Top Atmospheric Wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(34, 18, 22, 0.78) 0%, rgba(120, 26, 42, 0.25) 32%, rgba(236, 232, 226, 0) 62%)',
                }}
              />
              <ArchitecturalBlueprintGrid />

              {/* Right-Weighted Dramatic Ink-Splash Calligraphy Visual seamlessly feathered into stone canvas */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[76%] overflow-hidden"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(96deg, transparent 0%, rgba(0,0,0,0.45) 22%, rgba(0,0,0,0.96) 44%, #000 100%)',
                  maskImage:
                    'linear-gradient(96deg, transparent 0%, rgba(0,0,0,0.45) 22%, rgba(0,0,0,0.96) 44%, #000 100%)',
                }}
              >
                <img
                  src="/images/wuwa-calligraphy-ink.webp"
                  alt=""
                  decoding="async"
                  className="w-full h-full object-cover object-right"
                />
              </div>

              {/* Left Diamond Crosshair Frame (4 cols) + Center Floating 3D TianZiGe Tablet (4 cols) + Right Unobstructed Ink Brush Artwork (4 cols) */}
              <div className="relative z-10 h-full max-w-[1380px] mx-auto px-6 sm:px-14 lg:pl-24 lg:pr-10 pt-14 pb-16 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
                <div className="lg:col-span-4 space-y-5">
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[42px] uppercase tracking-[0.1em] text-white drop-shadow-[0_3px_14px_rgba(20,14,16,0.45)]">
                    THƯ PHÁP 3D
                  </h2>

                  {/* Signature 4-Corner Diamond Crosshair Frame (Zero rounded-2xl SaaS box!) */}
                  <DiamondCrosshairFrame className="p-6 sm:p-7 max-w-md shadow-[0_24px_56px_-24px_rgba(24,20,21,0.28)]">
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#181415]/15">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
                          ĐIỀN TỰ CÁCH · {activeCalligraphy.strokes} NÉT CHUẨN
                        </span>
                        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#181415] mt-1">
                          {activeCalligraphy.title}
                        </h3>
                        <p className="text-xs font-mono font-semibold text-[#5F5658] mt-1">
                          {activeCalligraphy.char} ({activeCalligraphy.pinyin}) · Hán-Việt:{' '}
                          <span className="text-[#C41E3A] font-bold">{activeCalligraphy.sino}</span>
                        </p>
                      </div>
                      <LotusVoiceButton
                        onClick={() => speakChinese(activeCalligraphy.char, 0.75)}
                        active={isSpeaking}
                        accentColor="#C41E3A"
                        label={`Nghe đọc ${activeCalligraphy.char}`}
                      />
                    </div>

                    <p className="text-[13.5px] text-[#262123] leading-relaxed py-4">
                      {activeCalligraphy.desc}
                    </p>

                    {/* 4 Sharp Architectural Seal Stamps */}
                    <div className="pt-2 border-t border-[#181415]/15">
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#5F5658] mb-2.5">
                        Đổi chữ khắc trên bia sứ 3D
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {CALLIGRAPHY_SPECIMENS.map((item, idx) => {
                          const selected = idx === calligraphyIdx;
                          return (
                            <button
                              key={item.char}
                              type="button"
                              onClick={() => {
                                setCalligraphyIdx(idx);
                                speakChinese(item.char, 0.75);
                              }}
                              className={`py-2.5 border text-center cursor-pointer ${
                                selected
                                  ? 'bg-[#C41E3A] text-white border-[#C41E3A] shadow-md'
                                  : 'bg-white/85 hover:bg-white text-[#181415] border-[#181415]/20 hover:border-[#C41E3A]'
                              }`}
                            >
                              <span className="font-hanzi-serif text-2xl font-bold block leading-none">
                                {item.char}
                              </span>
                              <span
                                className={`text-[10px] font-mono mt-1 block ${
                                  selected ? 'text-[#F2D16B]' : 'text-[#5F5658]'
                                }`}
                              >
                                {item.pinyin}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </DiamondCrosshairFrame>
                </div>

                {/* Center Floating Open-Canvas 3D TianZiGe Stone Tablet & Animated 3D Brush leaving right inkstone splash unobstructed */}
                <div className="lg:col-span-5 relative h-[300px] sm:h-[400px] lg:h-[470px] flex items-center justify-center">
                  <div className="w-full max-w-[390px] h-full">
                    <ThreeStudyDioramaStage
                      activeScene={1}
                      activeToneIdx={0}
                      activeStrokeChar={activeCalligraphy.char}
                      activeStrokePinyin={activeCalligraphy.pinyin}
                      activeStrokeCount={activeCalligraphy.strokes}
                      flippedCards={{}}
                      activeCardIdx={0}
                      activeHskLevel={1}
                      theme="light"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ────────────────────────────────────────────────────────────────
              SLIDE 3: FILIGREE-FRAMED CURRICULUM & FILMSTRIP (WuWa 'EVENT INFO' DNA)
          ──────────────────────────────────────────────────────────────── */}
          {activeSlide === 3 && (
            <motion.section
              key="slide-curriculum"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full overflow-hidden bg-[#ECE8E2]"
            >
              {/* Crimson-Plum Top Atmospheric Wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(118, 22, 42, 0.72) 0%, rgba(168, 42, 62, 0.28) 36%, rgba(236, 232, 226, 0) 68%)',
                }}
              />
              <ArchitecturalBlueprintGrid />

              <div className="relative z-10 h-full max-w-[1120px] mx-auto px-6 sm:px-14 pt-12 pb-16 flex flex-col items-center justify-center gap-5">
                {/* Ornate Gold-Crimson Filigree Cinema Frame with Boundary-Breaking Title */}
                <FiligreeCinemaFrame title="CHƯƠNG TRÌNH HSK" className="w-full">
                  <div className="relative h-[380px] sm:h-[440px] lg:h-[470px] w-full bg-[#141112]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeCurriculum.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.32 }}
                        className="absolute inset-0 w-full h-full"
                      >
                        <img
                          src={activeCurriculum.image}
                          alt={activeCurriculum.title}
                          decoding="async"
                          className="w-full h-full object-cover object-center"
                        />
                        {/* Rich Cinema Gradient Overlay anchoring right-side editorial panel */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-r from-[#141112]/30 via-[#141112]/55 to-[#141112]/95"
                        />

                        {/* Right Editorial Feature Overlay inside Cinema Frame */}
                        <div className="absolute inset-0 flex items-center justify-end p-6 sm:p-10">
                          <div className="max-w-md w-full space-y-4 text-white">
                            <span className="inline-block px-2.5 py-0.5 bg-[#C41E3A] text-white font-mono text-[10.5px] font-bold tracking-[0.18em] uppercase">
                              {activeCurriculum.tag}
                            </span>

                            <h3 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
                              {activeCurriculum.title}
                            </h3>

                            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                              {activeCurriculum.summary}
                            </p>

                            {activeCurriculum.id !== 'quiz' ? (
                              <div className="pt-2 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  {activeCurriculum.highlights.map((h) => (
                                    <div
                                      key={h}
                                      className="px-2.5 py-2 border border-[#E6BE4C]/40 bg-black/45 backdrop-blur-sm text-[11px] font-semibold text-[#F7E8C3] text-center"
                                    >
                                      {h}
                                    </div>
                                  ))}
                                </div>
                                <a
                                  href="#/login?tab=register"
                                  className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.16em] text-[#F2D16B] hover:text-white transition-colors pt-1"
                                >
                                  <span>Mở khóa học miễn phí</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ) : (
                              /* Live Interactive 10-Second HSK 1 Mini-Quiz right inside Slide 05 */
                              <div className="space-y-3 pt-1">
                                <div className="flex items-center justify-between border-b border-white/15 pb-2">
                                  <p className="text-sm font-bold">
                                    Câu <span className="font-hanzi-serif text-lg text-[#F2D16B]">「你好吗？」</span> nghĩa là gì?
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => speakChinese('你好吗', 0.78)}
                                    className="inline-flex items-center gap-1 text-xs font-mono text-[#F2D16B] hover:text-white cursor-pointer"
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
                                    { id: 'D', label: 'Cảm ơn rất nhiều' },
                                  ].map((opt) => {
                                    const picked = quizChoice === opt.id;
                                    const answered = quizChoice !== null;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setQuizChoice(opt.id)}
                                        className={`px-3 py-2 border text-left text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                                          answered
                                            ? opt.ok
                                              ? 'bg-[#00A86B] border-[#00A86B] text-white'
                                              : picked
                                                ? 'bg-[#C41E3A] border-[#C41E3A] text-white'
                                                : 'bg-white/10 border-white/15 text-white/50'
                                            : 'bg-black/50 hover:bg-white/15 border-white/25 hover:border-[#E6BE4C] text-white'
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
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Prev / Next Filigree Navigation Arrows */}
                    <button
                      type="button"
                      onClick={() =>
                        setCurriculumIdx((p) => (p - 1 + CURRICULUM_SLIDES.length) % CURRICULUM_SLIDES.length)
                      }
                      aria-label="Mục trước"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/55 hover:bg-[#C41E3A] text-white border border-[#E6BE4C]/45 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurriculumIdx((p) => (p + 1) % CURRICULUM_SLIDES.length)}
                      aria-label="Mục tiếp theo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/55 hover:bg-[#C41E3A] text-white border border-[#E6BE4C]/45 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </FiligreeCinemaFrame>

                {/* Bottom 5-Thumbnail Filmstrip (Exact WuWa Event Info Filmstrip!) */}
                <div className="flex items-center justify-center gap-3 w-full overflow-x-auto no-scrollbar py-1">
                  {CURRICULUM_SLIDES.map((slide, idx) => {
                    const active = idx === curriculumIdx;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setCurriculumIdx(idx)}
                        className={`group relative w-32 sm:w-36 h-[68px] sm:h-[76px] shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                          active
                            ? 'border-[#D4A017] shadow-[0_0_18px_rgba(212,160,23,0.55)] scale-[1.03]'
                            : 'border-[#181415]/25 opacity-75 hover:opacity-100 hover:border-[#C41E3A]'
                        }`}
                      >
                        <img
                          src={slide.image}
                          alt={slide.thumbLabel}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <span className="absolute bottom-1.5 inset-x-2 text-[10px] font-mono font-bold text-white truncate text-left">
                          0{idx + 1} · {slide.thumbLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}

          {/* ────────────────────────────────────────────────────────────────
              SLIDE 4: FILIGREE 3D SANCTUARY — 3D FLASHCARDS & HSK 1–6 PAGODA
          ──────────────────────────────────────────────────────────────── */}
          {activeSlide === 4 && (
            <motion.section
              key="slide-sanctuary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full overflow-hidden bg-[#ECE8E2]"
            >
              {/* Deep Obsidian-Gold Top Atmospheric Wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(24, 17, 20, 0.82) 0%, rgba(140, 96, 16, 0.25) 36%, rgba(236, 232, 226, 0) 68%)',
                }}
              />
              <ArchitecturalBlueprintGrid />

              <div className="relative z-10 h-full max-w-[1120px] mx-auto px-6 sm:px-14 pt-12 pb-16 flex flex-col items-center justify-center gap-4">
                <FiligreeCinemaFrame title="KHÔNG GIAN 3D" className="w-full">
                  <div className="relative h-[400px] sm:h-[460px] lg:h-[490px] w-full bg-[#141112] flex flex-col">
                    {/* Top Minimal Mode Switcher Strip inside Cinema Frame */}
                    <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2 border-b border-white/10 bg-black/35">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSanctuaryMode('cards')}
                          className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                            sanctuaryMode === 'cards'
                              ? 'bg-[#C41E3A] text-white border-[#E6BE4C]/70'
                              : 'bg-white/5 text-white/70 border-white/15 hover:text-white'
                          }`}
                        >
                          Thẻ Nhớ Lật 3D SM-2
                        </button>
                        <button
                          type="button"
                          onClick={() => setSanctuaryMode('pagoda')}
                          className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                            sanctuaryMode === 'pagoda'
                              ? 'bg-[#C41E3A] text-white border-[#E6BE4C]/70'
                              : 'bg-white/5 text-white/70 border-white/15 hover:text-white'
                          }`}
                        >
                          Tháp HSK 1 → 6 3D
                        </button>
                      </div>

                      <span className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] font-mono text-white/60">
                        <Move className="w-3.5 h-3.5 text-[#E6BE4C]" />
                        Kéo xoay tự do trong khung 3D
                      </span>
                    </div>

                    {/* Full-Stage Live Interactive 3D WebGL Sanctuary */}
                    <div className="flex-1 relative w-full min-h-0">
                      <ThreeStudyDioramaStage
                        activeScene={sanctuaryMode === 'cards' ? 2 : 3}
                        activeToneIdx={0}
                        activeStrokeChar="汉"
                        activeStrokePinyin="hàn"
                        activeStrokeCount={5}
                        flippedCards={flippedCards}
                        activeCardIdx={activeCardIdx}
                        activeHskLevel={activeHskLevel}
                        theme="dark"
                        className="w-full h-full"
                      />
                    </div>

                    {/* Bottom Interactive Controls inside Cinema Frame */}
                    <div className="relative z-20 px-5 py-3 border-t border-white/10 bg-black/55 backdrop-blur-sm">
                      {sanctuaryMode === 'cards' ? (
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {FLASHCARD_DECK.map((card, idx) => {
                              const flipped = !!flippedCards[card.id];
                              const focused = activeCardIdx === idx;
                              return (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveCardIdx(idx);
                                    setFlippedCards((p) => ({ ...p, [card.id]: !p[card.id] }));
                                    speakChinese(flipped ? card.hanzi : card.exampleCn, 0.8);
                                  }}
                                  className={`px-3 py-1.5 border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                                    focused
                                      ? 'bg-[#C41E3A] border-[#E6BE4C] text-white'
                                      : 'bg-white/10 hover:bg-white/15 border-white/20 text-white/85'
                                  }`}
                                >
                                  <span className="font-hanzi-serif text-base font-bold">
                                    {card.hanzi}
                                  </span>
                                  <span className="font-mono text-[11px] text-[#F2D16B]">
                                    {card.pinyin}
                                  </span>
                                  <RotateCw className="w-3 h-3" />
                                  <span className="text-[10.5px]">
                                    {flipped ? 'Mặt sau' : 'Lật 3D'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <p className="text-[11px] text-white/75 hidden md:block">
                            {FLASHCARD_DECK[activeCardIdx].exampleCn} —{' '}
                            <span className="text-[#F2D16B]">
                              {FLASHCARD_DECK[activeCardIdx].exampleVi}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-1.5">
                            {HSK_LEVELS.map((lv) => (
                              <button
                                key={lv.level}
                                type="button"
                                onClick={() => setActiveHskLevel(lv.level)}
                                className={`px-3 py-1.5 font-mono text-xs font-bold border transition-colors cursor-pointer ${
                                  activeHskLevel === lv.level
                                    ? 'bg-[#C41E3A] border-[#E6BE4C] text-white'
                                    : 'bg-white/10 hover:bg-white/15 border-white/20 text-white/80'
                                }`}
                              >
                                HSK {lv.level}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-white/85">
                            <strong className="text-[#F2D16B]">
                              HSK {activeHskLevel} ({HSK_LEVELS[activeHskLevel - 1].words}):
                            </strong>{' '}
                            {HSK_LEVELS[activeHskLevel - 1].note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </FiligreeCinemaFrame>

                {/* Crisp Conversion Prompt beneath Final Frame */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#262123]">
                  <span className="font-medium">
                    Miễn phí mở khóa toàn bộ 63 âm Pinyin & bài học HSK 1 ngay sau khi đăng ký
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFooter((v) => !v)}
                    className="font-mono text-[11px] uppercase tracking-wider text-[#C41E3A] hover:underline cursor-pointer"
                  >
                    {showFooter ? 'Ẩn chân trang ↓' : 'Thông tin học viện ↑'}
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── PERSISTENT BOTTOM STONE PRE-REGISTRATION RIBBON (Slides 1–4, WuWa signature!) ── */}
        <AnimatePresence>
          {!isHero && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-0 inset-x-0 z-30 h-12 bg-[#EAE6DF]/95 backdrop-blur-md border-t border-[#181415]/15 px-5 sm:px-8 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-display font-extrabold text-xs tracking-[0.18em] text-[#181415]">
                  HANZI<span className="text-[#C41E3A]">4U</span>
                </span>
                <span className="hidden sm:inline-block w-12 h-[1px] bg-[#181415]/25" />
                <span className="hidden sm:inline-block w-2 h-2 rotate-45 bg-[#C41E3A]" />
              </div>

              <p className="text-[11px] sm:text-xs font-display font-bold tracking-[0.08em] text-[#181415] uppercase truncate text-center">
                Học Trọn Bộ 63 Âm Pinyin · Tập Viết Hán Tự & Lộ Trình HSK 1–6 Miễn Phí
              </p>

              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden md:inline-block w-2 h-2 rotate-45 bg-[#D4A017]" />
                <span className="hidden md:inline-block w-10 h-[1px] bg-[#181415]/25" />
                <a
                  href="#/login?tab=register"
                  className="h-8 px-4 bg-[#181415] hover:bg-[#C41E3A] text-white border border-[#D4A017]/70 font-display text-[11px] font-extrabold tracking-[0.14em] uppercase inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>ĐĂNG KÝ NGAY</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#E6BE4C]" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-UP COMPACT STONE FOOTER DRAWER (Revealed on scroll past Slide 5)
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.footer
        initial={false}
        animate={{ y: showFooter ? 0 : 160 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 inset-x-0 h-[144px] z-50 bg-[#F3EFE9] text-[#181415] border-t-2 border-[#C41E3A] px-6 sm:px-10 flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HanziLogoMark variant="light" className="w-9 h-9" />
            <div className="leading-tight">
              <p className="font-display font-extrabold text-sm tracking-tight text-[#181415]">
                Hanzi<span className="text-[#C41E3A]">4U</span> · Học Viện Hán Ngữ Trực Tuyến
              </p>
              <p className="text-[11px] text-[#5F5658]">
                © 2026 Hanzi4U (hanzi4u.id.vn) — Lộ trình chuẩn HSK 1–6 · 63 Âm Pinyin · Thẻ Nhớ SM-2
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#181415]">
            <a href="#/login?tab=register" className="hover:text-[#C41E3A] transition-colors">
              Đăng ký miễn phí
            </a>
            <a href="#/login" className="hover:text-[#C41E3A] transition-colors">
              Đăng nhập
            </a>
            <button
              type="button"
              onClick={() => goToSlide(0)}
              className="text-[#5F5658] hover:text-[#C41E3A] transition-colors cursor-pointer"
            >
              Về đầu trang ↑
            </button>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};
