import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Move,
  Volume2,
  BookOpen,
  PenTool,
} from 'lucide-react';
import { ThreeMinimalZenSculpture } from '../../components/three/ThreeMinimalZenSculpture';
import { ThreeStudyDioramaStage } from '../../components/three/ThreeStudyDioramaStage';
import { HanziLogo, HanziLogoMark } from '../../components/HanziLogo';
import { InteractiveTianZiGeBoard } from '../../components/landing/InteractiveTianZiGeBoard';
import {
  ArchitecturalBlueprintGrid,
  EditorialPaperFrame,
  MuseumExhibitionFrame,
  PronunciationPlayButton,
  EqualizerBars,
  SunbeamDustOverlay,
  HanziLoadingScreen,
} from '../../components/landing/ArchitecturalOrnaments';
import { ambientBgm } from '../../lib/ambientMusic';

/* ── CHAPTERS & AUTHENTIC CHINESE LINGUISTIC CONTENT ── */
const CHAPTERS = [
  { id: 0, code: '序', label: 'Mở đầu', zhCaption: '汉语入门' },
  { id: 1, code: '一', label: 'Pinyin và 4 Thanh điệu', zhCaption: '第一课 · 声调' },
  { id: 2, code: '二', label: 'Luyện viết chữ Hán', zhCaption: '第二课 · 书写' },
  { id: 3, code: '三', label: 'Chương trình HSK', zhCaption: '第三课 · 课程' },
  { id: 4, code: '四', label: 'Thẻ lật từ & Giáo trình HSK', zhCaption: '第四课 · 教材' },
];

const SPECIMEN_TONES = [
  {
    hanzi: '妈',
    pinyin: 'mā',
    toneLabel: 'Thanh 1',
    phonetic: 'Cao độ 5–5 · Giọng ngang và đều',
    sino: 'Chữ 妈 · Nghĩa: Mẹ (Hán-Việt: Ma)',
    compoundHanzi: '妈妈',
    compoundPinyin: 'māma',
    compoundVi: 'Mẹ',
    lore: 'Giữ âm cao, phẳng và đều hơi từ đầu đến cuối âm tiết.',
    accent: '#157A57',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(21, 122, 87, 0.14) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 0,
  },
  {
    hanzi: '麻',
    pinyin: 'má',
    toneLabel: 'Thanh 2',
    phonetic: 'Cao độ 3–5 · Giọng đi lên',
    sino: 'Chữ 麻 · Nghĩa: Cây gai, tê (Hán-Việt: Ma)',
    compoundHanzi: '麻烦',
    compoundPinyin: 'máfán',
    compoundVi: 'Phiền phức',
    lore: 'Đẩy giọng từ quãng giữa lên cao rõ ràng, gần giống dấu sắc tiếng Việt.',
    accent: '#C41E3A',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(196, 30, 58, 0.13) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 1,
  },
  {
    hanzi: '马',
    pinyin: 'mǎ',
    toneLabel: 'Thanh 3',
    phonetic: 'Cao độ 2–1–4 · Giọng trầm xuống rồi lên',
    sino: 'Chữ 马 · Nghĩa: Con ngựa (Hán-Việt: Mã)',
    compoundHanzi: '马上',
    compoundPinyin: 'mǎshàng',
    compoundVi: 'Ngay lập tức',
    lore: 'Hạ giọng trầm xuống rồi ngân nhẹ lên; khi hai thanh 3 đi liền, chữ đầu đọc thành thanh 2.',
    accent: '#B5841A',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(181, 132, 26, 0.15) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 2,
  },
  {
    hanzi: '骂',
    pinyin: 'mà',
    toneLabel: 'Thanh 4',
    phonetic: 'Cao độ 5–1 · Giọng xuống nhanh, dứt khoát',
    sino: 'Chữ 骂 · Nghĩa: Trách mắng (Hán-Việt: Mạ)',
    compoundHanzi: '责骂',
    compoundPinyin: 'zémà',
    compoundVi: 'Trách mắng',
    lore: 'Hạ giọng nhanh và dứt khoát từ cao xuống thấp trong một nhịp ngắn.',
    accent: '#7F1D1D',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(127, 29, 29, 0.13) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 3,
  },
];

const CALLIGRAPHY_SPECIMENS = [
  {
    char: '永',
    pinyin: 'yǒng',
    sino: 'Vĩnh',
    meaning: 'Vĩnh cửu',
    strokes: 5,
    title: 'Chữ 永 · 5 nét cơ bản',
    desc: 'Hội tụ đủ các nét chấm, ngang, sổ móc, phẩy và mác trong một chữ — bài tập kinh điển để luyện đều tay và cân đối khung chữ.',
  },
  {
    char: '学',
    pinyin: 'xué',
    sino: 'Học',
    meaning: 'Học tập',
    strokes: 8,
    title: 'Chữ 学 · Trên trước dưới sau',
    desc: 'Viết lần lượt từ trên xuống dưới: ba nét chấm mở đầu, tiếp theo là bộ Mịch (冖) ở giữa và bộ Tử (子) bên dưới.',
  },
  {
    char: '好',
    pinyin: 'hǎo',
    sino: 'Hảo',
    meaning: 'Tốt đẹp',
    strokes: 6,
    title: 'Chữ 好 · Trái trước phải sau',
    desc: 'Ghép từ bộ Nữ (女) bên trái và bộ Tử (子) bên phải. Khung ô vuông giúp căn chuẩn tỷ lệ hai vế để chữ gọn và hài hòa.',
  },
  {
    char: '中',
    pinyin: 'zhōng',
    sino: 'Trung',
    meaning: 'Ở giữa',
    strokes: 4,
    title: 'Chữ 中 · Trục đối xứng giữa',
    desc: 'Viết khung bộ Khẩu (口) trước rồi kéo nét sổ thẳng đi qua chính giữa tâm ô vuông sau cùng.',
  },
];

