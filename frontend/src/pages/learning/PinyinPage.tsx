import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { celebrateSuccess } from '../../lib/celebration';
import { PitchVisualizer } from '../../components/PitchVisualizer';
import { GlassCard, SpotlightCard, BorderBeam, ShimmerButton, NumberTicker } from '../../components/ui';
import {
  Volume2,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Mic,
  Headphones,
  Flame,
  Waves,
} from 'lucide-react';

const TONE_SANDHI_RULES = [
  {
    title: 'Biến điệu Thanh 3 + Thanh 3',
    formula: 'Thanh 3 + Thanh 3 → Thanh 2 + Thanh 3',
    badge: 'Cực kỳ phổ biến',
    gradient: 'from-rose-500 to-amber-500',
    examples: [
      { hanzi: '你好', raw: 'nǐ + hǎo', spoken: 'ní hǎo', vi: 'Xin chào' },
      { hanzi: '很好', raw: 'hěn + hǎo', spoken: 'hén hǎo', vi: 'Rất tốt' },
      { hanzi: '可以', raw: 'kě + yǐ', spoken: 'ké yǐ', vi: 'Có thể' },
    ],
  },
  {
    title: 'Biến điệu chữ 不 (bù)',
    formula: '不 + Thanh 4 → bú + Thanh 4',
    badge: 'Hay nhầm khi nói',
    gradient: 'from-violet-500 to-fuchsia-500',
    examples: [
      { hanzi: '不是', raw: 'bù + shì', spoken: 'bú shì', vi: 'Không phải' },
      { hanzi: '不去', raw: 'bù + qù', spoken: 'bú qù', vi: 'Không đi' },
      { hanzi: '不对', raw: 'bù + duì', spoken: 'bú duì', vi: 'Không đúng' },
    ],
  },
  {
    title: 'Biến điệu chữ 一 (yī)',
    formula: '一 + Thanh 4 → yí | 一 + Thanh 1/2/3 → yì',
    badge: 'Chuẩn Bắc Kinh',
    gradient: 'from-emerald-500 to-cyan-500',
    examples: [
      { hanzi: '一个', raw: 'yī + gè', spoken: 'yí gè', vi: 'Một cái' },
      { hanzi: '一天', raw: 'yī + tiān', spoken: 'yì tiān', vi: 'Một ngày' },
      { hanzi: '一起', raw: 'yī + qǐ', spoken: 'yì qǐ', vi: 'Cùng nhau' },
    ],
  },
];

