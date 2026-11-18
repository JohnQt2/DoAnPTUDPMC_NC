import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  Brain,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  ChevronRight,
  BarChart3,
  Play,
  BookOpen,
  GraduationCap,
  Compass,
  PenTool,
  Flame,
  Gamepad2,
  Clock,
  Target,
} from 'lucide-react';

interface DemoCharacter {
  hanzi: string;
  pinyin: string;
  toneLabel: string;
  toneContour: string;
  meaning: string;
  strokes: number;
  lesson: string;
}

const DEMO_CHARACTERS: DemoCharacter[] = [
  {
    hanzi: '你',
    pinyin: 'nǐ',
    toneLabel: 'Thanh 3 (Trầm uốn 214)',
    toneContour: 'M 10 25 Q 45 55, 90 12',
    meaning: 'Bạn, anh, chị (ngôi thứ hai)',
    strokes: 7,
    lesson: 'HSK 1 • Unit 01: Xin chào',
  },
  {
    hanzi: '好',
    pinyin: 'hǎo',
    toneLabel: 'Thanh 3 (Trầm uốn 214)',
    toneContour: 'M 10 25 Q 45 55, 90 12',
    meaning: 'Tốt, đẹp, khỏe, hay',
    strokes: 6,
    lesson: 'HSK 1 • Unit 01: Xin chào',
  },
  {
    hanzi: '学',
    pinyin: 'xué',
    toneLabel: 'Thanh 2 (Đi lên 35)',
    toneContour: 'M 10 48 L 90 12',
    meaning: 'Học tập, nghiên cứu',
    strokes: 8,
    lesson: 'HSK 1 • Unit 03: Học tiếng Hán',
  },
  {
    hanzi: '汉',
    pinyin: 'hàn',
    toneLabel: 'Thanh 4 (Hạ dốc 51)',
    toneContour: 'M 10 14 L 90 52',
    meaning: 'Chữ Hán, tiếng Hán',
    strokes: 5,
    lesson: 'HSK 1 • Unit 03: Học tiếng Hán',
  },
];

