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
} from 'lucide-react';
import { ThreeMinimalZenSculpture } from '../../components/three/ThreeMinimalZenSculpture';
import { ThreeStudyDioramaStage } from '../../components/three/ThreeStudyDioramaStage';
import { HanziLogo, HanziLogoMark } from '../../components/HanziLogo';
import {
  ArchitecturalBlueprintGrid,
  EditorialPaperFrame,
  MuseumExhibitionFrame,
  PronunciationPlayButton,
  EqualizerBars,
} from '../../components/landing/ArchitecturalOrnaments';
import { ambientBgm } from '../../lib/ambientMusic';

/* ── CHAPTERS & AUTHENTIC CHINESE LINGUISTIC CONTENT ── */
const CHAPTERS = [
  { id: 0, code: '序', label: 'Mở đầu', zhCaption: '汉语入门' },
  { id: 1, code: '一', label: 'Thanh điệu & Pinyin', zhCaption: '第一课 · 声调' },
  { id: 2, code: '二', label: 'Nét chữ Điền Tự Cách', zhCaption: '第二课 · 书写' },
  { id: 3, code: '三', label: 'Chương trình HSK', zhCaption: '第三课 · 课程' },
  { id: 4, code: '四', label: 'Thẻ lật từ & Giáo trình HSK', zhCaption: '第四课 · 教材' },
];

const SPECIMEN_TONES = [
  {
    hanzi: '妈',
    pinyin: 'mā',
    title: 'Thanh 1 · mā',
    phonetic: '阴平 · Cao độ 55 (Ngang cao)',
    sino: 'Hán-Việt: Mẫu (Mẹ)',
    compound: '妈妈 (māma) · Mẹ',
    lore: 'Giữ cao độ ổn định và đều hơi từ đầu đến cuối âm tiết. Nền tảng để người Việt phân biệt rõ ràng các thanh điệu ngay từ buổi học đầu tiên.',
    accent: '#157A57',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(21, 122, 87, 0.14) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 0,
  },
  {
    hanzi: '麻',
    pinyin: 'má',
    title: 'Thanh 2 · má',
    phonetic: '阳平 · Cao độ 35 (Đi lên)',
    sino: 'Hán-Việt: Ma (Cây gai · Tê)',
    compound: '麻烦 (máfán) · Phiền phức',
    lore: 'Lên giọng dứt khoát từ quãng giữa lên cao, gần với dấu sắc tiếng Việt nhưng thoáng và đều hơi hơn, không ngắt đột ngột ở cuối âm.',
    accent: '#C41E3A',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(196, 30, 58, 0.13) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 1,
  },
  {
    hanzi: '马',
    pinyin: 'mǎ',
    title: 'Thanh 3 · mǎ',
    phonetic: '上声 · Cao độ 214 (Trầm rồi lên)',
    sino: 'Hán-Việt: Mã (Con ngựa)',
    compound: '马上 (mǎshàng) · Ngay lập tức',
    lore: 'Hạ trầm xuống đáy giọng rồi uốn nhẹ lên ở cuối. Khi đi liền hai thanh 3, âm đầu tự biến điệu sang thanh 2 giúp câu nói tự nhiên hơn.',
    accent: '#B5841A',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(181, 132, 26, 0.15) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 2,
  },
  {
    hanzi: '骂',
    pinyin: 'mà',
    title: 'Thanh 4 · mà',
    phonetic: '去声 · Cao độ 51 (Xuống mạnh)',
    sino: 'Hán-Việt: Mạ (Trách mắng)',
    compound: '谢谢 (xièxie) · Cảm ơn',
    lore: 'Rơi nhanh, gọn và dứt khoát từ quãng cao xuống thấp trong một nhịp ngắn, mang lại độ chắc và rõ ràng cho âm tiết tiếng Phổ thông.',
    accent: '#7F1D1D',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(127, 29, 29, 0.13) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 3,
  },
  {
    hanzi: '汉',
    pinyin: 'hàn',
    title: 'Hán tự · hàn',
    phonetic: '汉语 · Hệ thống 63 âm Pinyin',
    sino: 'Hán-Việt: Hán (Chữ Hán)',
    compound: '汉语 (Hànyǔ) · Tiếng Hán',
    lore: 'Hệ thống đủ 23 thanh mẫu, 24 vận mẫu và 16 âm tiết đọc thẳng — kết nối trực tiếp mặt chữ tượng hình, cách phát âm và âm Hán-Việt quen thuộc.',
    accent: '#1C1917',
    wash: 'radial-gradient(ellipse 75% 55% at 72% 14%, rgba(28, 25, 23, 0.1) 0%, rgba(245, 242, 236, 0) 70%)',
    toneIdx: 3,
  },
];