const CURRICULUM_SLIDES = [
  {
    id: 'desk',
    tag: '01 · GIÁO TRÌNH BÀI BẢN',
    title: 'Lộ trình từ con số 0 đến HSK 6',
    image: '/images/login-study-desk.webp',
    thumbLabel: 'Giáo trình HSK',
    summary:
      'Làm khảo sát nhanh để xếp đúng trình độ hiện tại. Mỗi bài học gói gọn hội thoại thực tế, từ vựng kèm âm Hán-Việt, ngữ pháp cốt lõi và bài tập ngắn.',
    points: ['63 âm Pinyin đầy đủ', '5.000+ từ vựng HSK 1–6', 'Đồng bộ tiến độ đa thiết bị'],
  },
  {
    id: 'notebook',
    tag: '02 · LUYỆN VIẾT CHỮ HÁN',
    title: 'Thứ tự nét & cấu trúc chữ Hán chuẩn',
    image: '/images/intro-hanzi-notebook.webp',
    thumbLabel: 'Luyện viết chữ',
    summary:
      'Hơn 9.500 chữ Hán có hướng dẫn thứ tự nét động, hỗ trợ tự viết tay bằng chuột hoặc màn hình cảm ứng và nhận diện nét đúng ngay lập tức.',
    points: ['9.500+ chữ Hán chuẩn nét', 'Phân tích bộ thủ trực quan', 'Kết nối âm Hán-Việt'],
  },
  {
    id: 'study',
    tag: '03 · PHƯƠNG PHÁP 15 PHÚT',
    title: 'Nhịp tự học đều đặn mỗi ngày',
    image: '/images/hero-chinese-study.webp',
    thumbLabel: 'Nhịp 15 phút',
    summary:
      'Thuật toán lặp lại ngắt quãng SM-2 tự lên lịch ôn từ vựng đúng thời điểm chuẩn bị quên, giúp giữ thói quen nhẹ nhàng mà không bị quá tải.',
    points: ['Nhắc lịch ôn SM-2 tự động', 'Phát âm chuẩn phổ thông', 'Không quảng cáo làm phiền'],
  },
  {
    id: 'exam',
    tag: '04 · PHÒNG THI MÔ PHỎNG',
    title: '48+ Bộ đề thi & sách bài tập',
    image: '/images/editorial-hero-chinese.webp',
    thumbLabel: '48+ Bộ đề',
    summary:
      'Gồm 30 đề thi thử HSK bấm giờ chuẩn và 18 bộ sách bài tập theo từng cấp độ, chấm điểm ngay kèm lời giải chi tiết cho từng câu.',
    points: ['30 Đề thi mô phỏng', '18 Bộ sách bài tập', 'Chấm điểm & giải thích ngay'],
  },
  {
    id: 'quiz',
    tag: '05 · THỬ NHANH 10 GIÂY',
    title: 'Kiểm tra phản xạ HSK 1',
    image: '/images/login-study-desk.webp',
    thumbLabel: 'Thử nhanh HSK',
    summary: 'Chọn nhanh nghĩa đúng của câu chào hỏi cơ bản dưới đây.',
    points: [],
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

const HSK_TEXTBOOKS = [
  {
    level: 1,
    title: 'Giáo trình chuẩn HSK 1',
    zhTitle: 'HSK 标准教程 1',
    author: 'Khương Lệ Bình chủ biên',
    cover: '/images/books/hsk1.webp',
    words: '150 từ vựng',
    lessons: '15 bài học',
    accent: '#D97706',
    desc: 'Làm quen 63 âm Pinyin, nét chữ Hán cơ bản và các mẫu câu chào hỏi, giới thiệu bản thân, thời gian, mua sắm hàng ngày.',
    topics: ['Ngữ âm Pinyin', 'Chào hỏi & Gia đình', 'Thời gian & Mua sắm'],
  },
  {
    level: 2,
    title: 'Giáo trình chuẩn HSK 2',
    zhTitle: 'HSK 标准教程 2',
    author: 'Khương Lệ Bình chủ biên',
    cover: '/images/books/hsk2.webp',
    words: '300 từ vựng',
    lessons: '15 bài học',
    accent: '#1F7A68',
    desc: 'Mở rộng giao tiếp sinh hoạt thường ngày: hỏi đường, thời tiết, sở thích, sức khỏe và các cấu trúc câu so sánh, bổ ngữ kết quả.',
    topics: ['Giao tiếp đời sống', 'Câu so sánh & Bổ ngữ', 'Du lịch & Sức khỏe'],
  },
  {
    level: 3,
    title: 'Giáo trình chuẩn HSK 3',
    zhTitle: 'HSK 标准教程 3',
    author: 'Khương Lệ Bình chủ biên',
    cover: '/images/books/hsk3.webp',
    words: '600 từ vựng',
    lessons: '20 bài học',
    accent: '#D95B18',
    desc: 'Chuyển hẳn sang mặt chữ Hán chuẩn (không phụ thuộc Pinyin), làm chủ câu chữ 把, câu bị động và giao tiếp tự tin trong học tập, công việc.',
    topics: ['Đọc hiểu chữ Hán', 'Câu chữ 把 & Bị động', 'Học tập & Công sở'],
  },
  {
    level: 4,
    title: 'Giáo trình chuẩn HSK 4',
    zhTitle: 'HSK 标准教程 4 (上/下)',
    author: 'Khương Lệ Bình chủ biên',
    cover: '/images/books/hsk4.webp',
    words: '1.200 từ vựng',
    lessons: '20 bài học',
    accent: '#B61F24',
    desc: 'Thảo luận lưu loát nhiều chủ đề văn hóa, kinh tế, xã hội; phân biệt từ gần nghĩa và luyện kỹ năng viết đoạn văn mạch lạc.',
    topics: ['Thảo luận đa chủ đề', 'Phân biệt từ đồng nghĩa', 'Chuẩn du học đại học'],
  },
  {
    level: 5,
    title: 'Giáo trình chuẩn HSK 5',
    zhTitle: 'HSK 标准教程 5 (上/下)',
    author: 'Khương Lệ Bình chủ biên',
    cover: '/images/books/hsk5.webp',
    words: '2.500 từ vựng',
    lessons: '36 bài học',
    accent: '#184375',
    desc: 'Đọc hiểu báo chí, thưởng thức phim ảnh nguyên bản và diễn đạt quan điểm cá nhân bằng thành ngữ, cấu trúc ngữ pháp cao cấp.',
    topics: ['Báo chí & Văn học', 'Thành ngữ tứ tự', 'Thuyết trình & Viết luận'],
  },
  {
    level: 6,
    title: 'Giáo trình chuẩn HSK 6',
    zhTitle: 'HSK 标准教程 6 (上/下)',
    author: 'Khương Lệ Bình chủ biên',
    cover: '/images/books/hsk6.webp',
    words: '5.000+ từ vựng',
    lessons: '40 bài học',
    accent: '#5A1063',
    desc: 'Làm chủ tiếng Trung học thuật và thương mại chuyên sâu, tóm tắt văn bản dài và sử dụng ngôn ngữ tự nhiên như người bản xứ.',
    topics: ['Học thuật chuyên sâu', 'Biên phiên dịch cao cấp', 'Ngôn ngữ bản xứ'],
  },
];

export const LandingPage: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  // Start with [0] on frame 0 so navigating #/login -> #/ renders Slide 0 in <2ms with 0 WebGL blocking,
  // then pre-warm the next slide in idle background time so scrolling is 0ms instant.
  const [warmSlides, setWarmSlides] = useState<number[]>([0]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setWarmSlides((prev) => {
        const next = [activeSlide, activeSlide + 1].filter((n) => n <= 4 && !prev.includes(n));
        return next.length ? [...prev, ...next] : prev;
      });
    }, activeSlide === 0 ? 110 : 0);
    return () => window.clearTimeout(timer);
  }, [activeSlide]);
  const isWarm = (i: number) => warmSlides.includes(i);
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [bgmPlaying, setBgmPlaying] = useState<boolean>(false);
  const [speakingScope, setSpeakingScope] = useState<'tone' | 'calligraphy' | null>(null);
  const [isExitingToAuth, setIsExitingToAuth] = useState<boolean>(false);

  // HoYoverse-Caliber Initial Entrance Loading Curtain (runs once per browser session)
  const [introLoaded, setIntroLoaded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem('hanzi4u_intro_loaded') === '1';
  });
  const [loadProgress, setLoadProgress] = useState<number>(introLoaded ? 100 : 28);

  // 120fps Zero-React-Rerender 2.5D Mouse-Tracking Parallax Refs (HoYoverse /vi/home physics)
  const heroBgRef = useRef<HTMLDivElement>(null);
  const heroBeamRef = useRef<HTMLDivElement>(null);
  const heroDustRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const calligraphyBgRef = useRef<HTMLDivElement>(null);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });

  const speakTokenRef = useRef<number>(0);
  const speakTimerRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Slide 1 (Phonetics & 4 Tones)
  const [specimenIdx, setSpecimenIdx] = useState<number>(1);
  const [slide1Mode, setSlide1Mode] = useState<'medallion' | 'curves'>('medallion');

  // Slide 2 (Calligraphy & TianZiGe)
  const [calligraphyIdx, setCalligraphyIdx] = useState<number>(0);
  const [calligraphyPracticeMode, setCalligraphyPracticeMode] = useState<boolean>(false);

  // Slide 3 (Curriculum Gallery)
  const [curriculumIdx, setCurriculumIdx] = useState<number>(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);

  // Slide 4 (Frameless 3D Flashcards & Real 3D HSK 1-6 Textbooks)
  const [studioMode, setStudioMode] = useState<'cards' | 'hsk'>('cards');
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [activeHskLevel, setActiveHskLevel] = useState<number>(1);

  // 1:1 WuWa-Grade Wheel / Trackpad & Mobile Touch Swipe State (Strict 1-slide-per-gesture lock)
  const lastStepAtRef = useRef<number>(0);
  const wheelStateRef = useRef({
    lockUntil: 0,
    lastEventTime: 0,
    lastAbsDelta: 0,
    lastDir: 0,
  });
  const swipeLayerRef = useRef<HTMLDivElement>(null);
  const touchGestureRef = useRef<{
    active: boolean;
    startY: number;
    startX: number;
    lastY: number;
    lastX: number;
    startTime: number;
    section: HTMLElement | null;
    isScrollable: boolean;
    startedAtTop: boolean;
    startedAtBottom: boolean;
  }>({
    active: false,
    startY: 0,
    startX: 0,
    lastY: 0,
    lastX: 0,
    startTime: 0,
    section: null,
    isScrollable: false,
    startedAtTop: true,
    startedAtBottom: true,
  });

  const activeSpecimen = SPECIMEN_TONES[specimenIdx];
  const activeCalligraphy = CALLIGRAPHY_SPECIMENS[calligraphyIdx];
  const activeCurriculum = CURRICULUM_SLIDES[curriculumIdx];
  const activeBook = HSK_TEXTBOOKS[Math.min(5, Math.max(0, activeHskLevel - 1))];

  // Lock root html/body scrollbars completely while on full-viewport LandingPage
  useEffect(() => {
    document.documentElement.classList.add('landing-lock');
    return () => {
      document.documentElement.classList.remove('landing-lock');
    };
  }, []);

  // Auto-start gentle chill East-Asian ambient music on page entry, and fade out when leaving to Login
  useEffect(() => {
    ambientBgm.initAutoStart();
    const unsub = ambientBgm.subscribe(setBgmPlaying);
    return () => {
      unsub();
      ambientBgm.suspendOnLeave();
      if (speakTimerRef.current !== null) {
        window.clearTimeout(speakTimerRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakChinese = useCallback(
    (text: string, rate = 0.78, pulseScope?: 'tone' | 'calligraphy') => {
      const nextToken = ++speakTokenRef.current;
      if (speakTimerRef.current !== null) {
        window.clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }

      if (pulseScope) {
        setSpeakingScope(pulseScope);
        speakTimerRef.current = window.setTimeout(() => {
          if (speakTokenRef.current === nextToken) {
            setSpeakingScope(null);
          }
        }, 720);
      } else {
        setSpeakingScope(null);
      }

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = rate;
        utteranceRef.current = u;
        u.onend = () => {
          if (speakTokenRef.current === nextToken) {
            setSpeakingScope(null);
          }
        };
        u.onerror = () => {
          if (speakTokenRef.current === nextToken) {
            setSpeakingScope(null);
          }
        };
        window.speechSynthesis.speak(u);
      } catch {
        // Ignore browser TTS errors gracefully
      }
    },
    []
  );

  const goToSlide = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    lastStepAtRef.current = performance.now();
    setShowFooter(false);
    setActiveSlide(clamped);
  }, []);

  const stepChapter = useCallback((dir: 1 | -1) => {
    const now = performance.now();
    // Hard 820ms transition lock: guarantees a single wheel/swipe gesture never skips a chapter (e.g. 1 -> 3)
    if (now - lastStepAtRef.current < 820) return;
    lastStepAtRef.current = now;

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

  // Preload all editorial photographs & 6 real HSK book covers + drive smooth initial loading curtain
  useEffect(() => {
    const heroImg = new Image();
    heroImg.src = '/images/editorial-hero-chinese.webp';

    [
      '/images/intro-hanzi-notebook.webp',
      '/images/login-study-desk.webp',
      '/images/hero-chinese-study.webp',
      '/images/books/hsk1.webp',
      '/images/books/hsk2.webp',
      '/images/books/hsk3.webp',
      '/images/books/hsk4.webp',
      '/images/books/hsk5.webp',
      '/images/books/hsk6.webp',
    ].forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    if (introLoaded) return;

    const t1 = window.setTimeout(() => setLoadProgress(68), 140);
    const t2 = window.setTimeout(() => setLoadProgress(94), 310);
    const finishIntro = () => {
      setLoadProgress(100);
      window.setTimeout(() => {
        setIntroLoaded(true);
        try {
          window.sessionStorage.setItem('hanzi4u_intro_loaded', '1');
        } catch {
          // Ignore storage restrictions
        }
      }, 180);
    };

    const t3 = window.setTimeout(finishIntro, 480);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [introLoaded]);

  // 120fps Lerped 2.5D Mouse-Tracking Parallax Engine (desktop fine-pointer only so mobile stays cool & 60fps!)
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reducedMotion || isCoarsePointer || window.innerWidth < 768) return;

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const elapsed = (now - startTime) * 0.001;
      const cur = mouseCurrentRef.current;
      const tgt = mouseTargetRef.current;

      // Silky exponential damping + subtle idle breathing drift like HoYoverse /vi/home
      const idleX = Math.sin(elapsed * 0.55) * 0.12;
      const idleY = Math.cos(elapsed * 0.42) * 0.1;
      cur.x += (tgt.x + idleX - cur.x) * 0.062;
      cur.y += (tgt.y + idleY - cur.y) * 0.062;

      if (heroBgRef.current) {
        const bx = (cur.x * -24).toFixed(2);
        const by = (cur.y * -15).toFixed(2);
        const rx = (cur.y * 1.45).toFixed(2);
        const ry = (cur.x * -1.85).toFixed(2);
        heroBgRef.current.style.transform = `perspective(1200px) translate3d(${bx}px, ${by}px, 0) scale(1.075) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      if (heroBeamRef.current) {
        const lx = (cur.x * 30).toFixed(2);
        const ly = (cur.y * 18).toFixed(2);
        heroBeamRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      }
      if (heroDustRef.current) {
        const dx = (cur.x * 46).toFixed(2);
        const dy = (cur.y * 28).toFixed(2);
        heroDustRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
      if (heroContentRef.current) {
        const cx = (cur.x * 7).toFixed(2);
        const cy = (cur.y * 4.5).toFixed(2);
        heroContentRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
      if (calligraphyBgRef.current) {
        const nbx = (cur.x * -18).toFixed(2);
        const nby = (cur.y * -11).toFixed(2);
        calligraphyBgRef.current.style.transform = `translate3d(${nbx}px, ${nby}px, 0) scale(1.05)`;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 1:1 WuWa Swiper Mouse-Wheel & Trackpad Inertia Onset Detector (works on Desktop & Mobile Emulator)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // On narrow viewports where an inner slide scrolls vertically, let native scroll run until reaching top/bottom
      if (window.innerWidth < 1024) {
        const activeSection = document.querySelector<HTMLElement>(
          'section[data-active-slide="true"]'
        );
        if (activeSection && activeSection.scrollHeight > activeSection.clientHeight + 8) {
          const atTop = activeSection.scrollTop <= 8;
          const atBottom =
            activeSection.scrollTop + activeSection.clientHeight >= activeSection.scrollHeight - 10;
          if (e.deltaY > 0 && !atBottom) return;
          if (e.deltaY < 0 && !atTop) return;
        }
      }

      e.preventDefault();

      const absDelta = Math.abs(e.deltaY);
      if (absDelta < 6) return;

      const now = performance.now();
      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      const ws = wheelStateRef.current;
      const gap = now - ws.lastEventTime;
      const prevAbsDelta = ws.lastAbsDelta;

      ws.lastEventTime = now;
      ws.lastAbsDelta = absDelta;

      // Never allow mid-transition wheel events to queue or skip a slide during the 800ms vertical transition
      if (now < ws.lockUntil) {
        return;
      }

      // Filter out decaying trackpad / mouse-wheel momentum tails after lock expires
      const isFreshStream = gap > 165 || dir !== ws.lastDir;
      const isSharpReAcceleration = absDelta > prevAbsDelta * 1.75 + 18;
      if (!isFreshStream && !isSharpReAcceleration) {
        // Extend lock slightly while inertia tail is still coasting down
        ws.lockUntil = now + 140;
        return;
      }

      ws.lastDir = dir;
      ws.lockUntil = now + 840;
      stepChapter(dir);
    };

    const onKeyDown = (e: KeyboardEvent) => {
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

  const handleStagePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    mouseTargetRef.current.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
    mouseTargetRef.current.y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
  }, []);

  // Cinematic HoYoverse Camera Dolly Zoom-In Transition into Login / Register
  const handleNavigateAuth = useCallback(
    (targetHash: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (isExitingToAuth) return;
      setIsExitingToAuth(true);
      window.setTimeout(() => {
        window.location.hash = targetHash;
      }, 220);
    },
    [isExitingToAuth]
  );

  const handleDirectCardClick = useCallback(
    (cardId: string, cardIdx: number) => {
      const card = FLASHCARD_DECK[cardIdx];
      setActiveCardIdx(cardIdx);
      setFlippedCards((prev) => {
        const nextFlipped = !prev[cardId];
        if (card) {
          speakChinese(nextFlipped ? card.exampleCn : card.hanzi, 0.8);
        }
        return { ...prev, [cardId]: nextFlipped };
      });
    },
    [speakChinese]
  );

  const handleDirectBookClick = useCallback((level: number) => {
    setActiveHskLevel(level);
  }, []);

  const resetSwipeOffset = useCallback((slideIdx: number) => {
    const el = swipeLayerRef.current;
    if (!el) return;
    el.style.transitionDuration = '';
    el.style.transform = `translate3d(0px, -${slideIdx * 100}%, 0px)`;
  }, []);

  // Ensure vertical Swiper wrapper snaps cleanly to activeSlide with 800ms WuWa ease
  useEffect(() => {
    resetSwipeOffset(activeSlide);
    const activeSec = document.querySelector<HTMLElement>(
      `section[data-slide-idx="${activeSlide}"]`
    );
    if (activeSec && activeSec.scrollTop > 0) {
      activeSec.scrollTop = 0;
    }
  }, [activeSlide, resetSwipeOffset]);

  const finishTouchSwipe = useCallback(
    (endY?: number, endX?: number) => {
      const g = touchGestureRef.current;
      if (!g.active) return;
      g.active = false;

      const finalY = endY ?? g.lastY;
      const finalX = endX ?? g.lastX;
      const dy = g.startY - finalY;
      const dx = g.startX - finalX;
      const elapsed = Math.max(1, performance.now() - g.startTime);
      const velocity = Math.abs(dy) / elapsed;

      // Require vertical-dominant swipe and either >= 28px drag or crisp quick flick (>= 16px)
      if (Math.abs(dy) < Math.abs(dx) * 1.05) {
        resetSwipeOffset(activeSlide);
        return;
      }
      const isValidSwipe = Math.abs(dy) >= 28 || (Math.abs(dy) >= 16 && velocity >= 0.22);
      if (!isValidSwipe) {
        resetSwipeOffset(activeSlide);
        return;
      }

      if (g.isScrollable && g.section) {
        const atTopNow = g.section.scrollTop <= 14;
        const atBottomNow =
          g.section.scrollTop + g.section.clientHeight >= g.section.scrollHeight - 16;
        if (dy > 0 && !(g.startedAtBottom || atBottomNow)) {
          resetSwipeOffset(activeSlide);
          return;
        }
        if (dy < 0 && !(g.startedAtTop || atTopNow)) {
          resetSwipeOffset(activeSlide);
          return;
        }
      }

      resetSwipeOffset(activeSlide);
      stepChapter(dy > 0 ? 1 : -1);
    },
    [activeSlide, resetSwipeOffset, stepChapter]
  );

  const isHero = activeSlide === 0;

  return (
    <div
      onPointerMove={handleStagePointerMove}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden overscroll-none bg-[#F5F2EC] text-[#1C1917] select-none"
      onTouchStart={(e) => {
        const target = e.target as HTMLElement | null;
        // Never hijack touch gestures on 3D WebGL canvas or horizontal scrollers (e.g. filmstrip)
        if (target?.closest('canvas') || target?.closest('.no-chapter-swipe')) {
          touchGestureRef.current.active = false;
          return;
        }
        const touch = e.touches[0];
        if (!touch) return;

        const section =
          (target?.closest('section') as HTMLElement | null) ||
          document.querySelector<HTMLElement>('section[data-active-slide="true"]');
        const isScrollable = Boolean(
          section && section.scrollHeight > section.clientHeight + 8
        );
        const startedAtTop = !isScrollable || (section ? section.scrollTop <= 14 : true);
        const startedAtBottom =
          !isScrollable ||
          (section
            ? section.scrollTop + section.clientHeight >= section.scrollHeight - 16
            : true);

        touchGestureRef.current = {
          active: true,
          startY: touch.clientY,
          startX: touch.clientX,
          lastY: touch.clientY,
          lastX: touch.clientX,
          startTime: performance.now(),
          section,
          isScrollable,
          startedAtTop,
          startedAtBottom,
        };
      }}
      onTouchMove={(e) => {
        const g = touchGestureRef.current;
        if (!g.active) return;
        const touch = e.touches[0];
        if (!touch) return;
        g.lastY = touch.clientY;
        g.lastX = touch.clientX;

        const dy = g.startY - touch.clientY;
        const dx = g.startX - touch.clientX;
        if (Math.abs(dy) <= Math.abs(dx)) return;

        // Live 120fps vertical Swiper drag preview across chapter boundaries (or on Hero)
        const canDragDown = !g.isScrollable || (dy > 0 && g.startedAtBottom);
        const canDragUp = !g.isScrollable || (dy < 0 && g.startedAtTop);
        if ((dy > 0 && canDragDown) || (dy < 0 && canDragUp && activeSlide > 0)) {
          const el = swipeLayerRef.current;
          if (el) {
            const clamped = Math.max(-72, Math.min(72, -dy * 0.35));
            el.style.transitionDuration = '0ms';
            el.style.transform = `translate3d(0px, calc(-${activeSlide * 100}% + ${clamped.toFixed(1)}px), 0px)`;
          }
        }
      }}
      onTouchEnd={(e) => {
        const touch = e.changedTouches[0];
        finishTouchSwipe(touch?.clientY, touch?.clientX);
      }}
      onTouchCancel={(e) => {
        const touch = e.changedTouches[0];
        finishTouchSwipe(touch?.clientY, touch?.clientX);
      }}
    >
      {/* HoYoverse-Caliber Entrance Loading Curtain (with Imperial Seal & Golden Astrolabe Ring) */}
      <HanziLoadingScreen visible={!introLoaded} progress={loadProgress} />

      {/* ═══════════════════════════════════════════════════════════════════
          QUIET FLOATING EDITORIAL CHROME (RESPONSIVE MOBILE + DESKTOP)
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Mobile-only clean translucent header bar so inner slide content never collides when scrolling */}
      <div
        aria-hidden="true"
        className={`sm:hidden fixed top-0 inset-x-0 h-[52px] z-30 transition-all duration-300 pointer-events-none ${
          isHero
            ? 'bg-gradient-to-b from-[#F5F2EC]/80 to-transparent'
            : 'bg-[#F5F2EC]/92 backdrop-blur-md border-b border-[#1C1917]/10'
        }`}
      />

      {/* TOP-LEFT: Clean Hanzi4U Seal Mark → Vertical Lesson Tag on Inner Chapters */}
      <div className="fixed top-2.5 left-3.5 sm:top-6 sm:left-8 z-40">
        {isHero ? (
          <button
            type="button"
            onClick={() => goToSlide(0)}
            className="cursor-pointer focus-visible:outline-none"
          >
            <span className="sm:hidden">
              <HanziLogo variant="light" size="sm" showSubtitle={false} />
            </span>
            <span className="hidden sm:inline-flex">
              <HanziLogo variant="light" size="md" subtitle="HỌC TIẾNG TRUNG HSK" />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goToSlide(0)}
            title="Về trang mở đầu"
            className="group flex items-center sm:flex-col gap-2 cursor-pointer focus-visible:outline-none"
          >
            <span className="w-8 h-8 rounded-[6px] bg-[#C41E3A] text-white font-hanzi-serif text-[15px] sm:text-base font-bold flex items-center justify-center shadow-xs group-hover:bg-[#A51730] transition-colors">
              汉
            </span>
            <span className="sm:hidden font-display font-bold text-xs text-[#1C1917] tracking-tight">
              Hanzi<span className="text-[#C41E3A]">4U</span>
            </span>
            <span
              className="hidden sm:block text-[10.5px] font-hanzi-serif tracking-[0.26em] text-[#57534E]"
              style={{ writingMode: 'vertical-rl' }}
            >
              {CHAPTERS[activeSlide].zhCaption}
            </span>
          </button>
        )}
      </div>

      {/* TOP-RIGHT: Minimal Calm Action Cluster (Chill BGM Toggle + Auth) */}
      <div className="fixed top-2.5 right-3.5 sm:top-5 sm:right-8 z-40 flex items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => {
            ambientBgm.toggle();
          }}
          aria-label={bgmPlaying ? 'Tắt nhạc nền thư giãn' : 'Bật nhạc nền thư giãn'}
          title={bgmPlaying ? 'Nhạc nền thư giãn: Đang phát (Bấm để tắt)' : 'Nhạc nền thư giãn: Đã tắt (Bấm để bật)'}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border shadow-xs backdrop-blur-sm flex items-center justify-center cursor-pointer transition-colors ${
            bgmPlaying
              ? 'bg-white text-[#1C1917] border-[#C41E3A]/35 hover:border-[#C41E3A]'
              : 'bg-white/85 text-[#57534E] border-[#1C1917]/15 hover:bg-white'
          }`}
        >
          <EqualizerBars active={bgmPlaying} />
        </button>

        <a
          href="#/login"
          onClick={handleNavigateAuth('#/login')}
          className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-full bg-white/90 hover:bg-white text-[#1C1917] hover:text-[#C41E3A] border border-[#1C1917]/15 shadow-xs backdrop-blur-sm text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center transition-colors"
        >
          Đăng nhập
        </a>

        <a
          href="#/login?tab=register"
          onClick={handleNavigateAuth('#/login?tab=register')}
          className="h-8 sm:h-9 px-3 sm:px-5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center shadow-xs transition-colors"
        >
          <span className="sm:hidden">Đăng ký</span>
          <span className="hidden sm:inline">Đăng ký miễn phí</span>
        </a>
      </div>

      {/* LEFT VERTICAL CHAPTER NAVIGATION RAIL */}
      <nav
        aria-label="Chuyển mục nội dung"
        className={`fixed left-5 sm:left-7 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-3 transition-opacity duration-300 ${
          isHero ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
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
                className={`block rounded-full transition-all duration-200 ${
                  active
                    ? 'w-[3px] h-7 bg-[#C41E3A]'
                    : 'w-[2.5px] h-3.5 bg-[#1C1917]/25 group-hover:bg-[#1C1917]/65 group-hover:h-5'
                }`}
              />
              <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-6 px-2.5 py-1 bg-[#1C1917] text-[#FCFBF8] text-[10.5px] font-medium whitespace-nowrap shadow-md">
                0{chap.id + 1} · {chap.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          1:1 WUTHERING WAVES 3.8 VERTICAL SWIPER (#page-swiper > .wuwa-swiper-wrapper)
          - Vertical flex column translating -100% * activeSlide over 800ms ease
          - Active slide toggles .an class for staggered left-slide & bottom-rise child entrances
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        id="page-swiper"
        style={{
          transform: showFooter
            ? 'translate3d(0, -136px, 0)'
            : isExitingToAuth
              ? 'translate3d(0, 0, 0) scale(1.045)'
              : 'translate3d(0, 0, 0) scale(1)',
          opacity: isExitingToAuth ? 0 : 1,
        }}
        className="relative w-full h-full overflow-hidden transition-all duration-[400ms] ease-out will-change-transform"
      >
        <div
          ref={swipeLayerRef}
          style={{
            transform: `translate3d(0px, -${activeSlide * 100}%, 0px)`,
          }}
          className="wuwa-swiper-wrapper"
        >
        {/* ────────────────────────────────────────────────────────────────
            SLIDE 0: CALM DAYLIGHT EDITORIAL HERO (HoYoverse 2.5D Desk Parallax × Sunbeams)
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 0}
          data-slide-idx={0}
          data-active-slide={activeSlide === 0 ? 'true' : undefined}
          className={`wuwa-page-slide overflow-hidden touch-none bg-[#F3EFE8] ${
            activeSlide === 0 && introLoaded ? 'an' : ''
          }`}
        >
          {/* Layer 1: 120fps 2.5D Perspective Mouse-Tracking Study Desk Photograph */}
          <div
            ref={heroBgRef}
            aria-hidden="true"
            style={{
              transform: 'perspective(1200px) scale(1.075)',
            }}
            className="pointer-events-none absolute inset-0 will-change-transform"
          >
            <img
              src="/images/editorial-hero-chinese.webp"
              alt=""
              decoding="async"
              className="w-full h-full object-cover object-right"
            />
          </div>

          {/* Layer 2 & 3: Afternoon Window Sunbeam Rays & Floating Golden Sunlit Dust Motes */}
          <SunbeamDustOverlay beamRef={heroBeamRef} dustRef={heroDustRef} />

          {/* Warm readability scrim (stronger on mobile portrait so smaller text stays razor-sharp) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[#F6F3ED]/68 sm:hidden"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden sm:block"
            style={{
              background:
                'linear-gradient(95deg, rgba(246, 243, 237, 0.94) 0%, rgba(246, 243, 237, 0.84) 38%, rgba(246, 243, 237, 0.18) 64%, rgba(246, 243, 237, 0) 100%)',
            }}
          />

          <ArchitecturalBlueprintGrid className="opacity-50 sm:opacity-65" />

          {/* Layer 4: Foreground Counter-Parallax Editorial Typography (.main-container.component.an) */}
          <div className="relative z-20 h-full max-w-[1380px] mx-auto px-5 sm:px-12 lg:px-20 pt-14 pb-16 flex flex-col justify-center">
            <div ref={heroContentRef} className="max-w-xl space-y-3.5 sm:space-y-6 will-change-transform">
              <div className="wuwa-hero-title space-y-2.5 sm:space-y-4">
                <div className="inline-flex items-center gap-2 sm:gap-3 text-[9.5px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[#C41E3A]">
                  <span className="w-4 sm:w-6 h-[1.5px] bg-[#C41E3A]" />
                  <span>HỌC TIẾNG TRUNG CHUẨN HSK 1 — 6</span>
                </div>

                <h1 className="font-display font-extrabold text-[24px] leading-[1.2] sm:text-5xl lg:text-[56px] sm:leading-[1.1] text-[#1C1917] tracking-[-0.025em] sm:tracking-[-0.028em]">
                  Học tiếng Trung bài bản từ{' '}
                  <span className="text-[#C41E3A]">những nét chữ đầu tiên</span>
                </h1>
              </div>

              <div className="wuwa-hero-cta space-y-3.5 sm:space-y-5">
                <p className="text-[13px] leading-[1.6] sm:text-[17px] sm:leading-relaxed text-[#44403C] max-w-lg">
                  Luyện phát âm chuẩn đủ <strong>63 âm Pinyin</strong>, tập viết chữ Hán đúng thứ tự
                  từng nét, ôn thẻ lật từ và giáo trình chuẩn HSK 1–6 trong không gian yên tĩnh, chỉ
                  15 phút mỗi ngày.
                </p>

                <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                  <a
                    href="#/login?tab=register"
                    onClick={handleNavigateAuth('#/login?tab=register')}
                    className="h-10 sm:h-12 px-4 sm:px-7 rounded-lg bg-[#C41E3A] hover:bg-[#A51730] text-white font-semibold text-[12px] sm:text-sm inline-flex items-center gap-1.5 sm:gap-2 shadow-[0_10px_24px_-8px_rgba(196,30,58,0.45)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Bắt đầu học miễn phí</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => goToSlide(1)}
                    className="h-10 sm:h-12 px-3.5 sm:px-6 rounded-lg bg-white/90 hover:bg-white text-[#1C1917] border border-[#1C1917]/20 hover:border-[#C41E3A]/50 font-semibold text-[12px] sm:text-sm inline-flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                  >
                    <span>Xem thử bài học</span>
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C41E3A]" />
                  </button>
                </div>

                <div className="pt-3.5 sm:pt-6 border-t border-[#1C1917]/15 flex items-center gap-x-2 sm:gap-x-6 text-[9.5px] sm:text-xs font-mono text-[#57534E] whitespace-nowrap">
                  <span>63 Âm Pinyin</span>
                  <span className="text-[#C41E3A]">·</span>
                  <span>9.500+ Nét chữ Hán</span>
                  <span className="text-[#C41E3A]">·</span>
                  <span>Giáo trình HSK 1–6</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => goToSlide(1)}
            className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 hover:bg-white border border-[#1C1917]/15 text-[10px] sm:text-[11px] font-mono text-[#57534E] hover:text-[#C41E3A] backdrop-blur-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="sm:hidden">Vuốt lên · Bài 01 Thanh điệu</span>
            <span className="hidden sm:inline">Cuộn xuống · Bài 01 Thanh điệu</span>
            <span className="relative inline-flex flex-col items-center justify-center w-3.5 h-4 -my-0.5">
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C41E3A] animate-wuwa-chevron-1 -mb-2" />
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C41E3A] animate-wuwa-chevron-2" />
            </span>
          </button>
        </section>

        {/* ────────────────────────────────────────────────────────────────
            SLIDE 1: 4 TONES & 63 PINYIN — CALM WATERCOLOR + PORCELAIN 3D (.role-container.component.an)
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 1}
          data-slide-idx={1}
          data-active-slide={activeSlide === 1 ? 'true' : undefined}
          className={`wuwa-page-slide overflow-y-auto no-scrollbar lg:overflow-hidden bg-[#F5F2EC] ${
            activeSlide === 1 ? 'an' : ''
          }`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-500 ease-out"
            style={{ backgroundImage: activeSpecimen.wash }}
          />
          <ArchitecturalBlueprintGrid />

          <div className="relative z-10 min-h-full lg:h-full max-w-[1360px] mx-auto px-4 sm:px-14 lg:pl-24 lg:pr-14 pt-[62px] pb-[64px] lg:pt-14 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 items-center gap-3 sm:gap-6">
            <div className="lg:col-span-5 flex flex-col justify-center space-y-3.5 sm:space-y-9 py-0.5 lg:py-2">
              <div className="wuwa-title-box flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C41E3A]">
                    01 · NGỮ ÂM PHỔ THÔNG
                  </span>
                  <h2 className="font-display font-extrabold text-[19px] leading-snug sm:text-4xl text-[#1C1917] tracking-tight mt-0.5 sm:mt-1">
                    Pinyin và 4 Thanh điệu
                  </h2>
                </div>

                {/* Mobile 2-Mode Switcher (Visible on phones < 640px) */}
                <div className="flex sm:hidden items-center gap-1.5 pt-0.5 shrink-0">
                  {[
                    { id: 'medallion' as const, label: 'Chữ Hán' },
                    { id: 'curves' as const, label: 'Thanh điệu' },
                  ].map((m) => {
                    const active = slide1Mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSlide1Mode(m.id)}
                        className="px-2.5 py-1.5 rounded-md text-[10px] font-mono font-semibold border cursor-pointer transition-colors"
                        style={{
                          backgroundColor: active ? '#1C1917' : '#FFFFFF',
                          borderColor: active ? '#1C1917' : 'rgba(28, 25, 23, 0.16)',
                          color: active ? '#FFFFFF' : '#1C1917',
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="wuwa-intr-box space-y-2 sm:space-y-4">
                <p className="font-sans text-[11.5px] sm:text-[13px] font-semibold text-[#57534E]">
                  {activeSpecimen.phonetic}
                </p>

                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  <PronunciationPlayButton
                    onClick={() => speakChinese(activeSpecimen.hanzi, 0.72, 'tone')}
                    active={speakingScope === 'tone'}
                    accentColor={activeSpecimen.accent}
                    label={`Nghe phát âm ${activeSpecimen.pinyin}`}
                  />
                  <div>
                    <h3 className="font-display font-extrabold text-[19px] sm:text-[34px] text-[#1C1917] leading-none">
                      {activeSpecimen.toneLabel} ·{' '}
                      <span className="font-pinyin">{activeSpecimen.pinyin}</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs font-medium text-[#57534E] mt-1 sm:mt-1.5">
                      {activeSpecimen.sino}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-2 bg-white/85 border border-[#1C1917]/15 text-[11px] sm:text-xs">
                  <span className="font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                    Ví dụ:
                  </span>
                  <span className="font-semibold text-[#1C1917]">
                    <span className="font-hanzi-serif">{activeSpecimen.compoundHanzi}</span>{' '}
                    <span className="font-pinyin">({activeSpecimen.compoundPinyin})</span> ·{' '}
                    {activeSpecimen.compoundVi}
                  </span>
                </div>

                <p className="text-[12px] leading-[1.55] sm:text-sm sm:leading-relaxed text-[#44403C] max-w-md">
                  {activeSpecimen.lore}
                </p>
              </div>

              <div className="wuwa-avatar-nav space-y-1.5 sm:space-y-2.5">
                <p className="text-[9.5px] sm:text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[#78716C]">
                  Chọn thanh điệu để nghe phát âm
                </p>
                <div className="flex items-center gap-2 sm:gap-2.5">
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
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center cursor-pointer border transition-transform duration-150"
                        style={{
                          backgroundColor: selected ? '#1C1917' : 'rgba(255,255,255,0.9)',
                          borderColor: selected ? spec.accent : 'rgba(28,25,23,0.16)',
                          color: selected ? '#FFFFFF' : '#1C1917',
                          transform: selected ? 'scale(1.06)' : 'scale(1)',
                        }}
                      >
                        <span className="font-hanzi-serif text-base sm:text-xl font-bold leading-none">
                          {spec.hanzi}
                        </span>
                        <span
                          className="text-[8.5px] sm:text-[10px] font-pinyin font-bold mt-0.5"
                          style={{ color: selected ? '#F2D16B' : '#78716C' }}
                        >
                          {spec.pinyin}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="wuwa-stage-box lg:col-span-7 relative h-[225px] sm:h-[400px] lg:h-[580px] flex flex-col items-center justify-center">
              <div className="relative z-10 w-full flex-1 min-h-0">
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    slide1Mode === 'medallion'
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {isWarm(1) && (
                  <ThreeMinimalZenSculpture
                    activeHanzi={activeSpecimen.hanzi}
                    activePinyin={activeSpecimen.pinyin}
                    accentHex={activeSpecimen.accent}
                    isActive={activeSlide === 1 && slide1Mode === 'medallion'}
                    className="w-full h-full"
                  />
                  )}
                </div>
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    slide1Mode === 'curves'
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {slide1Mode === 'curves' && (
                  <ThreeStudyDioramaStage
                    activeScene={0}
                    activeToneIdx={activeSpecimen.toneIdx}
                    activeStrokeChar={activeSpecimen.hanzi}
                    activeStrokePinyin={activeSpecimen.pinyin}
                    activeStrokeCount={6}
                    flippedCards={{}}
                    activeCardIdx={0}
                    activeHskLevel={1}
                    isActive={activeSlide === 1 && slide1Mode === 'curves'}
                    enabledScenes={[0]}
                    theme="light"
                    className="w-full h-full"
                  />
                  )}
                </div>
              </div>

              <span className="pointer-events-none relative z-20 mt-1 sm:mt-0 sm:absolute sm:bottom-2 sm:left-1/2 sm:-translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/85 backdrop-blur-sm border border-[#1C1917]/10 text-[10px] sm:text-[10.5px] font-mono text-[#57534E]">
                <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C41E3A]" />
                {slide1Mode === 'medallion' ? 'Kéo để xoay chữ' : 'Kéo để xoay góc nhìn'}
              </span>

              <div className="hidden sm:flex flex-col gap-1.5 absolute right-0 top-1/2 -translate-y-1/2 z-20">
                {[
                  { id: 'medallion' as const, label: 'Chữ Hán', glyph: '字' },
                  { id: 'curves' as const, label: 'Thanh điệu', glyph: '声' },
                ].map((m) => {
                  const active = slide1Mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSlide1Mode(m.id)}
                      className="w-[74px] py-2.5 px-1.5 border flex flex-col items-center justify-center gap-1 cursor-pointer"
                      style={{
                        backgroundColor: active ? '#1C1917' : 'rgba(255, 255, 255, 0.92)',
                        borderColor: active ? '#1C1917' : 'rgba(28, 25, 23, 0.16)',
                        color: active ? '#FFFFFF' : '#1C1917',
                      }}
                    >
                      <span
                        className="font-hanzi-serif text-base font-bold leading-none"
                        style={{ color: active ? '#F2D16B' : '#C41E3A' }}
                      >
                        {m.glyph}
                      </span>
                      <span className="text-[9.5px] font-mono font-semibold text-center leading-tight">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
            SLIDE 2: CALLIGRAPHY & STROKE ORDER — REAL XUAN PAPER + 3D SLAB (.skin-show.component.an)
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 2}
          data-slide-idx={2}
          data-active-slide={activeSlide === 2 ? 'true' : undefined}
          className={`wuwa-page-slide overflow-y-auto no-scrollbar lg:overflow-hidden bg-[#F5F2EC] ${
            activeSlide === 2 ? 'an' : ''
          }`}
        >
          <ArchitecturalBlueprintGrid />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[68%] overflow-hidden"
            style={{
              WebkitMaskImage:
                'linear-gradient(96deg, transparent 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0.92) 48%, #000 100%)',
              maskImage:
                'linear-gradient(96deg, transparent 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0.92) 48%, #000 100%)',
            }}
          >
            <div
              ref={calligraphyBgRef}
              className="w-full h-full will-change-transform"
              style={{ transform: 'scale(1.05)' }}
            >
              <img
                src="/images/intro-hanzi-notebook.webp"
                alt=""
                decoding="async"
                className="w-full h-full object-cover object-center opacity-35 lg:opacity-90"
              />
            </div>
          </div>

          <div className="relative z-10 min-h-full lg:h-full max-w-[1360px] mx-auto px-4 sm:px-14 lg:pl-24 lg:pr-10 pt-[62px] pb-[64px] lg:pt-14 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 items-center gap-3 sm:gap-6">
            <div className="lg:col-span-5 space-y-3 sm:space-y-7">
              <div className="wuwa-title-box">
                <span className="font-mono text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C41E3A]">
                  02 · QUY TẮC & THỨ TỰ NÉT
                </span>
                <h2 className="font-display font-extrabold text-[19px] leading-snug sm:text-4xl text-[#1C1917] tracking-tight mt-0.5 sm:mt-1">
                  Luyện viết chữ Hán
                </h2>
              </div>

              <div className="wuwa-intr-box">
                <EditorialPaperFrame className="p-3.5 sm:p-6 max-w-md shadow-[0_20px_48px_-24px_rgba(28,25,23,0.18)]">
                <div className="flex items-start justify-between gap-2.5 sm:gap-4 pb-2.5 sm:pb-4 border-b border-[#1C1917]/10">
                  <div>
                    <span className="text-[9.5px] sm:text-[10.5px] font-sans font-bold uppercase tracking-wider text-[#C41E3A]">
                      {activeCalligraphy.strokes} NÉT · HÁN-VIỆT: {activeCalligraphy.sino.toUpperCase()}
                    </span>
                    <h3 className="font-display text-[16px] sm:text-2xl font-bold text-[#1C1917] mt-0.5 sm:mt-1 leading-snug">
                      {activeCalligraphy.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs font-medium text-[#57534E] mt-0.5">
                      <span className="font-hanzi-serif font-bold">{activeCalligraphy.char}</span>{' '}
                      <span className="font-pinyin font-semibold">({activeCalligraphy.pinyin})</span> · Nghĩa:{' '}
                      {activeCalligraphy.meaning}
                    </p>
                  </div>
                  <PronunciationPlayButton
                    onClick={() => speakChinese(activeCalligraphy.char, 0.75, 'calligraphy')}
                    active={speakingScope === 'calligraphy'}
                    accentColor="#C41E3A"
                    label={`Nghe đọc ${activeCalligraphy.char}`}
                  />
                </div>

                <p className="text-[12px] leading-[1.55] sm:text-sm sm:leading-relaxed text-[#44403C] py-2 sm:py-4">
                  {activeCalligraphy.desc}
                </p>

                <div className="pt-2 sm:pt-3 border-t border-[#1C1917]/10">
                  <p className="text-[9.5px] sm:text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[#78716C] mb-1.5 sm:mb-2">
                    Chọn chữ mẫu
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
                          className="py-1.5 sm:py-2.5 border text-center cursor-pointer transition-colors"
                          style={{
                            backgroundColor: selected ? '#C41E3A' : '#FFFFFF',
                            borderColor: selected ? '#C41E3A' : 'rgba(28,25,23,0.16)',
                            color: selected ? '#FFFFFF' : '#1C1917',
                          }}
                        >
                          <span className="font-hanzi-serif text-lg sm:text-2xl font-bold block leading-none">
                            {item.char}
                          </span>
                          <span
                            className="text-[9.5px] sm:text-[10.5px] font-pinyin font-semibold mt-1 block"
                            style={{ color: selected ? '#FDE68A' : '#78716C' }}
                          >
                            {item.pinyin}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                </EditorialPaperFrame>
              </div>
            </div>

            <div className="wuwa-stage-box lg:col-span-5 relative min-h-[275px] sm:min-h-[390px] lg:h-[470px] flex flex-col items-center justify-center">
              {calligraphyPracticeMode ? (
                <InteractiveTianZiGeBoard
                  char={activeCalligraphy.char}
                  pinyin={activeCalligraphy.pinyin}
                  strokes={activeCalligraphy.strokes}
                  onExitTo3D={() => setCalligraphyPracticeMode(false)}
                />
              ) : (
                <>
                  <div className="w-full max-w-[400px] h-[215px] sm:h-[345px] lg:h-[420px]">
                    {isWarm(2) && (
                    <ThreeStudyDioramaStage
                      activeScene={1}
                      activeToneIdx={0}
                      activeStrokeChar={activeCalligraphy.char}
                      activeStrokePinyin={activeCalligraphy.pinyin}
                      activeStrokeCount={activeCalligraphy.strokes}
                      flippedCards={{}}
                      activeCardIdx={0}
                      activeHskLevel={1}
                      isActive={activeSlide === 2 && !calligraphyPracticeMode}
                      enabledScenes={[1]}
                      onTabletClick={() => setCalligraphyPracticeMode(true)}
                      theme="light"
                      className="w-full h-full"
                    />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setCalligraphyPracticeMode(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white text-[10.5px] sm:text-[11px] font-mono font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <PenTool className="w-3 h-3" />
                      <span>Bấm ô chữ để tập viết</span>
                    </button>
                    <span className="pointer-events-none inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm border border-[#1C1917]/10 text-[10px] font-mono text-[#57534E]">
                      <Move className="w-3 h-3 text-[#C41E3A]" />
                      <span>Kéo để xoay</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
            SLIDE 3: EDITORIAL CURRICULUM GALLERY & FILMSTRIP (.activity-container.component.an)
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 3}
          data-slide-idx={3}
          data-active-slide={activeSlide === 3 ? 'true' : undefined}
          className={`wuwa-page-slide overflow-y-auto no-scrollbar lg:overflow-hidden bg-[#F5F2EC] ${
            activeSlide === 3 ? 'an' : ''
          }`}
        >
          <ArchitecturalBlueprintGrid />

          <div className="relative z-10 min-h-full lg:h-full max-w-[1080px] mx-auto px-4 sm:px-14 pt-[62px] pb-[64px] lg:pt-12 lg:pb-16 flex flex-col justify-center gap-3 sm:gap-4">
            <MuseumExhibitionFrame
              chapterLabel="03 · CHƯƠNG TRÌNH HỌC"
              title="Hệ thống bài học HSK chuẩn cho người Việt"
              className="wuwa-intr-box w-full"
            >
              <div className="relative min-h-[345px] sm:h-[420px] lg:h-[450px] w-full bg-[#1C1917]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCurriculum.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="relative sm:absolute sm:inset-0 w-full min-h-[345px] sm:h-full flex"
                  >
                    <img
                      src={activeCurriculum.image}
                      alt={activeCurriculum.title}
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/95 via-[#1C1917]/78 to-[#1C1917]/48 sm:bg-gradient-to-r sm:from-[#1C1917]/25 sm:via-[#1C1917]/65 sm:to-[#1C1917]/95"
                    />

                    <div className="relative z-10 w-full flex items-end sm:items-center justify-end p-4 pb-12 sm:p-10">
                      <div className="max-w-md w-full space-y-2.5 sm:space-y-4 text-white">
                        <span className="inline-block px-2 py-0.5 bg-[#C41E3A] text-white font-mono text-[9.5px] sm:text-[10.5px] font-semibold tracking-[0.12em] sm:tracking-[0.14em] uppercase">
                          {activeCurriculum.tag}
                        </span>

                        <h3 className="font-display text-[18px] sm:text-3xl font-bold leading-snug sm:leading-tight">
                          {activeCurriculum.title}
                        </h3>

                        <p className="text-[12px] leading-[1.55] sm:text-sm sm:leading-relaxed text-white/88">
                          {activeCurriculum.summary}
                        </p>

                        {activeCurriculum.id !== 'quiz' ? (
                          <div className="pt-1 sm:pt-2 space-y-2.5 sm:space-y-3">
                            <div className="flex flex-wrap gap-1.5 sm:grid sm:grid-cols-3 sm:gap-2">
                              {activeCurriculum.points.map((pt) => (
                                <div
                                  key={pt}
                                  className="px-2.5 py-1 sm:py-2 border border-white/20 bg-black/40 backdrop-blur-sm text-[10.5px] sm:text-[11px] font-medium text-white/95 sm:text-center"
                                >
                                  {pt}
                                </div>
                              ))}
                            </div>
                            <a
                              href="#/login?tab=register"
                              onClick={handleNavigateAuth('#/login?tab=register')}
                              className="inline-flex items-center gap-1.5 text-[11.5px] sm:text-xs font-semibold text-[#FDE68A] hover:text-white transition-colors pt-0.5"
                            >
                              <span>Đăng ký mở khóa miễn phí</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="space-y-2.5 sm:space-y-3 pt-1">
                            <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1.5 sm:pb-2">
                              <p className="text-[12.5px] sm:text-sm font-semibold">
                                Câu <span className="font-hanzi-serif text-base sm:text-lg text-[#FDE68A]">「你好吗？」</span> nghĩa là gì?
                              </p>
                              <button
                                type="button"
                                onClick={() => speakChinese('你好吗', 0.78)}
                                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono text-[#FDE68A] hover:text-white cursor-pointer shrink-0"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Nghe</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
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
                                    className={`px-3 py-2 border text-left text-[11.5px] sm:text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                                      answered
                                        ? opt.ok
                                          ? 'bg-[#157A57] border-[#157A57] text-white'
                                          : picked
                                            ? 'bg-[#C41E3A] border-[#C41E3A] text-white'
                                            : 'bg-white/10 border-white/15 text-white/50'
                                        : 'bg-black/45 hover:bg-white/15 border-white/25 text-white'
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
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Mobile bottom-right arrows (never overlap text) vs Desktop side arrows */}
                <button
                  type="button"
                  onClick={() =>
                    setCurriculumIdx((p) => (p - 1 + CURRICULUM_SLIDES.length) % CURRICULUM_SLIDES.length)
                  }
                  aria-label="Mục trước"
                  className="absolute bottom-2.5 right-12 sm:bottom-auto sm:right-auto sm:left-3 sm:top-1/2 sm:-translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 bg-black/55 hover:bg-[#C41E3A] text-white border border-white/25 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurriculumIdx((p) => (p + 1) % CURRICULUM_SLIDES.length)}
                  aria-label="Mục tiếp theo"
                  className="absolute bottom-2.5 right-2.5 sm:bottom-auto sm:right-3 sm:top-1/2 sm:-translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 bg-black/55 hover:bg-[#C41E3A] text-white border border-white/25 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </MuseumExhibitionFrame>

            <div className="wuwa-avatar-nav no-chapter-swipe flex items-center justify-start sm:justify-center gap-2 sm:gap-3 w-full overflow-x-auto no-scrollbar py-1">
              {CURRICULUM_SLIDES.map((slide, idx) => {
                const active = idx === curriculumIdx;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurriculumIdx(idx)}
                    className={`relative w-28 sm:w-36 h-[54px] sm:h-[72px] shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                      active
                        ? 'border-[#C41E3A] shadow-md'
                        : 'border-[#1C1917]/15 opacity-75 hover:opacity-100 hover:border-[#1C1917]/40'
                    }`}
                  >
                    <img
                      src={slide.image}
                      alt={slide.thumbLabel}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <span className="absolute bottom-1 sm:bottom-1.5 inset-x-1.5 sm:inset-x-2 text-[9.5px] sm:text-[10px] font-mono font-semibold text-white truncate text-left">
                      0{idx + 1} · {slide.thumbLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
            SLIDE 4: FRAMELESS OPEN-CANVAS 3D "THẺ LẬT TỪ" & "SÁCH GIÁO TRÌNH HSK 1 → 6"
            (Zero enclosing box frame, zero bottom button bar, zero bottom text, click 3D objects directly!)
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 4}
          data-slide-idx={4}
          data-active-slide={activeSlide === 4 ? 'true' : undefined}
          className={`wuwa-page-slide overflow-y-auto no-scrollbar lg:overflow-hidden bg-[#F5F2EC] ${
            activeSlide === 4 ? 'an' : ''
          }`}
        >
          <ArchitecturalBlueprintGrid />

          <div className="relative z-10 min-h-full lg:h-full max-w-[1360px] mx-auto px-4 sm:px-14 lg:pl-24 lg:pr-12 pt-[62px] pb-[64px] lg:pt-16 lg:pb-16 flex flex-col justify-between gap-2.5 sm:gap-0">
            {/* TOP BAR: Clean Frameless Header & Mode Switcher */}
            <div className="wuwa-title-box flex flex-wrap items-center justify-between gap-2 sm:gap-4">
              <div>
                <span className="font-mono text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C41E3A]">
                  04 · TRẢI NGHIỆM TRỰC QUAN
                </span>
                <h2 className="font-display font-extrabold text-[18px] leading-snug sm:text-3xl text-[#1C1917] tracking-tight mt-0.5">
                  {studioMode === 'cards' ? 'Thẻ lật từ' : 'Giáo trình chuẩn HSK 1 → 6'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStudioMode('cards')}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: studioMode === 'cards' ? '#1C1917' : 'rgba(255,255,255,0.9)',
                    borderColor: studioMode === 'cards' ? '#1C1917' : 'rgba(28,25,23,0.18)',
                    color: studioMode === 'cards' ? '#FFFFFF' : '#1C1917',
                  }}
                >
                  Thẻ lật từ
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode('hsk')}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: studioMode === 'hsk' ? '#1C1917' : 'rgba(255,255,255,0.9)',
                    borderColor: studioMode === 'hsk' ? '#1C1917' : 'rgba(28,25,23,0.18)',
                    color: studioMode === 'hsk' ? '#FFFFFF' : '#1C1917',
                  }}
                >
                  <span className="sm:hidden">Giáo trình HSK</span>
                  <span className="hidden sm:inline">Sách giáo trình HSK 1 → 6</span>
                </button>
              </div>
            </div>

            {/* FRAMELESS OPEN-CANVAS 3D STAGE + OPTIONAL BOOK DETAIL DRAWER */}
            <div className="wuwa-stage-box relative flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 items-center gap-3 sm:gap-6 my-0.5 sm:my-2">
              {/* Open Frameless 3D Canvas (Full 12 cols in Flashcard mode, 8 cols in HSK Book mode) */}
              <div
                className={`relative transition-all duration-300 ${
                  studioMode === 'cards'
                    ? 'h-[360px] sm:h-[460px] lg:h-[520px] lg:col-span-12'
                    : 'h-[195px] sm:h-[330px] lg:h-[520px] lg:col-span-8'
                }`}
              >
                {isWarm(4) && (
                <ThreeStudyDioramaStage
                  activeScene={studioMode === 'cards' ? 2 : 3}
                  activeToneIdx={0}
                  activeStrokeChar="汉"
                  activeStrokePinyin="hàn"
                  activeStrokeCount={5}
                  flippedCards={flippedCards}
                  activeCardIdx={activeCardIdx}
                  activeHskLevel={activeHskLevel}
                  isActive={activeSlide === 4}
                  enabledScenes={[2, 3]}
                  onCardClick={handleDirectCardClick}
                  onBookClick={handleDirectBookClick}
                  theme="light"
                  className="w-full h-full"
                />
                )}

                {/* Subtle Frameless Hint Pill */}
                <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-white/85 backdrop-blur-sm border border-[#1C1917]/10 text-[9.5px] sm:text-[11px] font-mono text-[#57534E] whitespace-nowrap max-w-[92vw] overflow-hidden text-ellipsis">
                  <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C41E3A] shrink-0" />
                  <span className="truncate">
                    {studioMode === 'cards'
                      ? 'Chạm thẻ để lật và nghe · Kéo để xoay'
                      : 'Chọn sách để xem chi tiết · Kéo để xoay'}
                  </span>
                </div>
              </div>

              {/* HSK Textbook Information Card (Appears cleanly on the right when in Book mode) */}
              {studioMode === 'hsk' && (
                <div className="lg:col-span-4 flex flex-col justify-center">
                  <EditorialPaperFrame className="p-3 sm:p-6 shadow-[0_20px_48px_-24px_rgba(28,25,23,0.18)]">
                    <div className="space-y-2.5 sm:space-y-4">
                      <div className="flex items-start gap-2.5 sm:gap-4 pb-2 sm:pb-3.5 border-b border-[#1C1917]/10">
                      <img
                        src={activeBook.cover}
                        alt={activeBook.title}
                        decoding="async"
                        className="w-11 h-[60px] sm:w-16 sm:h-[88px] object-cover rounded-[3px] border border-[#1C1917]/15 shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <span
                          className="inline-block px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-white uppercase"
                          style={{ backgroundColor: activeBook.accent }}
                        >
                          {activeBook.zhTitle}
                        </span>
                        <h3 className="font-display font-bold text-[15px] sm:text-xl text-[#1C1917] mt-0.5 sm:mt-1 leading-snug">
                          {activeBook.title}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-[#78716C] mt-0.5">{activeBook.author}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
                      <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#F5F2EC] border border-[#1C1917]/10">
                        <span className="text-[9px] sm:text-[10px] font-mono uppercase text-[#78716C] block">
                          Từ vựng chuẩn
                        </span>
                        <strong className="text-[#1C1917] font-semibold">{activeBook.words}</strong>
                      </div>
                      <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#F5F2EC] border border-[#1C1917]/10">
                        <span className="text-[9px] sm:text-[10px] font-mono uppercase text-[#78716C] block">
                          Cấu trúc sách
                        </span>
                        <strong className="text-[#1C1917] font-semibold">{activeBook.lessons}</strong>
                      </div>
                    </div>

                    <p className="text-[11.5px] leading-[1.55] sm:text-[13px] sm:leading-relaxed text-[#44403C]">
                      {activeBook.desc}
                    </p>

                    <div className="hidden sm:flex flex-wrap gap-1.5">
                      {activeBook.topics.map((tp) => (
                        <span
                          key={tp}
                          className="px-2.5 py-1 bg-white border border-[#1C1917]/12 text-[11px] font-medium text-[#1C1917]"
                        >
                          {tp}
                        </span>
                      ))}
                    </div>

                    {/* Quick 1–6 Book Selector Pills + Direct Study CTA */}
                    <div className="pt-2 sm:pt-3 border-t border-[#1C1917]/10 space-y-2 sm:space-y-3">
                      <div className="grid grid-cols-6 gap-1.5">
                        {HSK_TEXTBOOKS.map((b) => {
                          const selected = b.level === activeHskLevel;
                          return (
                            <button
                              key={b.level}
                              type="button"
                              onClick={() => setActiveHskLevel(b.level)}
                              className="py-1.5 font-mono text-[10px] sm:text-[11px] font-bold border cursor-pointer transition-colors"
                              style={{
                                backgroundColor: selected ? b.accent : '#FFFFFF',
                                borderColor: selected ? b.accent : 'rgba(28,25,23,0.16)',
                                color: selected ? '#FFFFFF' : '#1C1917',
                              }}
                            >
                              HSK {b.level}
                            </button>
                          );
                        })}
                      </div>

                      <a
                        href="#/login?tab=register"
                        onClick={handleNavigateAuth('#/login?tab=register')}
                        className="w-full h-9 sm:h-10 rounded-md bg-[#C41E3A] hover:bg-[#A51730] text-white text-[11.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Học {activeBook.title} miễn phí</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    </div>
                  </EditorialPaperFrame>
                </div>
              )}
            </div>
          </div>
        </section>
        </div>

        {/* ── QUIET EDITORIAL CHAPTER STATUS BAR (Includes Ergonomic Mobile Thumb Switcher) ── */}
        <div
          className={`fixed bottom-0 inset-x-0 z-30 h-12 sm:h-11 bg-[#F4F0E9]/95 backdrop-blur-md border-t border-[#1C1917]/10 px-3.5 sm:px-10 flex items-center justify-between gap-2 sm:gap-4 transition-opacity duration-300 ${
            isHero ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 text-[10.5px] sm:text-[11px] font-mono text-[#57534E]">
            <span className="font-bold text-[#C41E3A]">0{activeSlide + 1} / 05</span>
            <span className="hidden sm:inline text-[#1C1917]/25">|</span>
            <span className="hidden sm:inline font-medium text-[#1C1917]">
              {CHAPTERS[activeSlide].label}
            </span>
          </div>

          {/* Mobile Thumb Prev/Next Chapter Buttons (Ergonomic 36px targets with 8px gap) */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => stepChapter(-1)}
              aria-label="Bài trước"
              className="w-9 h-8 rounded-md border border-[#1C1917]/15 bg-white flex items-center justify-center text-[#1C1917] active:bg-[#C41E3A] active:text-white cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => stepChapter(1)}
              aria-label="Bài tiếp theo"
              className="w-9 h-8 rounded-md border border-[#1C1917]/15 bg-white flex items-center justify-center text-[#1C1917] active:bg-[#C41E3A] active:text-white cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <a
            href="#/login?tab=register"
            onClick={handleNavigateAuth('#/login?tab=register')}
            className="text-[11px] sm:text-xs font-semibold text-[#C41E3A] hover:text-[#9E162E] inline-flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap"
          >
            <span className="sm:hidden">Học miễn phí</span>
            <span className="hidden sm:inline">Bắt đầu học miễn phí</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-UP EDITORIAL FOOTER DRAWER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer
        className={`fixed bottom-0 inset-x-0 min-h-[124px] py-3.5 sm:py-0 sm:h-[136px] z-50 bg-[#FCFBF8] text-[#1C1917] border-t border-[#1C1917]/15 px-4 sm:px-10 flex items-center transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
          showFooter ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <HanziLogoMark variant="light" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <div className="leading-snug">
              <p className="font-display font-bold text-[12.5px] sm:text-sm text-[#1C1917]">
                Hanzi<span className="text-[#C41E3A]">4U</span> · Tự học tiếng Trung HSK 1–6
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#57534E]">
                © 2026 Hanzi4U (hanzi4u.id.vn) · Pinyin · Chữ Hán · Giáo trình HSK
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 text-[11.5px] sm:text-xs font-semibold text-[#1C1917]">
            <a
              href="#/login?tab=register"
              onClick={handleNavigateAuth('#/login?tab=register')}
              className="hover:text-[#C41E3A] transition-colors"
            >
              Đăng ký miễn phí
            </a>
            <a
              href="#/login"
              onClick={handleNavigateAuth('#/login')}
              className="hover:text-[#C41E3A] transition-colors"
            >
              Đăng nhập
            </a>
            <button
              type="button"
              onClick={() => goToSlide(0)}
              className="text-[#57534E] hover:text-[#C41E3A] transition-colors cursor-pointer"
            >
              Về đầu trang ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
