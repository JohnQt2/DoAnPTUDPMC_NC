import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Brain,
  Volume2,
  RotateCw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
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

      // Advance to next card
      if (currentIdx < cards.length - 1) {
        setCurrentIdx((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // Completed queue!
        setCards([]);
        loadStats();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ghi nhận đánh giá.');
    } finally {
      setIsReviewing(false);
    }
  };

  const playSpeech = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis?.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 space-y-6">
        <div className="h-16 rounded-3xl bg-gray-100 animate-pulse" />
        <div className="h-96 rounded-3xl bg-gray-100 animate-pulse" />
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
    <div className="max-w-xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      {/* Header & SRS Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Brain className="w-6 h-6 text-primary-600" />
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Ôn Tập Ngắt Quãng SM-2 (UC07)
          </h1>
        </div>

        {stats && (
          <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
            <span>Đến hạn: <strong className="text-primary-600 font-mono">{stats.dueToday}</strong></span>
            <span>•</span>
            <span>Thuần thục: <strong className="text-emerald-600 font-mono">{stats.masteredCards}</strong></span>
          </div>
        )}
      </div>

      {cards.length > 0 && currentCard ? (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Thẻ {currentIdx + 1} / {cards.length}</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((currentIdx + 1) / cards.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Flashcard (Click to flip) */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer min-h-[340px] bg-white rounded-3xl p-8 border-2 border-primary-100 shadow-xl flex flex-col items-center justify-center text-center relative select-none hover:border-primary-300 transition-all group"
          >
            <span className="absolute top-4 right-4 text-[10px] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-mono">
              Bấm để lật thẻ
            </span>

            {!isFlipped ? (
              /* FRONT FACE */
              <div className="space-y-4 animate-fade-in flex flex-col items-center">
                <span className="text-8xl sm:text-9xl font-chinese font-black text-gray-900 group-hover:scale-105 transition-transform">
                  {currentCard.character}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSpeech(currentCard.character);
                  }}
                  className="p-3 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <p className="text-xs text-gray-400">Bạn có nhớ cách đọc và nghĩa của chữ này?</p>
              </div>
            ) : (
              /* BACK FACE */
              <div className="space-y-4 animate-fade-in flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-primary-600">{currentCard.pinyin}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSpeech(currentCard.character);
                    }}
                    className="p-1.5 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {currentCard.sinoVietnamese && (
                    <span className="text-sm font-bold text-gray-500 uppercase">
                      Âm Hán Việt: [{currentCard.sinoVietnamese}]
                    </span>
                  )}
                  <p className="text-lg font-bold text-gray-900">{currentCard.meaning}</p>
                </div>

                {currentCard.radical && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                    Bộ thủ: {currentCard.radical} • {currentCard.strokesCount} nét
                  </span>
                )}

                <div className="text-[11px] text-gray-400 pt-2 font-mono">
                  Đã lặp: {currentCard.repetitions} lần • Hệ số EF: {currentCard.easeFactor}
                </div>
              </div>
            )}
          </div>

          {/* SM-2 Rating Buttons (Visible only when card is flipped) */}
          {isFlipped ? (
            <div className="space-y-2">
              <span className="text-xs text-center block text-gray-400 font-medium">
                Đánh giá mức độ ghi nhớ để tính khoảng cách lặp lại:
              </span>
              <div className="grid grid-cols-4 gap-2.5">
                {/* Again */}
                <button
                  onClick={() => handleRate('again')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold transition-all disabled:opacity-50"
                >
                  <span className="text-sm">Quên</span>
                  <span className="text-[10px] text-red-500 font-normal mt-0.5">
                    {previews.again.label}
                  </span>
                </button>

                {/* Hard */}
                <button
                  onClick={() => handleRate('hard')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold transition-all disabled:opacity-50"
                >
                  <span className="text-sm">Khó</span>
                  <span className="text-[10px] text-amber-600 font-normal mt-0.5">
                    {previews.hard.label}
                  </span>
                </button>

                {/* Good */}
                <button
                  onClick={() => handleRate('good')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold transition-all disabled:opacity-50"
                >
                  <span className="text-sm">Tốt</span>
                  <span className="text-[10px] text-blue-500 font-normal mt-0.5">
                    {previews.good.label}
                  </span>
                </button>

                {/* Easy */}
                <button
                  onClick={() => handleRate('easy')}
                  disabled={isReviewing}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold transition-all disabled:opacity-50"
                >
                  <span className="text-sm">Dễ</span>
                  <span className="text-[10px] text-emerald-600 font-normal mt-0.5">
                    {previews.easy.label}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsFlipped(true)}
              className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Lật mặt sau để xem đáp án
            </button>
          )}
        </div>
      ) : (
        /* Empty Queue State */
        <div className="bg-white rounded-3xl p-10 text-center space-y-5 border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
            🎉
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">
              Tuyệt Vời! Bạn Đã Ôn Hết Thẻ Đến Hạn
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Tất cả các thẻ Flashcard theo thuật toán SuperMemo-2 hôm nay đã được bạn hoàn thành xuất sắc.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <a
              href="#/courses"
              className="px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all"
            >
              Học bài mới trong Khóa học
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