export const PinyinPage: React.FC = () => {
  const [tab, setTab] = useState<'TONE' | 'INITIAL' | 'FINAL' | 'MINIMAL_PAIRS'>('TONE');
  const [pinyinList, setPinyinList] = useState<any[]>([]);
  const [minimalPairs, setMinimalPairs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSyl, setActiveSyl] = useState<any | null>(null);

  // Minimal Pairs Quiz state
  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [secretSound, setSecretSound] = useState<'primary' | 'contrasting'>('primary');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get<any[]>('/learning/pinyin').catch(() => []),
      api.get<any[]>('/learning/pinyin/minimal-pairs').catch(() => []),
    ]).then(([list, pairs]) => {
      setPinyinList(list || []);
      setMinimalPairs(pairs || []);
      setSecretSound(Math.random() > 0.5 ? 'primary' : 'contrasting');
      setIsLoading(false);
    });
  }, []);

  const playSound = (text: string, rate = 0.78) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const initials = pinyinList.filter((p) => p.category === 'INITIAL');
  const finals = pinyinList.filter((p) => p.category === 'FINAL');
  const currentPair = minimalPairs[currentPairIdx];

  const playSecretAudio = () => {
    if (!currentPair) return;
    const targetSyl =
      secretSound === 'primary' ? currentPair.primary.syllable : currentPair.contrasting?.syllable;
    if (targetSyl) playSound(targetSyl, 0.72);
  };

  const handleChooseAnswer = (chosen: 'primary' | 'contrasting') => {
    setSelectedAnswer(chosen);
    const isCorrect = chosen === secretSound;
    const nextStreak = isCorrect ? streak + 1 : 0;
    setStreak(nextStreak);
    if (isCorrect) {
      celebrateSuccess(
        nextStreak >= 3 ? `Chuỗi ${nextStreak} câu đúng liên tiếp` : 'Chính xác (+10 XP)',
        nextStreak >= 3 ? 'confetti' : 'sparkle',
        'Bạn phân biệt thanh điệu rất chuẩn.'
      );
    }
    setQuizFeedback({
      isCorrect,
      message: isCorrect
        ? 'Chuẩn xác! Tai nghe thanh điệu và độ bật hơi của bạn rất nhạy.'
        : 'Chưa đúng rồi! Hãy để ý độ bật hơi hoặc âm mũi trước/sau và nghe lại nhé.',
    });
  };

  const handleNextPair = () => {
    setSelectedAnswer(null);
    setQuizFeedback(null);
    setSecretSound(Math.random() > 0.5 ? 'primary' : 'contrasting');
    if (minimalPairs.length > 0) {
      setCurrentPairIdx((prev) => (prev + 1) % minimalPairs.length);
    }
  };

  const tabs = [
    { key: 'TONE' as const, label: '4 Thanh điệu & Biến điệu', icon: Waves },
    { key: 'INITIAL' as const, label: `21 Thanh mẫu (${initials.length})`, icon: Mic },
    { key: 'FINAL' as const, label: `24 Vận mẫu (${finals.length})`, icon: Sparkles },
    { key: 'MINIMAL_PAIRS' as const, label: 'Luyện nghe phân biệt', icon: Headphones },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-7">
      {/* Pastel Speaking Hero Header */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-violet-100/92 via-rose-50/90 to-sky-100/90 border border-white/95 backdrop-blur-2xl shadow-[0_14px_38px_-14px_rgba(148,163,184,0.25),inset_0_1.5px_1px_rgba(255,255,255,0.96)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/75 border border-white text-xs font-extrabold uppercase tracking-wider text-violet-700">
              <Mic className="w-3.5 h-3.5" />
              Phát âm tiếng Trung chuẩn phổ thông
            </span>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
              Hệ Thống Phát Âm Pinyin, Thanh Điệu & Biến Điệu
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Luyện 4 thanh điệu, 21 thanh mẫu, 24 vận mẫu, quy tắc biến điệu và phân biệt các cặp âm dễ nhầm.
            </p>
          </div>
          <ShimmerButton
            href="#/speak-practice"
            className="shrink-0"
          >
            <Mic className="w-4 h-4" />
            <span>Sang mục Luyện nói</span>
            <ArrowRight className="w-4 h-4" />
          </ShimmerButton>
        </div>
      </div>

      {/* Vibrant Sliding Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl glass-light w-fit mx-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                active ? 'text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="pinyin-hanpeak-tab"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 shadow-md"
                />
              )}
              <Icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {/* TAB 1: 4 Tones + Hanpeak Tone Sandhi Rules */}
        {tab === 'TONE' && (
          <motion.div
            key="tab-tone"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <GlassCard className="p-5 bg-gradient-to-r from-amber-50/60 via-white/55 to-rose-50/60 border-white/80 text-sm text-gray-800 leading-relaxed">
              <strong>Thang cao độ 5 bậc:</strong> Cao độ giọng nói chia từ 1 (thấp nhất) đến 5 (cao nhất).
              Thanh 1 giữ phẳng <strong>55</strong>, Thanh 2 lên cao <strong>35</strong>, Thanh 3 hạ xuống rồi đi lên <strong>214</strong>, Thanh 4 xuống dứt khoát <strong>51</strong>.
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <PitchVisualizer tone={1} contour="55 - Cao bằng" syllable="mā (Mẹ)" />
              <PitchVisualizer tone={2} contour="35 - Lên cao" syllable="má (Cây gai)" />
              <PitchVisualizer tone={3} contour="214 - Xuống rồi lên" syllable="mǎ (Con ngựa)" />
              <PitchVisualizer tone={4} contour="51 - Dứt khoát" syllable="mà (Mắng)" />
            </div>

            {/* Hanpeak Tone Sandhi Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>3 Quy Tắc Biến Điệu Sống Còn Khi Nói Tự Nhiên</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TONE_SANDHI_RULES.map((rule) => (
                  <SpotlightCard key={rule.title} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${rule.gradient}`}
                      >
                        {rule.badge}
                      </span>
                      <h3 className="text-base font-black text-gray-900">{rule.title}</h3>
                      <p className="text-xs font-bold text-primary-600">{rule.formula}</p>
                    </div>
                    <div className="space-y-2">
                      {rule.examples.map((ex) => (
                        <button
                          key={ex.hanzi}
                          type="button"
                          onClick={() => playSound(ex.hanzi, 0.8)}
                          className="w-full p-2.5 rounded-xl bg-white/80 hover:bg-primary-50 border border-gray-200/70 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-chinese font-black text-lg text-gray-900 mr-2">
                              {ex.hanzi}
                            </span>
                            <span className="text-xs text-gray-400 line-through mr-1.5">{ex.raw}</span>
                            <span className="text-xs font-extrabold text-emerald-700">→ {ex.spoken}</span>
                            <p className="text-[11px] text-gray-500">{ex.vi}</p>
                          </div>
                          <Volume2 className="w-4 h-4 text-primary-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2 & 3: Initials & Finals */}
        {(tab === 'INITIAL' || tab === 'FINAL') && (
          <motion.div
            key={`tab-${tab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {activeSyl && (
              <GlassCard className="p-5 border-2 border-primary-200 bg-gradient-to-r from-primary-50/80 via-white/90 to-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-amber-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
                    {activeSyl.syllable}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-primary-600">
                      Hướng dẫn khẩu hình chuẩn
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {activeSyl.mouthShapeGuide || 'Bấm nút loa để nghe phát âm chuẩn Bắc Kinh.'}
                    </p>
                  </div>
                </div>
                <ShimmerButton
                  type="button"
                  size="sm"
                  onClick={() => playSound(activeSyl.syllable, 0.72)}
                  className="shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe lại “{activeSyl.syllable}”</span>
                </ShimmerButton>
              </GlassCard>
            )}

            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white/70 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
                {(tab === 'INITIAL' ? initials : finals).map((item, idx) => {
                  const isSelected = activeSyl?.syllableId === item.syllableId;
                  return (
                    <motion.button
                      key={item.syllableId}
                      type="button"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: idx * 0.015 }}
                      onClick={() => {
                        setActiveSyl(item);
                        playSound(item.syllable, 0.72);
                      }}
                      className={`p-4 rounded-2xl border text-center transition-[background,border-color,box-shadow] duration-200 cursor-pointer group ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary-600 to-rose-500 text-white border-primary-500 shadow-lg shadow-primary-500/25'
                          : 'glass-card-grid text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-end">
                        <Volume2
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-white' : 'text-gray-300 group-hover:text-primary-500'
                          }`}
                        />
                      </div>
                      <span className="text-3xl font-black block tracking-tight">{item.syllable}</span>
                      <span
                        className={`text-[10px] font-bold block mt-1 truncate ${
                          isSelected ? 'text-white/85' : 'text-gray-400'
                        }`}
                      >
                        Bấm để nghe
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: Minimal Pairs Listening Challenge */}
        {tab === 'MINIMAL_PAIRS' && (
          <motion.div
            key="tab-pairs"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <GlassCard className="p-6 sm:p-8 text-center space-y-6 relative overflow-hidden">
              <BorderBeam duration={8} colorFrom="#10b981" colorTo="#f59e0b" />
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-extrabold">
                  Cặp âm {minimalPairs.length > 0 ? `${currentPairIdx + 1}/${minimalPairs.length}` : '0'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Chuỗi đúng: <NumberTicker value={streak} />
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-display font-extrabold text-gray-900">
                  Phân biệt cặp âm dễ nhầm
                </h3>
                <p className="text-xs text-gray-500">
                  Bấm nút loa để nghe phát âm và chọn đúng âm bạn nghe thấy
                </p>
              </div>

              <div className="py-3">
                <button
                  type="button"
                  onClick={playSecretAudio}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 via-rose-500 to-amber-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-primary-500/35 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  aria-label="Nghe âm thanh bí ẩn"
                >
                  <Volume2 className="w-10 h-10" />
                </button>
              </div>

              {currentPair && (
                <div className="grid grid-cols-2 gap-4">
                  {(['primary', 'contrasting'] as const).map((side) => {
                    const data = side === 'primary' ? currentPair.primary : currentPair.contrasting;
                    if (!data) return null;
                    const chosen = selectedAnswer === side;
                    const isRight = secretSound === side;
                    return (
                      <button
                        key={side}
                        type="button"
                        onClick={() => handleChooseAnswer(side)}
                        disabled={selectedAnswer !== null}
                        className={`p-6 rounded-2xl border-2 text-3xl font-black transition-all cursor-pointer ${
                          selectedAnswer !== null
                            ? isRight
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md'
                              : chosen
                                ? 'border-red-500 bg-red-50 text-red-800'
                                : 'border-gray-200 bg-white/60 text-gray-400'
                            : 'border-gray-200 bg-white/90 hover:border-primary-400 hover:bg-primary-50/40 text-gray-900'
                        }`}
                      >
                        {data.syllable}
                        <span className="block text-xs font-semibold text-gray-400 mt-1">
                          Âm tiết đối lập
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {quizFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 ${
                    quizFeedback.isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {quizFeedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{quizFeedback.message}</span>
                </div>
              )}

              {selectedAnswer && (
                <ShimmerButton type="button" onClick={handleNextPair} className="w-full sm:w-auto">
                  <span>Thử cặp âm tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </ShimmerButton>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
