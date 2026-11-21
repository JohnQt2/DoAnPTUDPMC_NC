import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { celebrateSuccess } from '../../lib/celebration';
import { appNotice } from '../../lib/dialog';
import { GlassCard, ShimmerButton } from '../../components/ui';
import {
  Brain,
  Volume2,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';

export const SrsReviewPage: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    loadQueue();
    loadStats();
  }, []);

  const loadQueue = async () => {
    try {
      const data = await api.get<any>('/srs/queue?limit=25');
      setCards(data.cards || []);
      setCurrentIdx(0);
      setIsFlipped(false);
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

  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const card = cards[currentIdx];
    if (!card) return;

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
        setCurrentIdx((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        celebrateSuccess(
          'Hoàn thành phiên ôn tập hôm nay',
          'fireworks',
          'Bạn đã ôn hết các thẻ từ vựng đến hạn.'
        );
        setCards([]);
        loadStats();
      }
    } catch (err: any) {
      appNotice(err.message || 'Lỗi khi ghi nhận đánh giá.', 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  const playSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="h-16 rounded-3xl glass-card-grid animate-pulse" />
        <div className="h-80 rounded-3xl glass-card-grid animate-pulse" />
      </div>
    );
  }

  const currentCard = cards[currentIdx];
  const previews = currentCard?.intervalPreviews || {
    again: { label: '1 ngày' },
    hard: { label: '2 ngày' },
    good: { label: '6 ngày' },
    easy: { label: '12 ngày' },
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header & Review Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-amber-500 text-white flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-display font-extrabold text-gray-900">
            Ôn tập thẻ nhớ
          </h2>
        </div>

        {stats && (
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full glass-light text-xs font-semibold text-gray-600">
            <span>
              Đến hạn: <strong className="text-primary-600 font-mono">{stats.dueToday}</strong>
            </span>
            <span>•</span>
            <span>
              Đã thuộc: <strong className="text-emerald-600 font-mono">{stats.masteredCards}</strong>
            </span>
          </div>
        )}
      </div>

      {cards.length > 0 && currentCard ? (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>
              Thẻ {currentIdx + 1} / {cards.length}
            </span>
            <div className="w-36 h-2 bg-white/70 border border-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((currentIdx + 1) / cards.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Complete Liquid Glass Flashcard */}
          <GlassCard
            hoverable
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[340px] rounded-[28px] p-8 flex flex-col items-center justify-center text-center relative select-none"
          >
            <span className="absolute top-4 right-4 text-[11px] font-semibold text-gray-500 bg-white/65 border border-white/85 px-3 py-1 rounded-full">
              Bấm để lật thẻ
            </span>

            {!isFlipped ? (
              <div className="space-y-4 flex flex-col items-center">
                <span className="text-8xl sm:text-9xl font-hanzi-serif font-bold text-gray-900">
                  {currentCard.character}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playSpeech(currentCard.character);
                  }}
                  className="w-11 h-11 rounded-full bg-white/75 hover:bg-primary-600 text-primary-600 hover:text-white border border-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <p className="text-xs text-gray-500">
                  Bạn có nhớ cách đọc và nghĩa của chữ này không?
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-mono font-extrabold text-primary-600">
                    {currentCard.pinyin}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSpeech(currentCard.character);
                    }}
                    className="w-9 h-9 rounded-full bg-white/75 hover:bg-primary-600 text-primary-600 hover:text-white border border-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {currentCard.sinoVietnamese && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-400/20 border border-amber-300/60 px-3 py-0.5 rounded-full inline-block">
                      Hán-Việt: {currentCard.sinoVietnamese}
                    </span>
                  )}
                  <p className="text-xl font-bold text-gray-900 pt-1">{currentCard.meaning}</p>
                </div>

                {currentCard.radical && (
                  <span className="text-xs bg-white/65 border border-white/85 text-gray-600 px-3 py-1 rounded-full font-medium">
                    Bộ thủ: {currentCard.radical} • {currentCard.strokesCount} nét
                  </span>
                )}

                <div className="text-[11px] text-gray-500 pt-1 font-mono">
                  Đã ôn: {currentCard.repetitions} lần
                </div>
              </div>
            )}
          </GlassCard>

          {/* Rating Controls */}
          {isFlipped ? (
            <div className="space-y-2.5">
              <span className="text-xs text-center block text-gray-500 font-medium">
                Chọn mức độ nhớ để lên lịch ôn lại phù hợp:
              </span>
              <div className="grid grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRate('again')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50/85 hover:bg-rose-100/90 border border-rose-200/80 text-rose-700 font-bold transition-colors disabled:opacity-70 cursor-pointer"
                >
                  <span className="text-sm">Quên</span>
                  <span className="text-[10px] text-rose-500 font-normal mt-0.5">
                    {previews.again.label}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('hard')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/85 hover:bg-amber-100/90 border border-amber-200/80 text-amber-800 font-bold transition-colors disabled:opacity-70 cursor-pointer"
                >
                  <span className="text-sm">Khó</span>
                  <span className="text-[10px] text-amber-600 font-normal mt-0.5">
                    {previews.hard.label}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('good')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50/85 hover:bg-sky-100/90 border border-sky-200/80 text-sky-700 font-bold transition-colors disabled:opacity-70 cursor-pointer"
                >
                  <span className="text-sm">Tốt</span>
                  <span className="text-[10px] text-sky-600 font-normal mt-0.5">
                    {previews.good.label}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRate('easy')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/85 hover:bg-emerald-100/90 border border-emerald-200/80 text-emerald-800 font-bold transition-colors disabled:opacity-70 cursor-pointer"
                >
                  <span className="text-sm">Dễ</span>
                  <span className="text-[10px] text-emerald-600 font-normal mt-0.5">
                    {previews.easy.label}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <ShimmerButton
              type="button"
              onClick={() => setIsFlipped(true)}
              size="lg"
              className="w-full"
            >
              <RotateCw className="w-4 h-4" />
              <span>Xem đáp án</span>
            </ShimmerButton>
          )}
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
