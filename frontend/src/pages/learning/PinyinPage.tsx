import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { celebrateSuccess } from '../../lib/celebration';
import { PitchVisualizer } from '../../components/PitchVisualizer';
import { GlassCard, SpotlightCard, ShimmerButton, NumberTicker } from '../../components/ui';
import {
  PINYIN_INITIALS_DATA,
  PINYIN_FINALS_DATA,
  PINYIN_WHOLE_SYLLABLES_DATA,
  FALLBACK_MINIMAL_PAIRS,
  PinyinCharItem,
} from './pinyin.data';
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
  Grid,
} from 'lucide-react';

const TONE_SANDHI_RULES = [
  {
    title: 'Biến điệu Thanh 3 + Thanh 3',
    formula: 'Thanh 3 + Thanh 3 → Thanh 2 + Thanh 3',
    badge: 'Phổ biến nhất',
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
    examples: [
      { hanzi: '不是', raw: 'bù + shì', spoken: 'bú shì', vi: 'Không phải' },
      { hanzi: '不去', raw: 'bù + qù', spoken: 'bú qù', vi: 'Không đi' },
      { hanzi: '不对', raw: 'bù + duì', spoken: 'bú duì', vi: 'Không đúng' },
    ],
  },
  {
    title: 'Biến điệu chữ 一 (yī)',
    formula: '一 + Thanh 4 → yí | 一 + Thanh 1/2/3 → yì',
    badge: 'Chuẩn phổ thông',
    examples: [
      { hanzi: '一个', raw: 'yī + gè', spoken: 'yí gè', vi: 'Một cái' },
      { hanzi: '一天', raw: 'yī + tiān', spoken: 'yì tiān', vi: 'Một ngày' },
      { hanzi: '一起', raw: 'yī + qǐ', spoken: 'yì qǐ', vi: 'Cùng nhau' },
    ],
  },
];

function groupBy<T extends { group: string }>(items: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const arr = map.get(item.group) || [];
    arr.push(item);
    map.set(item.group, arr);
  }
  return Array.from(map.entries());
}

