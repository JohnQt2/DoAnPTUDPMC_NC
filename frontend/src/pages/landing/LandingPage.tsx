import React, { useState } from 'react';
import {
  Volume2,
  ArrowRight,
  BookOpen,
  Mic,
  FileText,
  Route,
  CheckCircle2,
} from 'lucide-react';

const DEMO_CHARACTERS = [
  { hanzi: '你', pinyin: 'nǐ', meaning: 'Bạn' },
  { hanzi: '好', pinyin: 'hǎo', meaning: 'Tốt, khỏe' },
  { hanzi: '学', pinyin: 'xué', meaning: 'Học tập' },
  { hanzi: '汉', pinyin: 'hàn', meaning: 'Chữ Hán' },
];

export const LandingPage: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeChar = DEMO_CHARACTERS[selectedIdx];

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(activeChar.hanzi);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="bg-white text-gray-900">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-950 leading-[1.15]">
              Học Tiếng Trung Dễ Dàng <br />
              Cùng <span className="text-primary-500">Hanzi4u</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Lộ trình học gọn nhẹ chỉ 15 phút mỗi ngày: học phát âm, luyện nói, ghi nhớ từ vựng và làm đề thi HSK ngay trên một nền tảng đơn giản.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <a
                href="#/login?tab=register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-base shadow-lg shadow-primary-500/20 transition-all"
              >
                <span>Bắt đầu học miễn phí</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-base transition-all"
              >
                Đăng nhập
              </a>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                Miễn phí bắt đầu
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                Lộ trình HSK 1 – 6
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                Chỉ 15 phút mỗi ngày
              </span>
            </div>
          </div>

          {/* Simple Interactive Preview Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-5">
              <div className="grid grid-cols-4 gap-2">
                {DEMO_CHARACTERS.map((item, idx) => (
                  <button
                    key={item.hanzi}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`py-2.5 rounded-xl font-chinese font-bold text-lg transition-all cursor-pointer ${
                      idx === selectedIdx
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.hanzi}
                  </button>
                ))}
              </div>

              <div className="text-center py-6 px-4 bg-primary-50/40 rounded-2xl border border-primary-100 tianzige-grid relative space-y-2">
                <button
                  type="button"
                  onClick={handleSpeak}
                  aria-label="Nghe phát âm"
                  className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white text-primary-600 hover:bg-primary-50 border border-primary-200 flex items-center justify-center cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <span className="text-7xl font-bold font-chinese text-gray-900 block">
                  {activeChar.hanzi}
                </span>
                <p className="text-xl font-extrabold text-primary-600">{activeChar.pinyin}</p>
                <p className="text-sm text-gray-600 font-medium">{activeChar.meaning}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Features - Simple & Clean */}
      <section className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <Route className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Lộ trình cá nhân</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Thiết kế sẵn lộ trình theo trình độ và thời gian học của riêng bạn.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Từ vựng & Chữ Hán</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Ôn từ bằng thẻ nhớ thông minh và tập viết chữ Hán từng nét chuẩn.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Học nói & Luyện nói</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Luyện phát âm Pinyin 4 thanh điệu và đọc theo câu giao tiếp hàng ngày.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Đề thi & Tiến độ</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Làm bài kiểm tra nhanh theo cấp độ và theo dõi tiến độ mỗi ngày.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