const LEARNING_TRACKS = [
  {
    tag: 'Chuẩn Khảo Thí Quốc Tế',
    title: 'Lộ Trình HSK 3.0 Toàn Diện (HSK 1 – 6)',
    subtitle: 'Dành cho học sinh, sinh viên & người cần chứng chỉ',
    desc: 'Phát triển toàn diện Nghe – Nói – Đọc – Viết theo khung HSK 3.0 mới nhất. Mỗi Unit đi kèm bài thi Checkpoint đạt ≥ 80% để mở khóa bài kế tiếp.',
    highlights: ['Kiểm tra đầu vào miễn phí', '150 → 5.000+ từ vựng chuẩn', 'Phòng thi thử HSK bấm giờ'],
    href: '#/courses',
    cta: 'Khám phá lộ trình HSK',
    badgeColor: 'bg-primary-50 text-primary-600 border-primary-200',
  },
  {
    tag: 'Lộ Trình Thích Ứng (Adaptive)',
    title: 'Tiếng Trung Giao Tiếp & Phản Xạ 15 Phút/Ngày',
    subtitle: 'Dành cho người đi làm bận rộn & tự học tại nhà',
    desc: 'Hệ thống tự phân tích điểm mạnh/yếu để đề xuất chế độ Học mới (New) – Củng cố (Shore up) – Ôn lại (Review) mỗi ngày, không lo quá tải.',
    highlights: ['Đo cao độ thanh điệu F0', 'Hội thoại tình huống thực tế', 'Chỉ 15–20 phút mỗi ngày'],
    href: '#/onboarding',
    cta: 'Thiết lập lộ trình cá nhân',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    tag: 'Tương Tác Đa Giác Quan',
    title: 'Nền Tảng Sơ Cấp & Trò Chơi Ghi Nhớ Từ Vựng',
    subtitle: 'Dành cho người mới bắt đầu từ con số 0',
    desc: 'Làm chủ 4 thanh điệu Pinyin, tập viết chữ Hán trên Bảng Trắng Điền Tự Cách và ghi nhớ từ vựng tự nhiên qua Flashcard thông minh SM-2.',
    highlights: ['Bảng phiên âm Pinyin tương tác', 'Bảng trắng luyện nét chữ SVG', 'Flashcard SM-2 chống quên'],
    href: '#/pinyin',
    cta: 'Vào bảng Pinyin & Chữ Hán',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export const LandingPage: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeChar = DEMO_CHARACTERS[selectedIdx];

  const handlePlayDemoAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeChar.hanzi);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="bg-white text-gray-900 selection:bg-primary-100 selection:text-primary-800">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION (Soft Coral Red & White Theme)                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-white pt-10 pb-20 lg:pt-16 lg:pb-24">
        {/* Soft pastel red decorative glows */}
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-tr from-primary-200/45 via-primary-100/40 to-amber-100/30 rounded-full blur-3xl -z-10 pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Call To Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-200 text-primary-600 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary-500 motion-safe:animate-pulse" aria-hidden="true" />
                <span>Hanzi4u • Nền tảng học tiếng Trung thích ứng chuẩn HSK 3.0</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.15]">
                Học Tiếng Trung Thông Minh{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500">
                  Theo Lộ Trình Của Riêng Bạn
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Với <strong className="text-primary-600 font-bold">Hanzi4u</strong>, mỗi ngày chỉ cần{' '}
                <strong className="text-gray-900 font-semibold">15–20 phút</strong>: Kiểm tra năng lực đầu vào, học theo lộ trình thích ứng (Học mới • Củng cố • Ôn lại), luyện phát âm F0, tập viết trên bảng trắng Điền Tự Cách và thi thử HSK bấm giờ như thật.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="#/login?tab=register"
                  className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <span>Kiểm Tra Trình Độ & Học Miễn Phí</span>
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </a>

                <a
                  href="#features"
                  className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-primary-200 bg-white hover:bg-primary-50/60 active:scale-[0.98] text-primary-600 font-bold text-sm sm:text-base transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <span>Khám Phá Hệ Sinh Thái</span>
                  <ChevronRight className="w-4 h-4 text-primary-400" aria-hidden="true" />
                </a>
              </div>

              {/* Adaptive Cycle Pills (Hanpeak style) */}
              <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-600 font-bold border border-primary-100">
                  <Flame className="w-3.5 h-3.5 text-primary-500" />
                  1. Học mới (New)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-100">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  2. Củng cố (Shore up)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                  <Brain className="w-3.5 h-3.5 text-emerald-600" />
                  3. Ôn lại (SM-2 Review)
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Hero Visual Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md relative">
                {/* Soft Glow Backdrop */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-2 bg-gradient-to-r from-primary-300 to-primary-200 rounded-3xl blur-2xl opacity-40"
                />

                {/* Main Interactive Preview Card */}
                <div className="relative bg-white rounded-3xl p-6 sm:p-7 border border-primary-100 shadow-xl shadow-primary-100/60 space-y-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-primary-50">
                    <div className="flex items-center gap-2.5">
                      <div
                        aria-hidden="true"
                        className="w-9 h-9 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center font-chinese font-bold text-base border border-primary-100"
                      >
                        汉
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-gray-900">Bảng Trắng & Thẻ Học Hanzi4u</h2>
                        <span className="text-[11px] text-gray-500">{activeChar.lesson}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-100 text-[11px] font-bold">
                      Học thử ngay
                    </span>
                  </div>

                  {/* Interactive Character Selector Tabs */}
                  <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Chọn chữ Hán học thử">
                    {DEMO_CHARACTERS.map((item, idx) => {
                      const isSelected = idx === selectedIdx;
                      return (
                        <button
                          key={item.hanzi}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setSelectedIdx(idx)}
                          className={`min-h-[44px] py-2 rounded-xl font-chinese font-bold text-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                            isSelected
                              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                              : 'bg-primary-50/50 text-gray-700 hover:bg-primary-50 border border-primary-100'
                          }`}
                        >
                          {item.hanzi}
                        </button>
                      );
                    })}
                  </div>

                  {/* Character Highlight & Audio Trigger */}
                  <div className="text-center py-5 px-4 bg-gradient-to-b from-primary-50/60 to-white rounded-2xl border border-primary-100 tianzige-grid space-y-2 relative">
                    <button
                      type="button"
                      onClick={handlePlayDemoAudio}
                      aria-label={`Nghe phát âm chữ ${activeChar.hanzi} (${activeChar.pinyin})`}
                      className={`absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        isPlayingAudio
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-white text-primary-500 hover:bg-primary-50 border border-primary-200 shadow-sm'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    </button>

                    <span className="text-6xl sm:text-7xl font-bold font-chinese text-gray-900 tracking-wider block">
                      {activeChar.hanzi}
                    </span>
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <span className="text-xl font-extrabold text-primary-500">{activeChar.pinyin}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-white border border-primary-100 text-primary-600 font-semibold">
                        {activeChar.toneLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      Nghĩa tiếng Việt: <strong className="text-gray-900">{activeChar.meaning}</strong>
                    </p>
                  </div>

                  {/* Micro Practice Metadata + Pitch Curve SVG */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-primary-50/40 border border-primary-100/80 space-y-1.5">
                      <div className="flex items-center justify-between text-primary-600 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Đường cong F0</span>
                        </span>
                      </div>
                      <svg
                        viewBox="0 0 100 60"
                        className="w-full h-7 overflow-visible"
                        aria-label={`Biểu đồ thanh điệu ${activeChar.toneLabel}`}
                      >
                        <line x1="0" y1="15" x2="100" y2="15" stroke="#FFD0D0" strokeDasharray="2 2" strokeWidth="1" />
                        <line x1="0" y1="35" x2="100" y2="35" stroke="#FFD0D0" strokeDasharray="2 2" strokeWidth="1" />
                        <line x1="0" y1="55" x2="100" y2="55" stroke="#FFD0D0" strokeDasharray="2 2" strokeWidth="1" />
                        <path
                          d={activeChar.toneContour}
                          fill="none"
                          stroke="#E54848"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="p-3 rounded-xl bg-primary-50/40 border border-primary-100/80 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-primary-600 font-bold">
                        <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Thứ Tự Nét Bút</span>
                      </div>
                      <p className="text-xs text-gray-700 font-semibold">
                        Tổng cộng: <span className="text-primary-600 font-extrabold">{activeChar.strokes} nét chuẩn</span>
                      </p>
                      <span className="text-[11px] text-gray-500">Ô lưới Điền Tự Cách</span>
                    </div>
                  </div>

                  {/* Bottom Action inside preview */}
                  <a
                    href="#/login?tab=register"
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-md shadow-primary-500/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>Vào Bảng Trắng Luyện Viết Chữ Này</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. KEY METRICS BAR (Light Red & White)                                 */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-primary-100 bg-primary-50/35 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white rounded-2xl p-5 border border-primary-100/80 shadow-sm space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-primary-500">HSK 1 – 6</span>
              <p className="text-xs text-gray-600 font-medium">Giáo trình chuẩn khung HSK 3.0</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-primary-100/80 shadow-sm space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-primary-500">15 Phút</span>
              <p className="text-xs text-gray-600 font-medium">Lộ trình vi mô mỗi ngày không quá tải</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-primary-100/80 shadow-sm space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-primary-500">SM-2 SRS</span>
              <p className="text-xs text-gray-600 font-medium">Thuật toán ghi nhớ từ vựng dài hạn</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-primary-100/80 shadow-sm space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-primary-500">≥ 80%</span>
              <p className="text-xs text-gray-600 font-medium">Chuẩn đầu ra mở khóa từng Unit</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. CHƯƠNG TRÌNH HỌC ĐA ĐỐI TƯỢNG (Inspired by Baobaoxue & Hanpeak)     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100 font-bold text-xs uppercase tracking-wider">
            Lộ Trình Học Cá Nhân Hóa
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Chương Trình Học Thiết Kế Cho Mọi Mục Tiêu
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Dù bạn bắt đầu từ con số 0, ôn thi lấy chứng chỉ HSK hay rèn phản xạ giao tiếp hàng ngày, Hanzi4u đều có lộ trình thích ứng dành riêng cho bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {LEARNING_TRACKS.map((track) => (
            <div
              key={track.title}
              className="bg-white rounded-3xl p-7 border border-primary-100 shadow-sm hover:shadow-xl hover:border-primary-300 hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${track.badgeColor}`}>
                  {track.tag}
                </span>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-gray-900">{track.title}</h3>
                  <p className="text-xs font-semibold text-primary-500">{track.subtitle}</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{track.desc}</p>

                <ul className="space-y-2 pt-2">
                  {track.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-primary-50">
                <a
                  href={track.href}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary-50 hover:bg-primary-500 text-primary-600 hover:text-white font-bold text-xs transition-all"
                >
                  <span>{track.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. HỆ SINH THÁI CÔNG CỤ HỌC TẬP (BENTO GRID)                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="scroll-mt-20 py-20 bg-gradient-to-b from-primary-50/40 via-white to-primary-50/30 border-t border-primary-100/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="px-4 py-1.5 rounded-full bg-white border border-primary-200 text-primary-600 font-bold text-xs uppercase tracking-wider">
              Công Cụ Học Tập Trực Quan
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Tất Cả Công Cụ Chinh Phục Tiếng Trung Trong Một Nền Tảng
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
              Kết hợp phương pháp lộ trình thích ứng hiện đại và kho công cụ thực hành tương tác: Bảng Pinyin, Bảng trắng luyện chữ Hán, Flashcard SRS và Phòng thi thử mô phỏng HSK.
            </p>
          </div>

          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Pinyin & Tone Visualizer */}
            <div className="md:col-span-2 bg-white rounded-3xl p-7 sm:p-9 border border-primary-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 border border-primary-100 flex items-center justify-center">
                  <Volume2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Bảng Phiên Âm Pinyin & Đo Cao Độ Thanh Điệu F0
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Luyện phát âm chuẩn 4 thanh điệu cùng hệ thống thanh mẫu, vận mẫu và cặp âm tương phản (Minimal Pairs). Biểu đồ cao độ giọng nói F0 theo thời gian thực giúp người Việt sửa triệt để lỗi nhầm thanh 1 và thanh 4.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-primary-50/50 border border-primary-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    mā
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Thanh 1: Cao bằng (55) • 妈</h4>
                    <p className="text-[11px] text-gray-500">So sánh trực tiếp giọng đọc của bạn với âm mẫu bản xứ</p>
                  </div>
                </div>
                <a href="#/pinyin" className="text-xs font-bold text-primary-600 bg-white border border-primary-200 px-3.5 py-1.5 rounded-full hover:bg-primary-50">
                  Mở Bảng Pinyin →
                </a>
              </div>
            </div>

            {/* Card 2: Hanzi Whiteboard Canvas */}
            <div className="bg-white rounded-3xl p-7 sm:p-9 border border-primary-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 border border-primary-100 flex items-center justify-center">
                  <PenTool className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Bảng Trắng Luyện Viết Chữ Hán
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Xem hoạt ảnh thứ tự từng nét bút chuẩn SVG và tự tay luyện viết trực tiếp trên ô lưới Điền Tự Cách (田字格) kèm âm Hán Việt dễ nhớ.
                </p>
              </div>

              <div className="mt-6 p-3.5 bg-primary-50/40 rounded-2xl border border-primary-100 text-center font-chinese text-3xl text-primary-600 tracking-widest font-bold">
                汉 • 字 • 学 • 习
              </div>
            </div>

            {/* Card 3: Spaced Repetition SRS */}
            <div className="bg-white rounded-3xl p-7 sm:p-9 border border-primary-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 border border-primary-100 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Flashcard & Trò Chơi Ôn Từ Vựng SM-2
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hệ thống tự động chọn 25 từ vựng cần ôn mỗi ngày ngay trước thời điểm bạn quên, biến việc nhồi nhét từ vựng thành phản xạ tự nhiên.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-semibold px-1 gap-1">
                <span className="text-primary-600 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-lg">Lại (&lt;1 ngày)</span>
                <span className="text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">Khó (2 ngày)</span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">Tốt (4 ngày)</span>
              </div>
            </div>

            {/* Card 4: Mock Exam Room */}
            <div className="md:col-span-2 bg-white rounded-3xl p-7 sm:p-9 border border-primary-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 border border-primary-100 flex items-center justify-center">
                  <Award className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Phòng Thi Thử Mô Phỏng HSK & Báo Cáo Năng Lực
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Kho đề kiểm tra theo từng Unit có đồng hồ đếm ngược, tự động chấm điểm và giải thích chi tiết từng câu sai. Học viên đạt từ{' '}
                  <strong className="text-primary-600 font-bold">80% điểm số trở lên</strong> sẽ mở khóa chặng tiếp theo trong lộ trình.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-primary-50/50 border border-primary-100 px-3.5 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-primary-500" aria-hidden="true" />
                  <span>Đồng hồ bấm giờ như thi thật</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-primary-50/50 border border-primary-100 px-3.5 py-2 rounded-xl">
                  <BarChart3 className="w-4 h-4 text-primary-500" aria-hidden="true" />
                  <span>Phân tích câu sai & gợi ý bài cần củng cố</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 5. THREE-STEP LEARNING JOURNEY                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section id="curriculum" className="scroll-mt-20 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100 font-bold text-xs uppercase tracking-wider">
              Phương Pháp Học Thích Ứng
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              3 Bước Tự Học Tiếng Trung Hiệu Quả Cùng Hanzi4u
            </h2>
            <p className="text-sm text-gray-600">
              Lộ trình gọn nhẹ, rõ ràng giúp bạn duy trì thói quen học tập mỗi ngày.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-primary-50/30 rounded-3xl p-8 border border-primary-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-primary-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900">Đánh Giá & Cá Nhân Hóa Lộ Trình</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Làm khảo sát mục tiêu đầu vào và chọn quỹ thời gian (15–45 phút/ngày). Hanzi4u thiết lập ngay lộ trình Unit phù hợp nhất với năng lực của bạn.
              </p>
            </div>

            <div className="bg-primary-50/30 rounded-3xl p-8 border border-primary-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-primary-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">Học Mới & Thực Hành Tương Tác</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Học từ vựng, ngữ pháp qua hội thoại thực tế, luyện phát âm với biểu đồ F0 và tập viết chữ Hán từng nét trên Bảng Trắng Điền Tự Cách.
              </p>
            </div>

            <div className="bg-primary-50/30 rounded-3xl p-8 border border-primary-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-primary-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900">Củng Cố SRS & Vượt Checkpoint</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ôn tập Flashcard SM-2 hàng ngày và vượt qua bài thi Checkpoint đạt ≥ 80% để mở khóa Unit tiếp theo, từng bước chinh phục HSK 1–6.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 6. CALL TO ACTION (Soft Coral Gradient Banner)                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="pb-20 pt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-primary-500 via-primary-500 to-rose-400 rounded-3xl p-8 sm:p-14 text-white overflow-hidden shadow-xl shadow-primary-500/20">
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-white/15 rounded-full blur-2xl pointer-events-none"
          />

          <div className="relative max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              Trải nghiệm miễn phí trên hanzi4u.id.vn
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Bắt đầu lộ trình tiếng Trung HSK của riêng bạn ngay hôm nay
            </h2>

            <p className="text-sm sm:text-base text-white/90 font-normal leading-relaxed max-w-2xl">
              Đăng ký tài khoản trong 30 giây bằng Gmail hoặc Google. Đồng bộ tiến độ học tập trên mọi thiết bị.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#/login?tab=register"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-600 hover:bg-primary-50 active:scale-[0.98] font-bold text-base shadow-lg transition-all cursor-pointer"
              >
                <span>Tạo Tài Khoản Học Miễn Phí</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="#/login"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-white/40 hover:bg-white/15 text-white font-semibold text-base transition-all cursor-pointer"
              >
                <span>Đã có tài khoản? Đăng nhập</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