const CALLIGRAPHY_SPECIMENS = [
  {
    char: '永',
    pinyin: 'yǒng',
    sino: 'Vĩnh',
    strokes: 5,
    title: 'Chữ 永 · 8 nét căn bản',
    desc: 'Một chữ duy nhất hội tụ đầy đủ quy tắc viết chữ Hán: chấm, ngang, sổ, móc, hất, phẩy dài, phẩy ngắn và mác — nền tảng trước khi luyện viết mọi bộ thủ.',
  },
  {
    char: '学',
    pinyin: 'xué',
    sino: 'Học',
    strokes: 8,
    title: 'Chữ 学 · Chiết tự dễ nhớ',
    desc: 'Viết theo thứ tự từ trên xuống dưới, ba nét chấm mở đầu rồi đến bộ Mịch (冖) và bộ Tử (子) — giúp người học ghi nhớ cấu trúc chữ thay vì học thuộc lòng.',
  },
  {
    char: '好',
    pinyin: 'hǎo',
    sino: 'Hảo',
    strokes: 6,
    title: 'Chữ 好 · Kết cấu trái – phải',
    desc: 'Ghép từ bộ Nữ (女) bên trái và bộ Tử (子) bên phải. Ô Điền Tự Cách giúp canh chính xác tỷ lệ hai vế để nét viết cân đối và đẹp mắt.',
  },
  {
    char: '中',
    pinyin: 'zhōng',
    sino: 'Trung',
    strokes: 4,
    title: 'Chữ 中 · Trục đối xứng giữa',
    desc: 'Viết khung 口 trước rồi kéo nét sổ thẳng chia đôi tâm ô vuông sau cùng — quy tắc kinh điển "vào trước đóng sau, sổ giữa sau cùng".',
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
    title: 'Ô Điền Tự Cách & thứ tự nét chuẩn',
    image: '/images/intro-hanzi-notebook.webp',
    thumbLabel: 'Điền Tự Cách',
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
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [bgmPlaying, setBgmPlaying] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [heroParallax, setHeroParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Slide 1 (Phonetics & 4 Tones)
  const [specimenIdx, setSpecimenIdx] = useState<number>(1);
  const [slide1Mode, setSlide1Mode] = useState<'medallion' | 'curves'>('medallion');

  // Slide 2 (Calligraphy & TianZiGe)
  const [calligraphyIdx, setCalligraphyIdx] = useState<number>(0);

  // Slide 3 (Curriculum Gallery)
  const [curriculumIdx, setCurriculumIdx] = useState<number>(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);

  // Slide 4 (Frameless 3D Flashcards & Real 3D HSK 1-6 Textbooks)
  const [studioMode, setStudioMode] = useState<'cards' | 'hsk'>('cards');
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [activeHskLevel, setActiveHskLevel] = useState<number>(1);

  // 1:1 WuWa-Grade Wheel / Trackpad Gesture State
  const wheelStateRef = useRef({
    lockUntil: 0,
    lastEventTime: 0,
    lastAbsDelta: 0,
  });
  const touchStartYRef = useRef<number | null>(null);

  const activeSpecimen = SPECIMEN_TONES[specimenIdx];
  const activeCalligraphy = CALLIGRAPHY_SPECIMENS[calligraphyIdx];
  const activeCurriculum = CURRICULUM_SLIDES[curriculumIdx];
  const activeBook = HSK_TEXTBOOKS[Math.min(5, Math.max(0, activeHskLevel - 1))];

  // Auto-start gentle chill East-Asian ambient music on page entry
  useEffect(() => {
    ambientBgm.initAutoStart();
    const unsub = ambientBgm.subscribe(setBgmPlaying);
    return () => {
      unsub();
    };
  }, []);

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

  const goToSlide = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    setShowFooter(false);
    setActiveSlide(clamped);
  }, []);

  const stepChapter = useCallback((dir: 1 | -1) => {
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

  // Preload all editorial photographs & 6 real HSK book covers on mount for 0ms transitions
  useEffect(() => {
    [
      '/images/editorial-hero-chinese.webp',
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
  }, []);

  // 1:1 WuWa Swiper Mouse-Wheel & Trackpad Inertia Onset Detector
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      e.preventDefault();

      const absDelta = Math.abs(e.deltaY);
      if (absDelta < 6) return;

      const now = performance.now();
      const ws = wheelStateRef.current;
      const gap = now - ws.lastEventTime;
      const isNewGesture = gap > 135 || absDelta > ws.lastAbsDelta * 1.38 + 14;

      ws.lastEventTime = now;
      ws.lastAbsDelta = absDelta;

      if (now < ws.lockUntil) {
        // Allow intentional rapid discrete wheel notch after 260ms if user explicitly accelerated
        if (!(isNewGesture && now >= ws.lockUntil - 160)) {
          return;
        }
      } else if (!isNewGesture && gap < 55) {
        // Ignore decaying trackpad inertia tail after lock expires
        return;
      }

      ws.lockUntil = now + 420;
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

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * -10;
    const ny = (e.clientY / window.innerHeight - 0.5) * -6;
    setHeroParallax({ x: nx, y: ny });
  };

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

  const isHero = activeSlide === 0;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#F5F2EC] text-[#1C1917] select-none"
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
          QUIET FLOATING EDITORIAL CHROME
      ═══════════════════════════════════════════════════════════════════ */}

      {/* TOP-LEFT: Clean Hanzi4U Seal Mark → Vertical Lesson Tag on Inner Chapters */}
      <div className="fixed top-6 left-6 sm:left-8 z-40">
        {isHero ? (
          <button
            type="button"
            onClick={() => goToSlide(0)}
            className="cursor-pointer focus-visible:outline-none"
          >
            <HanziLogo variant="light" size="md" subtitle="HỌC TIẾNG TRUNG HSK" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goToSlide(0)}
            title="Về trang mở đầu"
            className="group flex flex-col items-center gap-2 cursor-pointer focus-visible:outline-none"
          >
            <span className="w-8 h-8 rounded-[6px] bg-[#C41E3A] text-white font-hanzi-serif text-base font-bold flex items-center justify-center shadow-xs group-hover:bg-[#A51730] transition-colors">
              汉
            </span>
            <span
              className="text-[10.5px] font-hanzi-serif tracking-[0.26em] text-[#57534E]"
              style={{ writingMode: 'vertical-rl' }}
            >
              {CHAPTERS[activeSlide].zhCaption}
            </span>
          </button>
        )}
      </div>

      {/* TOP-RIGHT: Minimal Calm Action Cluster (Chill BGM Toggle + Auth) */}
      <div className="fixed top-5 right-6 sm:right-8 z-40 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            ambientBgm.toggle();
          }}
          aria-label={bgmPlaying ? 'Tắt nhạc nền thư giãn' : 'Bật nhạc nền thư giãn'}
          title={bgmPlaying ? 'Nhạc nền thư giãn: Đang phát (Bấm để tắt)' : 'Nhạc nền thư giãn: Đã tắt (Bấm để bật)'}
          className={`w-9 h-9 rounded-full border shadow-xs backdrop-blur-sm flex items-center justify-center cursor-pointer transition-colors ${
            bgmPlaying
              ? 'bg-white text-[#1C1917] border-[#C41E3A]/35 hover:border-[#C41E3A]'
              : 'bg-white/85 text-[#57534E] border-[#1C1917]/15 hover:bg-white'
          }`}
        >
          <EqualizerBars active={bgmPlaying} />
        </button>

        <a
          href="#/login"
          className="h-9 px-4 rounded-full bg-white/90 hover:bg-white text-[#1C1917] hover:text-[#C41E3A] border border-[#1C1917]/15 shadow-xs backdrop-blur-sm text-xs font-semibold inline-flex items-center justify-center transition-colors"
        >
          Đăng nhập
        </a>

        <a
          href="#/login?tab=register"
          className="h-9 px-5 rounded-full bg-[#C41E3A] hover:bg-[#A51730] text-white text-xs font-semibold inline-flex items-center justify-center shadow-xs transition-colors"
        >
          Đăng ký miễn phí
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
          PERSISTENT 5-CHAPTER FULL-VIEWPORT STAGE (1:1 SWIPER EFFECT-FADE)
          All 5 chapters remain mounted in DOM & GPU memory for 0ms transitions!
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          transform: showFooter ? 'translate3d(0, -136px, 0)' : 'translate3d(0, 0, 0)',
        }}
        className="relative w-full h-full transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
      >
        {/* ────────────────────────────────────────────────────────────────
            SLIDE 0: CALM DAYLIGHT EDITORIAL HERO (Kinfolk × Chinese Study)
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 0}
          onPointerMove={activeSlide === 0 ? handleHeroPointerMove : undefined}
          className={`absolute inset-0 w-full h-full overflow-hidden bg-[#F3EFE8] transition-opacity duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] ${
            activeSlide === 0
              ? 'opacity-100 pointer-events-auto z-20'
              : 'opacity-0 pointer-events-none z-10'
          }`}
        >
          <div
            aria-hidden="true"
            style={{
              transform: `translate3d(${heroParallax.x.toFixed(1)}px, ${heroParallax.y.toFixed(1)}px, 0) scale(1.03)`,
            }}
            className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
          >
            <img
              src="/images/editorial-hero-chinese.webp"
              alt=""
              decoding="async"
              className="w-full h-full object-cover object-right"
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(95deg, rgba(246, 243, 237, 0.94) 0%, rgba(246, 243, 237, 0.84) 38%, rgba(246, 243, 237, 0.18) 64%, rgba(246, 243, 237, 0) 100%)',
            }}
          />

          <ArchitecturalBlueprintGrid className="opacity-65" />

          <div className="relative z-20 h-full max-w-[1380px] mx-auto px-6 sm:px-12 lg:px-20 flex flex-col justify-center">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-3 text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#C41E3A]">
                <span className="w-6 h-[1.5px] bg-[#C41E3A]" />
                <span>HỌC TIẾNG TRUNG CHUẨN HSK 1 — 6</span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[56px] text-[#1C1917] leading-[1.1] tracking-[-0.028em]">
                Học tiếng Trung bài bản từ{' '}
                <span className="text-[#C41E3A]">những nét chữ đầu tiên</span>
              </h1>

              <p className="text-base sm:text-[17px] text-[#44403C] leading-relaxed max-w-lg">
                Luyện phát âm chuẩn đủ <strong>63 âm Pinyin</strong>, tập viết thứ tự từng nét
                trên ô Điền Tự Cách, ôn thẻ lật từ và giáo trình chuẩn HSK 1–6 trong không gian
                yên tĩnh, chỉ 15 phút mỗi ngày.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <a
                  href="#/login?tab=register"
                  className="h-12 px-7 rounded-lg bg-[#C41E3A] hover:bg-[#A51730] text-white font-semibold text-sm inline-flex items-center gap-2 shadow-[0_10px_24px_-8px_rgba(196,30,58,0.45)] transition-colors"
                >
                  <span>Bắt đầu học miễn phí</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => goToSlide(1)}
                  className="h-12 px-6 rounded-lg bg-white/85 hover:bg-white text-[#1C1917] border border-[#1C1917]/20 hover:border-[#C41E3A]/50 font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Xem thử bài học</span>
                  <ChevronDown className="w-4 h-4 text-[#C41E3A]" />
                </button>
              </div>

              <div className="pt-6 border-t border-[#1C1917]/15 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs font-mono text-[#57534E]">
                <span>63 Âm Pinyin chuẩn</span>
                <span className="text-[#C41E3A]">·</span>
                <span>9.500+ Nét chữ Hán</span>
                <span className="text-[#C41E3A]">·</span>
                <span>Giáo trình chuẩn HSK 1–6</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => goToSlide(1)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 hover:bg-white border border-[#1C1917]/15 text-[11px] font-mono text-[#57534E] hover:text-[#C41E3A] backdrop-blur-sm transition-colors cursor-pointer"
          >
            <span>Cuộn xuống · Bài 01 Thanh điệu</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* ────────────────────────────────────────────────────────────────
            SLIDE 1: 4 TONES & 63 PINYIN — CALM WATERCOLOR + PORCELAIN 3D
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 1}
          className={`absolute inset-0 w-full h-full overflow-hidden bg-[#F5F2EC] transition-opacity duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] ${
            activeSlide === 1
              ? 'opacity-100 pointer-events-auto z-20'
              : 'opacity-0 pointer-events-none z-10'
          }`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-all duration-500 ease-out"
            style={{ backgroundImage: activeSpecimen.wash }}
          />
          <ArchitecturalBlueprintGrid />

          <div className="relative z-10 h-full max-w-[1360px] mx-auto px-6 sm:px-14 lg:pl-24 lg:pr-14 pt-14 pb-16 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
            <div className="lg:col-span-5 flex flex-col justify-between h-full max-h-[600px] py-2">
              <div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C41E3A]">
                  01 · NGỮ ÂM PHỔ THÔNG
                </span>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1917] tracking-tight mt-1">
                  4 Thanh điệu & Pinyin
                </h2>
              </div>

              <div className="space-y-4 my-auto py-4">
                <p className="font-hanzi-serif text-sm tracking-[0.18em] text-[#78716C]">
                  {activeSpecimen.phonetic}
                </p>

                <div className="flex items-center gap-3.5">
                  <PronunciationPlayButton
                    onClick={() => speakChinese(activeSpecimen.hanzi, 0.72)}
                    active={isSpeaking}
                    accentColor={activeSpecimen.accent}
                    label={`Nghe phát âm ${activeSpecimen.pinyin}`}
                  />
                  <div>
                    <h3 className="font-display font-extrabold text-3xl sm:text-[34px] text-[#1C1917] leading-none">
                      {activeSpecimen.title}
                    </h3>
                    <p className="text-xs font-medium text-[#57534E] mt-1.5">
                      {activeSpecimen.sino}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-white/85 border border-[#1C1917]/15 text-xs">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#78716C]">
                    Từ ghép:
                  </span>
                  <span className="font-semibold text-[#1C1917]">{activeSpecimen.compound}</span>
                </div>

                <p className="text-sm text-[#44403C] leading-relaxed max-w-md">
                  {activeSpecimen.lore}
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#78716C]">
                  Bấm vào chữ để nghe phát âm
                </p>
                <div className="flex items-center gap-2.5">
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
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center cursor-pointer border transition-transform duration-150"
                        style={{
                          backgroundColor: selected ? '#1C1917' : 'rgba(255,255,255,0.9)',
                          borderColor: selected ? spec.accent : 'rgba(28,25,23,0.16)',
                          color: selected ? '#FFFFFF' : '#1C1917',
                          transform: selected ? 'scale(1.08)' : 'scale(1)',
                        }}
                      >
                        <span className="font-hanzi-serif text-xl font-bold leading-none">
                          {spec.hanzi}
                        </span>
                        <span
                          className="text-[9px] font-mono font-semibold mt-0.5"
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

            <div className="lg:col-span-7 relative h-[360px] sm:h-[460px] lg:h-[580px] flex items-center justify-center">
              <div className="relative z-10 w-full h-full">
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    slide1Mode === 'medallion'
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <ThreeMinimalZenSculpture
                    activeHanzi={activeSpecimen.hanzi}
                    activePinyin={activeSpecimen.pinyin}
                    accentHex={activeSpecimen.accent}
                    isActive={activeSlide === 1 && slide1Mode === 'medallion'}
                    className="w-full h-full"
                  />
                </div>
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    slide1Mode === 'curves'
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
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
                    theme="light"
                    className="w-full h-full"
                  />
                </div>
              </div>

              <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 text-[10.5px] font-mono text-[#78716C]">
                <Move className="w-3.5 h-3.5 text-[#C41E3A]" />
                Kéo để xoay mặt trước & mặt sau 3D
              </span>

              <div className="hidden sm:flex flex-col gap-1.5 absolute right-0 top-1/2 -translate-y-1/2 z-20">
                {[
                  { id: 'medallion' as const, label: 'Thẻ sứ 3D', glyph: '字' },
                  { id: 'curves' as const, label: 'Đường thanh', glyph: '声' },
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
            SLIDE 2: CALLIGRAPHY & STROKE ORDER — REAL XUAN PAPER + 3D SLAB
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 2}
          className={`absolute inset-0 w-full h-full overflow-hidden bg-[#F5F2EC] transition-opacity duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] ${
            activeSlide === 2
              ? 'opacity-100 pointer-events-auto z-20'
              : 'opacity-0 pointer-events-none z-10'
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
            <img
              src="/images/intro-hanzi-notebook.webp"
              alt=""
              decoding="async"
              className="w-full h-full object-cover object-center opacity-90"
            />
          </div>

          <div className="relative z-10 h-full max-w-[1360px] mx-auto px-6 sm:px-14 lg:pl-24 lg:pr-10 pt-14 pb-16 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
            <div className="lg:col-span-5 space-y-5">
              <div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C41E3A]">
                  02 · THỨ TỰ NÉT CHỮ HÁN
                </span>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#1C1917] tracking-tight mt-1">
                  Ô Điền Tự Cách
                </h2>
              </div>

              <EditorialPaperFrame className="p-6 max-w-md shadow-[0_20px_48px_-24px_rgba(28,25,23,0.18)]">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1C1917]/10">
                  <div>
                    <span className="text-[10.5px] font-mono font-semibold text-[#C41E3A]">
                      {activeCalligraphy.strokes} NÉT CHUẨN · HÁN-VIỆT: {activeCalligraphy.sino.toUpperCase()}
                    </span>
                    <h3 className="font-display text-2xl font-bold text-[#1C1917] mt-1">
                      {activeCalligraphy.title}
                    </h3>
                    <p className="text-xs font-mono text-[#57534E] mt-0.5">
                      {activeCalligraphy.char} ({activeCalligraphy.pinyin})
                    </p>
                  </div>
                  <PronunciationPlayButton
                    onClick={() => speakChinese(activeCalligraphy.char, 0.75)}
                    active={isSpeaking}
                    accentColor="#C41E3A"
                    label={`Nghe đọc ${activeCalligraphy.char}`}
                  />
                </div>

                <p className="text-sm text-[#44403C] leading-relaxed py-4">
                  {activeCalligraphy.desc}
                </p>

                <div className="pt-3 border-t border-[#1C1917]/10">
                  <p className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-[#78716C] mb-2.5">
                    Chọn chữ mẫu xem trên bia sứ 3D
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
                          className="py-2.5 border text-center cursor-pointer"
                          style={{
                            backgroundColor: selected ? '#C41E3A' : '#FFFFFF',
                            borderColor: selected ? '#C41E3A' : 'rgba(28,25,23,0.16)',
                            color: selected ? '#FFFFFF' : '#1C1917',
                          }}
                        >
                          <span className="font-hanzi-serif text-2xl font-bold block leading-none">
                            {item.char}
                          </span>
                          <span
                            className="text-[10px] font-mono mt-1 block"
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

            <div className="lg:col-span-5 relative h-[320px] sm:h-[420px] lg:h-[470px] flex items-center justify-center">
              <div className="w-full max-w-[400px] h-full">
                <ThreeStudyDioramaStage
                  activeScene={1}
                  activeToneIdx={0}
                  activeStrokeChar={activeCalligraphy.char}
                  activeStrokePinyin={activeCalligraphy.pinyin}
                  activeStrokeCount={activeCalligraphy.strokes}
                  flippedCards={{}}
                  activeCardIdx={0}
                  activeHskLevel={1}
                  isActive={activeSlide === 2}
                  theme="light"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────────
            SLIDE 3: EDITORIAL CURRICULUM GALLERY & FILMSTRIP
        ──────────────────────────────────────────────────────────────── */}
        <section
          aria-hidden={activeSlide !== 3}
          className={`absolute inset-0 w-full h-full overflow-hidden bg-[#F5F2EC] transition-opacity duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] ${
            activeSlide === 3
              ? 'opacity-100 pointer-events-auto z-20'
              : 'opacity-0 pointer-events-none z-10'
          }`}
        >
          <ArchitecturalBlueprintGrid />

          <div className="relative z-10 h-full max-w-[1080px] mx-auto px-6 sm:px-14 pt-12 pb-16 flex flex-col justify-center gap-4">
            <MuseumExhibitionFrame
              chapterLabel="03 · CHƯƠNG TRÌNH HỌC"
              title="Hệ thống bài học HSK chuẩn cho người Việt"
              className="w-full"
            >
              <div className="relative h-[370px] sm:h-[420px] lg:h-[450px] w-full bg-[#1C1917]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCurriculum.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={activeCurriculum.image}
                      alt={activeCurriculum.title}
                      decoding="async"
                      className="w-full h-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-[#1C1917]/25 via-[#1C1917]/65 to-[#1C1917]/95"
                    />

                    <div className="absolute inset-0 flex items-center justify-end p-6 sm:p-10">
                      <div className="max-w-md w-full space-y-4 text-white">
                        <span className="inline-block px-2.5 py-0.5 bg-[#C41E3A] text-white font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase">
                          {activeCurriculum.tag}
                        </span>

                        <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                          {activeCurriculum.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                          {activeCurriculum.summary}
                        </p>

                        {activeCurriculum.id !== 'quiz' ? (
                          <div className="pt-2 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              {activeCurriculum.points.map((pt) => (
                                <div
                                  key={pt}
                                  className="px-2.5 py-2 border border-white/20 bg-black/35 backdrop-blur-sm text-[11px] font-medium text-white/95 text-center"
                                >
                                  {pt}
                                </div>
                              ))}
                            </div>
                            <a
                              href="#/login?tab=register"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FDE68A] hover:text-white transition-colors pt-1"
                            >
                              <span>Đăng ký mở khóa miễn phí</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between border-b border-white/15 pb-2">
                              <p className="text-sm font-semibold">
                                Câu <span className="font-hanzi-serif text-lg text-[#FDE68A]">「你好吗？」</span> nghĩa là gì?
                              </p>
                              <button
                                type="button"
                                onClick={() => speakChinese('你好吗', 0.78)}
                                className="inline-flex items-center gap-1 text-xs font-mono text-[#FDE68A] hover:text-white cursor-pointer"
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
                                          ? 'bg-[#157A57] border-[#157A57] text-white'
                                          : picked
                                            ? 'bg-[#C41E3A] border-[#C41E3A] text-white'
                                            : 'bg-white/10 border-white/15 text-white/50'
                                        : 'bg-black/45 hover:bg-white/15 border-white/25 text-white'
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

                <button
                  type="button"
                  onClick={() =>
                    setCurriculumIdx((p) => (p - 1 + CURRICULUM_SLIDES.length) % CURRICULUM_SLIDES.length)
                  }
                  aria-label="Mục trước"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/50 hover:bg-[#C41E3A] text-white border border-white/25 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurriculumIdx((p) => (p + 1) % CURRICULUM_SLIDES.length)}
                  aria-label="Mục tiếp theo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/50 hover:bg-[#C41E3A] text-white border border-white/25 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </MuseumExhibitionFrame>

            <div className="flex items-center justify-center gap-3 w-full overflow-x-auto no-scrollbar py-1">
              {CURRICULUM_SLIDES.map((slide, idx) => {
                const active = idx === curriculumIdx;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurriculumIdx(idx)}
                    className={`relative w-32 sm:w-36 h-[64px] sm:h-[72px] shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
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
                    <span className="absolute bottom-1.5 inset-x-2 text-[10px] font-mono font-semibold text-white truncate text-left">
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
          className={`absolute inset-0 w-full h-full overflow-hidden bg-[#F5F2EC] transition-opacity duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] ${
            activeSlide === 4
              ? 'opacity-100 pointer-events-auto z-20'
              : 'opacity-0 pointer-events-none z-10'
          }`}
        >
          <ArchitecturalBlueprintGrid />

          <div className="relative z-10 h-full max-w-[1360px] mx-auto px-6 sm:px-14 lg:pl-24 lg:pr-12 pt-16 pb-16 flex flex-col justify-between">
            {/* TOP BAR: Clean Frameless Header & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C41E3A]">
                  04 · TRẢI NGHIỆM TRỰC QUAN
                </span>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1C1917] tracking-tight mt-0.5">
                  {studioMode === 'cards' ? 'Thẻ lật từ' : 'Giáo trình chuẩn HSK 1 → 6'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStudioMode('cards')}
                  className="px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer"
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
                  className="px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: studioMode === 'hsk' ? '#1C1917' : 'rgba(255,255,255,0.9)',
                    borderColor: studioMode === 'hsk' ? '#1C1917' : 'rgba(28,25,23,0.18)',
                    color: studioMode === 'hsk' ? '#FFFFFF' : '#1C1917',
                  }}
                >
                  Sách giáo trình HSK 1 → 6
                </button>
              </div>
            </div>

            {/* FRAMELESS OPEN-CANVAS 3D STAGE + OPTIONAL BOOK DETAIL DRAWER */}
            <div className="relative flex-1 min-h-0 w-full grid grid-cols-1 lg:grid-cols-12 items-center gap-6 my-2">
              {/* Open Frameless 3D Canvas (Full 12 cols in Flashcard mode, 8 cols in HSK Book mode) */}
              <div
                className={`relative h-[390px] sm:h-[470px] lg:h-[520px] transition-all duration-300 ${
                  studioMode === 'cards' ? 'lg:col-span-12' : 'lg:col-span-8'
                }`}
              >
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
                  onCardClick={handleDirectCardClick}
                  onBookClick={handleDirectBookClick}
                  theme="light"
                  className="w-full h-full"
                />

                {/* Subtle Frameless Hint Pill */}
                <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/75 backdrop-blur-sm border border-[#1C1917]/10 text-[11px] font-mono text-[#57534E]">
                  <Move className="w-3.5 h-3.5 text-[#C41E3A]" />
                  <span>
                    {studioMode === 'cards'
                      ? 'Bấm trực tiếp vào từng thẻ để lật mặt sau & nghe phát âm · Kéo để xoay góc nhìn'
                      : 'Bấm trực tiếp vào quyển sách HSK 1 → 6 để xem chi tiết giáo trình'}
                  </span>
                </div>
              </div>

              {/* HSK Textbook Information Card (Appears cleanly on the right when in Book mode) */}
              {studioMode === 'hsk' && (
                <div className="lg:col-span-4 flex flex-col justify-center">
                  <EditorialPaperFrame className="p-5 sm:p-6 shadow-[0_20px_48px_-24px_rgba(28,25,23,0.18)] space-y-4">
                    <div className="flex items-start gap-4 pb-3.5 border-b border-[#1C1917]/10">
                      <img
                        src={activeBook.cover}
                        alt={activeBook.title}
                        decoding="async"
                        className="w-16 h-22 object-cover rounded-[3px] border border-[#1C1917]/15 shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <span
                          className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-white uppercase"
                          style={{ backgroundColor: activeBook.accent }}
                        >
                          {activeBook.zhTitle}
                        </span>
                        <h3 className="font-display font-bold text-lg sm:text-xl text-[#1C1917] mt-1 leading-snug">
                          {activeBook.title}
                        </h3>
                        <p className="text-[11px] text-[#78716C] mt-0.5">{activeBook.author}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="px-3 py-2 bg-[#F5F2EC] border border-[#1C1917]/10">
                        <span className="text-[10px] font-mono uppercase text-[#78716C] block">
                          Từ vựng chuẩn
                        </span>
                        <strong className="text-[#1C1917] font-semibold">{activeBook.words}</strong>
                      </div>
                      <div className="px-3 py-2 bg-[#F5F2EC] border border-[#1C1917]/10">
                        <span className="text-[10px] font-mono uppercase text-[#78716C] block">
                          Cấu trúc sách
                        </span>
                        <strong className="text-[#1C1917] font-semibold">{activeBook.lessons}</strong>
                      </div>
                    </div>

                    <p className="text-xs sm:text-[13px] text-[#44403C] leading-relaxed">
                      {activeBook.desc}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
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
                    <div className="pt-3 border-t border-[#1C1917]/10 space-y-3">
                      <div className="grid grid-cols-6 gap-1.5">
                        {HSK_TEXTBOOKS.map((b) => {
                          const selected = b.level === activeHskLevel;
                          return (
                            <button
                              key={b.level}
                              type="button"
                              onClick={() => setActiveHskLevel(b.level)}
                              className="py-1.5 font-mono text-[11px] font-bold border cursor-pointer transition-colors"
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
                        className="w-full h-10 rounded-md bg-[#C41E3A] hover:bg-[#A51730] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Học {activeBook.title} miễn phí</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </EditorialPaperFrame>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── QUIET EDITORIAL CHAPTER STATUS BAR (Slides 1–4, Center scroll hint removed per Ảnh 3) ── */}
        <div
          className={`fixed bottom-0 inset-x-0 z-30 h-11 bg-[#F4F0E9]/95 backdrop-blur-md border-t border-[#1C1917]/10 px-6 sm:px-10 flex items-center justify-between gap-4 transition-opacity duration-300 ${
            isHero ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
          }`}
        >
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#57534E]">
            <span className="font-bold text-[#C41E3A]">0{activeSlide + 1} / 05</span>
            <span className="hidden sm:inline text-[#1C1917]/25">|</span>
            <span className="hidden sm:inline font-medium text-[#1C1917]">
              {CHAPTERS[activeSlide].label}
            </span>
          </div>

          <a
            href="#/login?tab=register"
            className="text-xs font-semibold text-[#C41E3A] hover:text-[#9E162E] inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Bắt đầu học miễn phí</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SLIDE-UP EDITORIAL FOOTER DRAWER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          transform: showFooter ? 'translate3d(0, 0, 0)' : 'translate3d(0, 150px, 0)',
        }}
        className="fixed bottom-0 inset-x-0 h-[136px] z-50 bg-[#FCFBF8] text-[#1C1917] border-t border-[#1C1917]/15 px-6 sm:px-10 flex items-center transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HanziLogoMark variant="light" className="w-9 h-9" />
            <div className="leading-tight">
              <p className="font-display font-bold text-sm text-[#1C1917]">
                Hanzi<span className="text-[#C41E3A]">4U</span> · Nền tảng tự học tiếng Trung HSK 1–6
              </p>
              <p className="text-[11px] text-[#57534E]">
                © 2026 Hanzi4U (hanzi4u.id.vn) · 63 Âm Pinyin · Ô Điền Tự Cách · Thẻ lật từ & Sách HSK
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#1C1917]">
            <a href="#/login?tab=register" className="hover:text-[#C41E3A] transition-colors">
              Đăng ký miễn phí
            </a>
            <a href="#/login" className="hover:text-[#C41E3A] transition-colors">
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
