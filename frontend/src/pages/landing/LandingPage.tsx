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
    lesson: 'HSK 1 • Bài 01: Xin chào',
  },
  {
    hanzi: '好',
    pinyin: 'hǎo',
    toneLabel: 'Thanh 3 (Trầm uốn 214)',
    toneContour: 'M 10 25 Q 45 55, 90 12',
    meaning: 'Tốt, đẹp, khỏe, hay',
    strokes: 6,
    lesson: 'HSK 1 • Bài 01: Xin chào',
  },
  {
    hanzi: '学',
    pinyin: 'xué',
    toneLabel: 'Thanh 2 (Đi lên 35)',
    toneContour: 'M 10 48 L 90 12',
    meaning: 'Học tập, nghiên cứu',
    strokes: 8,
    lesson: 'HSK 1 • Bài 03: Học tiếng Hán',
  },
  {
    hanzi: '中',
    pinyin: 'zhōng',
    toneLabel: 'Thanh 1 (Cao bằng 55)',
    toneContour: 'M 10 16 L 90 16',
    meaning: 'Ở giữa, trung tâm, Trung Quốc',
    strokes: 4,
    lesson: 'HSK 1 • Bài 04: Quốc tịch',
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
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900 selection:bg-primary-100 selection:text-primary-900">
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION                                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28">
        {/* Subtle decorative background blur shapes */}
        <div
          aria-hidden="true"
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary-200/40 via-secondary-200/30 to-accent-100/30 rounded-full blur-3xl -z-10 pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Call To Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200/70 text-primary-700 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary-600 motion-safe:animate-pulse" aria-hidden="true" />
                <span>Nền tảng học tiếng Trung vi mô thế hệ mới</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-950 leading-[1.15]">
                Chinh Phục Tiếng Trung{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600">
                  Chuẩn HSK
                </span>{' '}
                Dễ Dàng Hơn Bao Giờ Hết
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Phương pháp học vi mô (Micro-learning) thiết kế riêng cho người Việt: Luyện phát âm chuẩn với biểu đồ cao độ thanh điệu F0, viết chữ Hán nét bút thuận trực quan và ghi nhớ từ vựng vĩnh viễn nhờ thuật toán ngắt quãng{' '}
                <strong className="text-gray-900 font-semibold">SuperMemo-2 (SM-2)</strong>.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="#/login?tab=register"
                  className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/35 transition-all motion-reduce:transition-none cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <span>Bắt Đầu Học Miễn Phí</span>
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </a>

                <a
                  href="#features"
                  className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700 font-bold text-sm sm:text-base transition-all motion-reduce:transition-none cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <span>Khám Phá Tính Năng</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </a>
              </div>

              {/* Mini Social Proof & Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-gray-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Không cần thẻ tín dụng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Chuẩn khung khảo thí HSK 1 - HSK 6</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Chỉ 15 phút mỗi ngày</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Hero Visual Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md relative">
                {/* Glow Backdrop */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl blur-xl opacity-20"
                />

                {/* Main Interactive Preview Card */}
                <div className="relative bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xl shadow-gray-200/50 space-y-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        aria-hidden="true"
                        className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-chinese font-bold text-base"
                      >
                        汉
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-gray-900">Trải Nghiệm Thử Thẻ Học Vi Mô</h2>
                        <span className="text-[11px] text-gray-500">{activeChar.lesson}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                      Tương tác trực tiếp
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
                          className={`min-h-[44px] py-2 rounded-xl font-chinese font-bold text-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
                          }`}
                        >
                          {item.hanzi}
                        </button>
                      );
                    })}
                  </div>

                  {/* Character Highlight & Audio Trigger */}
                  <div className="text-center py-5 px-4 bg-gradient-to-b from-primary-50/40 to-transparent rounded-2xl border border-primary-100/60 space-y-2 relative">
                    <button
                      type="button"
                      onClick={handlePlayDemoAudio}
                      aria-label={`Nghe phát âm chữ ${activeChar.hanzi} (${activeChar.pinyin})`}
                      className={`absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                        isPlayingAudio
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-white text-primary-600 hover:bg-primary-50 border border-primary-200 shadow-sm'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    </button>

                    <span className="text-6xl sm:text-7xl font-bold font-chinese text-gray-900 tracking-wider block">
                      {activeChar.hanzi}
                    </span>
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <span className="text-xl font-extrabold text-primary-600">{activeChar.pinyin}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-secondary-100 text-secondary-900 font-semibold">
                        {activeChar.toneLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      Nghĩa tiếng Việt: <strong className="text-gray-900">{activeChar.meaning}</strong>
                    </p>
                  </div>

                  {/* Micro Practice Metadata + Pitch Curve SVG */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between text-primary-700 font-bold">
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
                        <line x1="0" y1="15" x2="100" y2="15" stroke="#E2E8F0" strokeDasharray="2 2" strokeWidth="1" />
                        <line x1="0" y1="35" x2="100" y2="35" stroke="#E2E8F0" strokeDasharray="2 2" strokeWidth="1" />
                        <line x1="0" y1="55" x2="100" y2="55" stroke="#E2E8F0" strokeDasharray="2 2" strokeWidth="1" />
                        <path
                          d={activeChar.toneContour}
                          fill="none"
                          stroke="#C41E3A"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-secondary-800 font-bold">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Cấu Trúc Nét Bút</span>
                      </div>
                      <p className="text-xs text-gray-700 font-semibold">
                        Tổng cộng: <span className="text-primary-600 font-extrabold">{activeChar.strokes} nét chuẩn</span>
                      </p>
                      <span className="text-[11px] text-gray-500">Lưới điền Điền Tự Cách</span>
                    </div>
                  </div>

                  {/* Bottom Action inside preview */}
                  <a
                    href="#/login?tab=register"
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>Vào Luyện Viết & Học Bài Này (Miễn Phí)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. STATS & ARCHITECTURE PILLARS                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-200/80 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-primary-600">6 Cấp Độ</span>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Lộ trình toàn diện HSK 1 → HSK 6</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-secondary-700">22 Bảng</span>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">CSDL quan hệ chuẩn hóa ERD v3.0</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-accent-700">SM-2</span>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Thuật toán lặp lại ngắt quãng</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">≥ 80%</span>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Điều kiện mở khóa bài học kế tiếp</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. BENTO GRID SHOWCASE (CORE FEATURES)                                 */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="scroll-mt-20 py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 font-bold text-xs uppercase tracking-wider">
            Đột Phá Công Nghệ Sư Phạm
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Trải Nghiệm Học Tập Đa Giác Quan Toàn Diện
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
            Không chỉ là những trang sách tĩnh, ChinaEasy kết hợp âm thanh, thị giác, mô phỏng chuyển động nét bút và phản hồi thời gian thực để việc học tiếng Trung trở nên trực quan, sống động.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Pinyin & Tone Visualizer (Col Span 2 on Desktop) */}
          <div className="md:col-span-2 bg-gradient-to-br from-white to-primary-50/30 rounded-3xl p-7 sm:p-9 border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shadow-inner">
                <Volume2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Ngữ Âm Pinyin & Đo Cao Độ Thanh Điệu F0 Ngũ Độ
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Người Việt thường nhầm lẫn giữa các âm tắc sát (zh, ch, sh) và thanh 1 (ngang bằng 55) với thanh 4 (hạ dốc 51). ChinaEasy tích hợp bộ trực quan hóa cao độ giọng nói theo thời gian thực (Pitch Visualizer) giúp bạn nắn chỉnh phát âm chuẩn xác từng nốt.
              </p>
            </div>

            {/* Visual simulation inside card */}
            <div className="mt-6 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                  mā
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Thanh 1: Cao bằng (55)</h4>
                  <p className="text-[11px] text-gray-500">Âm cao, kéo dài đều, không hạ giọng</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                Mẫu chuẩn F0
              </span>
            </div>
          </div>

          {/* Card 2: Hanzi Stroke Canvas (Col Span 1) */}
          <div className="bg-gradient-to-br from-white to-secondary-50/30 rounded-3xl p-7 sm:p-9 border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary-100 text-secondary-800 flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Luyện Viết Chữ Hán Theo Nét Bút Thuận
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tập viết trên lưới điền (田字格 / 米字格) với công nghệ vector SVG. Hệ thống nhận diện thứ tự từng nét viết (ngang trước sổ sau, trên trước dưới sau) và chấm điểm tự động.
              </p>
            </div>

            <div className="mt-6 p-3.5 bg-white rounded-2xl border border-gray-100 text-center font-chinese text-3xl text-gray-800 tracking-widest font-medium">
              学 • 习 • 中 • 文
            </div>
          </div>

          {/* Card 3: Spaced Repetition SRS (Col Span 1) */}
          <div className="bg-gradient-to-br from-white to-accent-50/30 rounded-3xl p-7 sm:p-9 border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent-800 flex items-center justify-center shadow-inner">
                <Brain className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Ôn Tập Ngắt Quãng SM-2 (SRS)
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tối ưu đường cong lãng quên của Hermann Ebbinghaus. Hệ thống tự động tính toán thời điểm vàng để nhắc bạn ôn tập thẻ Flashcard đúng lúc trước khi bạn kịp quên.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold px-1 gap-1">
              <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">Lại (&lt;1 ngày)</span>
              <span className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">Khó (2 ngày)</span>
              <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">Tốt (4 ngày)</span>
            </div>
          </div>

          {/* Card 4: Assessment Snapshot & 80% Barrier (Col Span 2) */}
          <div className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-3xl p-7 sm:p-9 border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-800 flex items-center justify-center shadow-inner">
                <Award className="w-6 h-6 text-primary-600" aria-hidden="true" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Bài Thi Snapshot Độc Lập & Điều Kiện Mở Khóa Khắt Khe
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Mỗi bài kiểm tra tạo một bản sao độc lập (Question Snapshot) nhằm bảo toàn nội dung đề thi ngay cả khi ngân hàng câu hỏi thay đổi. Học viên cần đạt từ{' '}
                <strong className="text-gray-900 font-bold">80% điểm số trở lên</strong> để mở khóa bài học kế tiếp, đảm bảo vững kiến thức từng bước.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Chống nộp trùng lặp (Idempotency-Key)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-xl">
                <BarChart3 className="w-4 h-4 text-primary-600" aria-hidden="true" />
                <span>Báo cáo phân tích điểm mạnh & điểm yếu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. THREE-STEP LEARNING JOURNEY (HOW IT WORKS)                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section id="curriculum" className="scroll-mt-20 py-20 bg-gray-50 border-t border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="px-4 py-1.5 rounded-full bg-secondary-100 text-secondary-900 font-bold text-xs uppercase tracking-wider">
              Lộ Trình Tinh Gọn
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              3 Bước Chinh Phục HSK Tại ChinaEasy
            </h2>
            <p className="text-sm text-gray-600">
              Thiết kế khoa học giúp bạn duy trì thói quen học tập bền bỉ mỗi ngày.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200/70 shadow-sm space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900">Khảo Sát & Lên Lộ Trình</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Trả lời nhanh bảng khảo sát mục tiêu (Onboarding) và chọn cam kết học tập (15 phút, 30 phút hoặc 45 phút/ngày). Hệ thống tự đề xuất lộ trình tối ưu cho bạn.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200/70 shadow-sm space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-secondary-500 text-gray-950 flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">Học Vi Mô Đa Phương Tiện</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Học qua các khối kiến thức vi mô: Video khẩu hình chuẩn, Audio bản ngữ, Luyện viết chữ Hán và Hội thoại thực chiến ngắn gọn, dễ nhớ.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200/70 shadow-sm space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-accent-600 text-white flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900">Ôn Tập SRS & Vượt Bài Thi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ôn luyện 25 từ trọng tâm mỗi ngày bằng thuật toán SM-2. Làm bài thi đánh giá đạt ≥ 80% để mở khóa cấp độ tiếp theo và nhận chứng nhận số.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 5. CALL TO ACTION (CONVERSION BANNER)                                   */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-8 sm:p-14 text-white overflow-hidden shadow-2xl shadow-primary-900/20">
          {/* Subtle Decorative Pattern */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none"
          />

          <div className="relative max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              Bắt đầu hoàn toàn miễn phí
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Sẵn sàng bắt đầu hành trình nói tiếng Trung lưu loát?
            </h2>

            <p className="text-sm sm:text-base text-primary-100 font-normal leading-relaxed max-w-2xl">
              Đăng ký tài khoản trong 30 giây bằng địa chỉ Gmail của bạn. Trải nghiệm hệ thống học vi mô chuẩn quốc tế ngay hôm nay.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#/login?tab=register"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-primary-900 hover:bg-gray-100 active:scale-[0.98] font-bold text-base shadow-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
              >
                <span>Tạo Tài Khoản Học Thử Ngay</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="#/login"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-white/30 hover:bg-white/10 text-white font-semibold text-base transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
