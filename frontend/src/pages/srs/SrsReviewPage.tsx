import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { celebrateSuccess } from '../../lib/celebration';
import { appNotice } from '../../lib/dialog';
import { GlassCard, ShimmerButton } from '../../components/ui';
import {
  Brain,
  Volume2,
  RotateCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

type RatingValue = 'again' | 'hard' | 'good' | 'easy';

const CARD_DECK_VARIANTS = {
  enter: {
    opacity: 0,
    scale: 0.94,
    y: 22,
    rotateZ: 0,
  },
  center: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateZ: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 280,
      damping: 26,
      mass: 0.85,
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * 145,
    y: -14,
    rotateZ: dir * 6,
    scale: 0.95,
    transition: {
      duration: 0.24,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  }),
};

export const SrsReviewPage: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  // Keyed flip state ensures an exiting rated card stays on its back face while the next card enters face-up
  const [flippedCardKey, setFlippedCardKey] = useState<string | number | null>(null);
  const [flipSeq, setFlipSeq] = useState(0);
  const [exitDirection, setExitDirection] = useState<number>(1);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);

  const currentCard = cards[currentIdx];
  const activeCardKey = currentCard ? (currentCard.charId ?? currentIdx) : null;
  const isFlipped = activeCardKey !== null && flippedCardKey === activeCardKey;

  useEffect(() => {
    loadQueue();
    loadStats();
  }, []);

  const loadQueue = async () => {
    try {
      const data = await api.get<any>('/srs/queue?limit=25');
      setCards(data.cards || []);
      setCurrentIdx(0);
      setFlippedCardKey(null);
    } catch (err) {
      console.error('Failed to load SRS queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await api.get<any>('/srs/stats');
      setStats(s);
    } catch (err) {
      console.error('Failed to load SRS stats:', err);
    }
  };

  const toggleFlip = useCallback(() => {
    if (activeCardKey === null) return;
    setFlippedCardKey((prev) => (prev === activeCardKey ? null : activeCardKey));
    setFlipSeq((n) => n + 1);
  }, [activeCardKey]);

  const playSpeech = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleRate = useCallback(
    async (rating: RatingValue) => {
      const card = cards[currentIdx];
      if (!card || isReviewing) return;

      const dir = rating === 'again' || rating === 'hard' ? -1 : 1;
      setExitDirection(dir);
      setIsReviewing(true);

      try {
        await api.post('/srs/review', {
          char_id: card.charId,
          rating,
        });

        if (currentIdx < cards.length - 1) {
          if (rating === 'good' || rating === 'easy') {
            celebrateSuccess(
              rating === 'easy' ? 'Nhớ rất tốt (+10 XP)' : 'Ghi nhớ tốt (+5 XP)',
              'sparkle'
            );
          }
          // Keep flippedCardKey pointing to the old card while it glides out; next card enters face-up automatically
          setCurrentIdx((prev) => prev + 1);
        } else {
          celebrateSuccess(
            'Hoàn thành phiên ôn tập hôm nay',
            'fireworks',
            'Bạn đã ôn hết các thẻ từ vựng đến hạn.'
          );
          setFlippedCardKey(null);
          setCards([]);
          loadStats();
        }
      } catch (err: any) {
        appNotice(err.message || 'Lỗi khi ghi nhận đánh giá.', 'error');
      } finally {
        setIsReviewing(false);
      }
    },
    [cards, currentIdx, isReviewing]
  );

  // Keyboard shortcuts: Space/Enter flip, 1-4 rate when flipped, R replay audio
  useEffect(() => {
    const activeCard = cards[currentIdx];
    if (!activeCard) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playSpeech(activeCard.character);
      } else if (isFlipped && !isReviewing) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cards, currentIdx, isFlipped, isReviewing, toggleFlip, playSpeech, handleRate]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="h-16 rounded-3xl glass-card-grid animate-pulse" />
        <div className="h-88 rounded-3xl glass-card-grid animate-pulse" />
      </div>
    );
  }

  const remainingCards = Math.max(0, cards.length - currentIdx - 1);
  const previews = currentCard?.intervalPreviews || {
    again: { label: '1 ngày' },
    hard: { label: '2 ngày' },
    good: { label: '6 ngày' },
    easy: { label: '12 ngày' },
  };

  const progressPct = cards.length > 0 ? Math.round(((currentIdx + 1) / cards.length) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header & Review Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#C41E3A] text-white flex items-center justify-center shadow-md shadow-[#C41E3A]/20">
            <Brain className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-display font-extrabold text-gray-900">
            Ôn tập thẻ nhớ
          </h2>
        </div>

        {stats && (
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full glass-light text-xs font-semibold text-gray-600">
            <span>
              Đến hạn: <strong className="text-[#C41E3A] dark:text-rose-400 font-mono">{stats.dueToday}</strong>
            </span>
            <span>•</span>
            <span>
              Đã thuộc: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{stats.masteredCards}</strong>
            </span>
          </div>
        )}
      </div>

      {cards.length > 0 && currentCard ? (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>
              Thẻ <strong className="text-gray-900">{currentIdx + 1}</strong> / {cards.length}
            </span>
            <div className="w-40 h-2 bg-white/75 dark:bg-slate-800 border border-white dark:border-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#C41E3A] to-[#D4A017] rounded-full"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              />
            </div>
          </div>

          {/* 3D Physical Perspective Flashcard Stack */}
          <div className="relative pb-4">
            {/* Stacked Deck Depth Cards underneath */}
            {remainingCards >= 2 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 bottom-0 top-5 rounded-[28px] bg-[#FCFBF8]/55 dark:bg-[#141c2b]/45 border border-[#1C1917]/8 dark:border-white/8 scale-[0.94] translate-y-2 transition-transform duration-300"
              />
            )}
            {remainingCards >= 1 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 bottom-1.5 top-2.5 rounded-[28px] bg-[#FCFBF8]/75 dark:bg-[#141c2b]/70 border border-[#1C1917]/10 dark:border-white/10 shadow-sm scale-[0.97] translate-y-1 transition-transform duration-300"
              />
            )}

            <AnimatePresence mode="wait" custom={exitDirection}>
              <motion.div
                key={currentCard.charId ?? currentIdx}
                custom={exitDirection}
                variants={CARD_DECK_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ perspective: 1400 }}
                className="relative z-10"
              >
                <motion.div
                  onClick={toggleFlip}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      toggleFlip();
                    }
                  }}
                  aria-label={isFlipped ? 'Lật lại mặt chữ Hán' : 'Lật thẻ để xem đáp án'}
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.992 }}
                  transition={{
                    rotateY: {
                      type: 'spring',
                      stiffness: 220,
                      damping: 24,
                      mass: 0.95,
                    },
                    y: { duration: 0.2 },
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="grid grid-cols-1 grid-rows-1 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] rounded-[28px]"
                >
                  {/* ── FRONT FACE (HANZI) ── */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="col-start-1 row-start-1 min-h-[360px] rounded-[28px] p-7 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#FCFBF8]/95 dark:bg-[#141c2b]/95 backdrop-blur-xl border border-[#1C1917]/10 dark:border-white/12 shadow-[0_22px_50px_-24px_rgba(28,25,23,0.28)]"
                  >
                    {/* Subtle TianZiGe hairline watermark behind character */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 200 200"
                      className="pointer-events-none absolute w-56 h-56 opacity-[0.07] dark:opacity-[0.09] text-[#C41E3A]"
                    >
                      <rect x="8" y="8" width="184" height="184" rx="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="100" y1="8" x2="100" y2="192" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
                      <line x1="8" y1="100" x2="192" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
                    </svg>

                    {/* Specular light sweep on flip */}
                    <motion.div
                      key={`sheen-f-${flipSeq}`}
                      aria-hidden="true"
                      initial={{ x: '-130%', opacity: 0 }}
                      animate={{ x: '150%', opacity: [0, 0.45, 0] }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                      className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 dark:via-white/15 to-transparent"
                    />

                    {/* Corner Header Labels */}
                    <span className="absolute top-4 left-4 text-[11px] font-bold tracking-wide text-gray-500 bg-white/80 dark:bg-slate-800/80 border border-[#1C1917]/8 dark:border-white/10 px-3 py-1 rounded-full">
                      Chữ Hán
                    </span>

                    <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white/80 dark:bg-slate-800/80 border border-[#1C1917]/8 dark:border-white/10 px-3 py-1 rounded-full">
                      <RotateCw className="w-3 h-3 text-[#C41E3A] dark:text-rose-400" />
                      <span>Bấm để lật</span>
                    </span>

                    <div className="relative z-10 space-y-5 flex flex-col items-center">
                      <span className="text-8xl sm:text-9xl font-hanzi-serif font-bold text-gray-900 leading-none tracking-tight">
                        {currentCard.character}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSpeech(currentCard.character);
                        }}
                        className="w-11 h-11 rounded-full bg-white/90 dark:bg-slate-800 hover:bg-[#C41E3A] text-[#C41E3A] dark:text-rose-400 hover:text-white border border-[#1C1917]/10 dark:border-white/15 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                        title="Nghe phát âm (Phím R)"
                        aria-label="Nghe phát âm"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>

                      <p className="text-xs text-gray-500 max-w-xs">
                        Bạn có nhớ cách đọc Pinyin và nghĩa của chữ này không?
                      </p>
                    </div>
                  </div>

                  {/* ── BACK FACE (PINYIN + MEANING + DETAILS) ── */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                    className="col-start-1 row-start-1 min-h-[360px] rounded-[28px] p-7 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-b from-[#FCFBF8] via-[#FAF6EE] to-[#F7F1E3] dark:from-[#162033] dark:via-[#141c2b] dark:to-[#111826] border border-[#D4A017]/35 dark:border-amber-400/25 shadow-[0_24px_54px_-22px_rgba(196,30,58,0.22)]"
                  >
                    {/* Specular light sweep on reveal */}
                    <motion.div
                      key={`sheen-b-${flipSeq}`}
                      aria-hidden="true"
                      initial={{ x: '-130%', opacity: 0 }}
                      animate={{ x: '150%', opacity: [0, 0.5, 0] }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-amber-100/70 dark:via-amber-300/15 to-transparent"
                    />

                    {/* Top-left compact Hanzi reminder */}
                    <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 dark:bg-slate-800/85 border border-[#D4A017]/25 dark:border-white/10">
                      <span className="font-hanzi-serif font-bold text-base text-gray-900 leading-none">
                        {currentCard.character}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                        Đáp án
                      </span>
                    </div>

                    <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-white/80 dark:bg-slate-800/80 border border-[#1C1917]/8 dark:border-white/10 px-3 py-1 rounded-full">
                      <RotateCw className="w-3 h-3 text-[#D4A017]" />
                      <span>Lật lại</span>
                    </span>

                    <div className="relative z-10 space-y-4 flex flex-col items-center pt-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl sm:text-4xl font-pinyin font-extrabold text-[#C41E3A] dark:text-rose-400">
                          {currentCard.pinyin}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSpeech(currentCard.character);
                          }}
                          className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800 hover:bg-[#C41E3A] text-[#C41E3A] dark:text-rose-400 hover:text-white border border-[#1C1917]/10 dark:border-white/15 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="Nghe phát âm (Phím R)"
                          aria-label="Nghe phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {currentCard.sinoVietnamese && (
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-400/20 dark:bg-amber-900/35 border border-amber-300/60 dark:border-amber-700/50 px-3 py-0.5 rounded-full inline-block">
                            Hán-Việt: {currentCard.sinoVietnamese}
                          </span>
                        )}
                        <p className="text-xl sm:text-2xl font-display font-extrabold text-gray-900">
                          {currentCard.meaning}
                        </p>
                      </div>

                      {currentCard.radical && (
                        <span className="text-xs bg-white/80 dark:bg-slate-800/80 border border-[#1C1917]/8 dark:border-white/10 text-gray-600 px-3.5 py-1 rounded-full font-medium">
                          Bộ thủ: {currentCard.radical} • {currentCard.strokesCount} nét
                        </span>
                      )}

                      <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 pt-1 font-mono">
                        <Sparkles className="w-3 h-3 text-[#D4A017]" />
                        <span>Đã ôn: {currentCard.repetitions} lần</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Animated Action Area: Flip Button ↔ 4 SRS Rating Cards */}
          <AnimatePresence mode="wait">
            {isFlipped ? (
              <motion.div
                key="rating-controls"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-2.5"
              >
                <span className="text-xs text-center block text-gray-500 font-medium">
                  Chọn mức độ nhớ để lên lịch ôn lại phù hợp:
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'again' as RatingValue,
                      keycap: '1',
                      label: 'Quên',
                      sub: previews.again.label,
                      cls: 'bg-rose-50/90 hover:bg-rose-100/95 border-rose-200/85 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 dark:border-rose-800/70 dark:text-rose-300',
                      subCls: 'text-rose-500 dark:text-rose-400',
                    },
                    {
                      id: 'hard' as RatingValue,
                      keycap: '2',
                      label: 'Khó',
                      sub: previews.hard.label,
                      cls: 'bg-amber-50/90 hover:bg-amber-100/95 border-amber-200/85 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 dark:border-amber-800/70 dark:text-amber-300',
                      subCls: 'text-amber-600 dark:text-amber-400',
                    },
                    {
                      id: 'good' as RatingValue,
                      keycap: '3',
                      label: 'Tốt',
                      sub: previews.good.label,
                      cls: 'bg-sky-50/90 hover:bg-sky-100/95 border-sky-200/85 text-sky-700 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 dark:border-sky-800/70 dark:text-sky-300',
                      subCls: 'text-sky-600 dark:text-sky-400',
                    },
                    {
                      id: 'easy' as RatingValue,
                      keycap: '4',
                      label: 'Dễ',
                      sub: previews.easy.label,
                      cls: 'bg-emerald-50/90 hover:bg-emerald-100/95 border-emerald-200/85 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 dark:border-emerald-800/70 dark:text-emerald-300',
                      subCls: 'text-emerald-600 dark:text-emerald-400',
                    },
                  ].map((btn, i) => (
                    <motion.button
                      key={btn.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.035 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleRate(btn.id)}
                      disabled={isReviewing}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border font-bold transition-colors disabled:opacity-65 cursor-pointer shadow-xs ${btn.cls}`}
                    >
                      <span className="hidden sm:inline-flex absolute top-1.5 right-2 text-[9px] font-mono opacity-55">
                        {btn.keycap}
                      </span>
                      <span className="text-sm">{btn.label}</span>
                      <span className={`text-[10px] font-normal mt-0.5 ${btn.subCls}`}>
                        {btn.sub}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="flip-cta"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <ShimmerButton
                  type="button"
                  onClick={toggleFlip}
                  size="lg"
                  className="w-full"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Xem đáp án</span>
                </ShimmerButton>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="hidden sm:block text-center text-[11px] text-gray-400 font-medium">
            Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-white/75 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 font-mono text-[10px]">Space</kbd> lật thẻ ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/75 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 font-mono text-[10px]">1–4</kbd> đánh giá ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/75 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 font-mono text-[10px]">R</kbd> nghe phát âm
          </p>
        </div>
      ) : (
        <GlassCard className="rounded-[28px] p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-display font-bold text-gray-900">
              Bạn đã ôn hết thẻ hôm nay
            </h3>
            <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
              Toàn bộ thẻ từ vựng đến hạn hôm nay đã được hoàn thành. Bạn có thể học thêm bài mới trong lộ trình.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <ShimmerButton href="#/courses" size="md">
              Học bài mới trong lộ trình
            </ShimmerButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