export const PinyinPage: React.FC = () => {
  const [tab, setTab] = useState<'ALPHABET' | 'TONE' | 'MINIMAL_PAIRS'>('ALPHABET');
  const [alphabetSub, setAlphabetSub] = useState<'ALL' | 'INITIAL' | 'FINAL' | 'WHOLE'>('ALL');
  const [dbGuides, setDbGuides] = useState<Record<string, string>>({});
  const [minimalPairs, setMinimalPairs] = useState<any[]>(FALLBACK_MINIMAL_PAIRS);
  const [activeChar, setActiveChar] = useState<PinyinCharItem>(PINYIN_INITIALS_DATA[0]);

  // Minimal Pairs Quiz state
  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [secretSound, setSecretSound] = useState<'primary' | 'contrasting'>('primary');
  const [streak, setStreak] = useState(0);

  // Merge DB pronunciation guides & minimal pairs if backend has them, while ALWAYS guaranteeing instant complete alphabet!
  useEffect(() => {
    Promise.all([
      api.get<any[]>('/learning/pinyin').catch(() => []),
      api.get<any[]>('/learning/pinyin/minimal-pairs').catch(() => []),
    ]).then(([list, pairs]) => {
      if (Array.isArray(list) && list.length > 0) {
        const guideMap: Record<string, string> = {};
        for (const row of list) {
          if (row.syllable && row.mouthShapeGuide) {
            guideMap[row.syllable] = row.mouthShapeGuide;
          }
        }
        setDbGuides(guideMap);
      }
      if (Array.isArray(pairs) && pairs.length > 0) {
        setMinimalPairs(pairs);
      }
      setSecretSound(Math.random() > 0.5 ? 'primary' : 'contrasting');
    });
  }, []);

  const initialGroups = useMemo(() => groupBy(PINYIN_INITIALS_DATA), []);
  const finalGroups = useMemo(() => groupBy(PINYIN_FINALS_DATA), []);
  const speakLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of [
      ...PINYIN_INITIALS_DATA,
      ...PINYIN_FINALS_DATA,
      ...PINYIN_WHOLE_SYLLABLES_DATA,
    ]) {
      map.set(item.syllable.toLowerCase(), item.speakHanzi);
    }
    return map;
  }, []);

  const playSound = (text: string, rate = 0.78) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const handleSelectChar = (item: PinyinCharItem) => {
    setActiveChar(item);
    playSound(item.speakHanzi, 0.75);
  };

  const currentPair = minimalPairs[currentPairIdx] || FALLBACK_MINIMAL_PAIRS[0];

  const playSecretAudio = () => {
    if (!currentPair) return;
    const side = secretSound === 'primary' ? currentPair.primary : currentPair.contrasting;
    const rawSyl = side?.syllable ? String(side.syllable).toLowerCase() : '';
    const text = side?.speak || speakLookup.get(rawSyl) || side?.syllable;
    if (text) playSound(text, 0.72);
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
    { key: 'ALPHABET' as const, label: 'Bảng chữ cái Pinyin (63 âm)', icon: Grid },
    { key: 'TONE' as const, label: '4 Thanh điệu & Biến điệu', icon: Waves },
    { key: 'MINIMAL_PAIRS' as const, label: 'Luyện nghe phân biệt', icon: Headphones },
  ];

  const renderCharCard = (item: PinyinCharItem) => {
    const isSelected = activeChar.syllable === item.syllable && activeChar.category === item.category;
    return (
      <button
        key={`${item.category}-${item.syllable}`}
        type="button"
        onClick={() => handleSelectChar(item)}
        className={`p-3 rounded-xl border text-center transition-colors duration-150 cursor-pointer group ${
          isSelected
            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
            : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-hanzi-serif font-semibold ${
              isSelected ? 'text-zinc-300' : 'text-zinc-400'
            }`}
          >
            {item.speakHanzi}
          </span>
          <Volume2
            className={`w-3.5 h-3.5 ${
              isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-[#BE123C]'
            }`}
          />
        </div>
        <span className="text-xl font-display font-bold block tracking-tight mt-0.5">
          {item.syllable}
        </span>
        <span
          className={`text-[10px] font-medium block mt-1 truncate ${
            isSelected ? 'text-zinc-300' : 'text-zinc-500'
          }`}
        >
          {item.vnHint}
        </span>
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-5 sm:px-8 space-y-6">
      {/* Crisp Architectural Header Card */}
      <div className="rounded-2xl p-6 sm:p-7 ios-hero-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[#BE123C] font-semibold">
              <Mic className="w-3.5 h-3.5" />
              Bảng chữ cái Pinyin tiếng Trung chuẩn
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight">
              Bảng Chữ Cái Pinyin & 4 Thanh Điệu
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Đầy đủ <strong className="text-zinc-900 font-semibold">23 thanh mẫu</strong>,{' '}
              <strong className="text-zinc-900 font-semibold">24 vận mẫu</strong>,{' '}
              <strong className="text-zinc-900 font-semibold">16 âm tiết đọc thẳng</strong>, 4 thanh điệu và luyện nghe phân biệt cặp âm dễ nhầm.
            </p>
          </div>
          <ShimmerButton href="#/speak-practice" className="shrink-0">
            <Mic className="w-4 h-4" />
            <span>Sang mục Luyện nói</span>
            <ArrowRight className="w-4 h-4" />
          </ShimmerButton>
        </div>
      </div>

      {/* Main Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 w-fit mx-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-[13px] transition-colors cursor-pointer ${
                active ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="pinyin-main-tab"
                  transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                  className="absolute inset-0 rounded-lg bg-zinc-900 shadow-xs"
                />
              )}
              <Icon className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: FULL CHINESE PINYIN ALPHABET CHART */}
        {tab === 'ALPHABET' && (
          <motion.div
            key="tab-alphabet"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Active Letter Guide & 4-Tone Interactive Bar */}
            <GlassCard className="p-5 sm:p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => playSound(activeChar.speakHanzi, 0.75)}
                  className="w-15 h-15 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex flex-col items-center justify-center shrink-0 cursor-pointer transition-colors"
                  title="Nghe phát âm mẫu"
                >
                  <span className="text-2xl font-display font-bold leading-none">
                    {activeChar.syllable}
                  </span>
                  <span className="text-[11px] font-hanzi-serif text-zinc-300 mt-1">
                    {activeChar.speakHanzi}
                  </span>
                </button>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[#BE123C] text-[11px] font-semibold">
                      {activeChar.group}
                    </span>
                    <span className="text-xs font-medium text-zinc-600">
                      Đọc gần giống: <strong className="text-zinc-950 font-semibold">{activeChar.vnHint}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {dbGuides[activeChar.syllable] || activeChar.guide}
                  </p>
                </div>
              </div>

              {/* 4-Tone Chips for selected letter */}
              {activeChar.tones && activeChar.toneHanzi && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeChar.tones.map((toneLabel, idx) => (
                    <button
                      key={toneLabel}
                      type="button"
                      onClick={() => playSound(activeChar.toneHanzi![idx], 0.72)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-mono font-semibold text-zinc-900 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#BE123C]" />
                      <span>{toneLabel}</span>
                      <span className="font-hanzi-serif text-zinc-400">
                        {activeChar.toneHanzi![idx]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Quick Section Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL' as const, label: 'Tất cả (63)' },
                { id: 'INITIAL' as const, label: '23 Thanh mẫu (Phụ âm đầu)' },
                { id: 'FINAL' as const, label: '24 Vận mẫu (Nguyên âm)' },
                { id: 'WHOLE' as const, label: '16 Âm tiết đọc thẳng' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setAlphabetSub(sub.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    alphabetSub === sub.id
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Section 1: 23 Thanh mẫu */}
            {(alphabetSub === 'ALL' || alphabetSub === 'INITIAL') && (
              <GlassCard className="p-5 sm:p-6 rounded-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-display font-bold text-zinc-950">
                      1. 23 Thanh mẫu (Phụ âm đầu — 声母)
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Bấm vào từng chữ cái để nghe phát âm chuẩn và xem hướng dẫn khẩu hình
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-mono font-semibold shrink-0">
                    23 âm
                  </span>
                </div>

                <div className="space-y-4">
                  {initialGroups.map(([groupName, items]) => (
                    <div key={groupName} className="space-y-2">
                      <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                        {groupName}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {items.map(renderCharCard)}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Section 2: 24 Vận mẫu */}
            {(alphabetSub === 'ALL' || alphabetSub === 'FINAL') && (
              <GlassCard className="p-5 sm:p-6 rounded-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-display font-bold text-zinc-950">
                      2. 24 Vận mẫu (Nguyên âm — 韵母)
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Gồm 6 vận mẫu đơn, 9 vận mẫu kép, 5 vận mẫu mũi trước và 4 vận mẫu mũi sau
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-mono font-semibold shrink-0">
                    24 âm
                  </span>
                </div>

                <div className="space-y-4">
                  {finalGroups.map(([groupName, items]) => (
                    <div key={groupName} className="space-y-2">
                      <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                        {groupName}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {items.map(renderCharCard)}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Section 3: 16 Âm tiết đọc thẳng */}
            {(alphabetSub === 'ALL' || alphabetSub === 'WHOLE') && (
              <GlassCard className="p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-display font-bold text-zinc-950">
                      3. 16 Âm tiết đọc thẳng (整体认读音节)
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Nhóm âm tiết đọc liền nguyên âm, không cần ghép đánh vần tách rời
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-mono font-semibold shrink-0">
                    16 âm
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                  {PINYIN_WHOLE_SYLLABLES_DATA.map(renderCharCard)}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* TAB 2: 4 Tones + Tone Sandhi Rules */}
        {tab === 'TONE' && (
          <motion.div
            key="tab-tone"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <GlassCard className="p-5 bg-white border-zinc-200 text-sm text-zinc-700 leading-relaxed">
              <strong className="text-zinc-950">Thang cao độ 5 bậc:</strong> Cao độ giọng nói chia từ 1 (thấp nhất) đến 5 (cao nhất).
              Thanh 1 giữ phẳng <strong className="text-zinc-950">55</strong>, Thanh 2 lên cao{' '}
              <strong className="text-zinc-950">35</strong>, Thanh 3 hạ xuống rồi đi lên{' '}
              <strong className="text-zinc-950">214</strong>, Thanh 4 xuống dứt khoát{' '}
              <strong className="text-zinc-950">51</strong>.
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PitchVisualizer tone={1} contour="55 - Cao bằng" syllable="mā (Mẹ)" />
              <PitchVisualizer tone={2} contour="35 - Lên cao" syllable="má (Cây gai)" />
              <PitchVisualizer tone={3} contour="214 - Xuống rồi lên" syllable="mǎ (Con ngựa)" />
              <PitchVisualizer tone={4} contour="51 - Dứt khoát" syllable="mà (Mắng)" />
            </div>

            {/* Tone Sandhi Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-bold text-zinc-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#BE123C]" />
                <span>3 Quy tắc biến điệu cần nhớ khi giao tiếp</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TONE_SANDHI_RULES.map((rule) => (
                  <SpotlightCard key={rule.title} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200">
                        {rule.badge}
                      </span>
                      <h3 className="text-[15px] font-display font-bold text-zinc-950">{rule.title}</h3>
                      <p className="text-xs font-semibold text-[#BE123C]">{rule.formula}</p>
                    </div>
                    <div className="space-y-2">
                      {rule.examples.map((ex) => (
                        <button
                          key={ex.hanzi}
                          type="button"
                          onClick={() => playSound(ex.hanzi, 0.8)}
                          className="w-full p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-hanzi-serif font-bold text-base text-zinc-950 mr-2">
                              {ex.hanzi}
                            </span>
                            <span className="text-xs text-zinc-400 line-through mr-1.5">{ex.raw}</span>
                            <span className="text-xs font-semibold text-emerald-700">→ {ex.spoken}</span>
                            <p className="text-[11px] text-zinc-500">{ex.vi}</p>
                          </div>
                          <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: Minimal Pairs Listening Challenge */}
        {tab === 'MINIMAL_PAIRS' && (
          <motion.div
            key="tab-pairs"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <GlassCard className="p-6 sm:p-8 text-center space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-mono font-semibold">
                  Cặp âm {minimalPairs.length > 0 ? `${currentPairIdx + 1}/${minimalPairs.length}` : '0'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5 text-[#BE123C]" />
                  Chuỗi đúng: <NumberTicker value={streak} />
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold text-zinc-950">
                  Phân biệt cặp âm dễ nhầm
                </h3>
                <p className="text-xs text-zinc-500">
                  Bấm nút loa để nghe phát âm và chọn đúng âm bạn nghe thấy
                </p>
              </div>

              <div className="py-2">
                <button
                  type="button"
                  onClick={playSecretAudio}
                  className="w-20 h-20 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center mx-auto shadow-sm transition-colors cursor-pointer"
                  aria-label="Nghe âm mẫu"
                >
                  <Volume2 className="w-8 h-8" />
                </button>
              </div>

              {currentPair && (
                <div className="grid grid-cols-2 gap-3.5">
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
                        className={`p-5 rounded-xl border text-3xl font-display font-bold transition-colors cursor-pointer ${
                          selectedAnswer !== null
                            ? isRight
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : chosen
                                ? 'border-rose-400 bg-rose-50 text-rose-800'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                            : 'border-zinc-200 bg-white hover:border-zinc-900 text-zinc-950'
                        }`}
                      >
                        {data.syllable}
                        <span className="block text-xs font-medium text-zinc-400 mt-1">
                          Chọn âm này
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {quizFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    quizFeedback.isCorrect
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {quizFeedback.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#BE123C] shrink-0" />
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
