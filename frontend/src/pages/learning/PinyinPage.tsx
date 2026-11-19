import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { PitchVisualizer } from '../../components/PitchVisualizer';
import { Volume2, Sparkles, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export const PinyinPage: React.FC = () => {
  const [tab, setTab] = useState<'INITIAL' | 'FINAL' | 'TONE' | 'MINIMAL_PAIRS'>('INITIAL');
  const [pinyinList, setPinyinList] = useState<any[]>([]);
  const [minimalPairs, setMinimalPairs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Minimal Pairs Interactive Quiz state
  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [secretSound, setSecretSound] = useState<'primary' | 'contrasting'>('primary');

  useEffect(() => {
    loadPinyin();
    loadMinimalPairs();
  }, []);

  const loadPinyin = async () => {
    try {
      const data = await api.get<any[]>('/learning/pinyin');
      setPinyinList(data || []);
    } catch (err) {
      console.error('Failed to load pinyin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMinimalPairs = async () => {
    try {
      const data = await api.get<any[]>('/learning/pinyin/minimal-pairs');
      setMinimalPairs(data || []);
      // Randomize secret sound for the first pair
      setSecretSound(Math.random() > 0.5 ? 'primary' : 'contrasting');
    } catch (err) {
      console.error('Failed to load minimal pairs:', err);
    }
  };

  const playSound = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis?.speak(utterance);
  };

  const playSecretAudio = () => {
    const pair = minimalPairs[currentPairIdx];
    if (!pair) return;
    const targetSyl = secretSound === 'primary' ? pair.primary.syllable : pair.contrasting?.syllable;
    playSound(targetSyl);
  };

  const handleChooseAnswer = (chosen: 'primary' | 'contrasting') => {
    setSelectedAnswer(chosen);
    const isCorrect = chosen === secretSound;
    setQuizFeedback({
      isCorrect,
      message: isCorrect
        ? 'Chính xác! Bạn đã phân biệt xuất sắc cặp âm tương phản này.'
        : 'Chưa đúng rồi! Hãy chú ý luồng hơi hoặc cao độ thanh điệu và nghe lại nhé.',
    });
  };

  const handleNextPair = () => {
    setSelectedAnswer(null);
    setQuizFeedback(null);
    setSecretSound(Math.random() > 0.5 ? 'primary' : 'contrasting');
    setCurrentPairIdx((prev) => (prev + 1) % minimalPairs.length);
  };

  const currentPair = minimalPairs[currentPairIdx];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3.5 py-1 rounded-full bg-primary-50 text-primary-600 font-extrabold text-xs uppercase tracking-wider">
          Ngữ Âm Cơ Bản
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Hệ Thống Pinyin & Cao Độ Thanh Điệu
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Nền tảng phát âm chuẩn Bắc Kinh: 23 Thanh Mẫu, 24 Vận Mẫu, 4 Thanh Điệu F0 và Bài tập Nghe Tương Phản Tối Thiểu (Minimal Pairs).
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-gray-200 pb-4">
        {[
          { key: 'INITIAL', label: 'Thanh Mẫu (Phụ âm đầu)' },
          { key: 'FINAL', label: 'Vận Mẫu (Nguyên âm)' },
          { key: 'TONE', label: '4 Thanh Điệu F0 (Cao độ)' },
          { key: 'MINIMAL_PAIRS', label: 'Luyện Nghe Tương Phản (Minimal Pairs)' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              tab === t.key
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: 4 Tones Visualizer */}
      {tab === 'TONE' && (
        <div className="space-y-6">
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-2xl text-primary-900 text-sm leading-relaxed">
            💡 <strong>Quy luật Thang Ngũ Độ Chao (1930):</strong> Cao độ giọng nói được chia làm 5 bậc từ 1 (thấp nhất) đến 5 (cao nhất). Thanh 1 giữ phẳng ở bậc 55, Thanh 2 lướt từ 35, Thanh 3 hạ sâu xuống 2 rồi vút lên 14, và Thanh 4 rơi dứt khoát 51.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PitchVisualizer tone={1} contour="55 - Cao bằng" syllable="mā (Mẹ)" />
            <PitchVisualizer tone={2} contour="35 - Lên cao" syllable="má (Cây gai)" />
            <PitchVisualizer tone={3} contour="214 - Xuống rồi lên" syllable="mǎ (Con ngựa)" />
            <PitchVisualizer tone={4} contour="51 - Dứt khoát" syllable="mà (Mắng chửi)" />
          </div>
        </div>
      )}

      {/* Tab: Minimal Pairs Interactive Exercise */}
      {tab === 'MINIMAL_PAIRS' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 text-center">
            <div className="space-y-1">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                Thử Thách Thính Giác
              </span>
              <h3 className="text-xl font-bold text-gray-900">
                Phân Biệt Cặp Âm Đối Lập Dễ Nhầm
              </h3>
              <p className="text-xs text-gray-400">
                Lắng nghe âm thanh bí ẩn và chọn đúng thẻ phát âm tương ứng
              </p>
            </div>

            {/* Listen Button */}
            <div className="py-4">
              <button
                onClick={playSecretAudio}
                className="w-20 h-20 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-primary-600/30 hover:scale-105 active:scale-95 transition-all"
                title="Bấm để nghe âm thanh bí ẩn"
              >
                <Volume2 className="w-8 h-8" />
              </button>
              <span className="block text-xs text-gray-400 mt-2">Bấm loa để nghe</span>
            </div>

            {/* Two Options */}
            {currentPair && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleChooseAnswer('primary')}
                  disabled={selectedAnswer !== null}
                  className={`p-6 rounded-2xl border-2 text-2xl font-black font-chinese transition-all ${
                    selectedAnswer === 'primary'
                      ? secretSound === 'primary'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : 'border-gray-200 hover:border-primary-400 bg-gray-50 text-gray-800'
                  }`}
                >
                  {currentPair.primary.syllable}
                  <span className="block text-xs font-normal text-gray-400 font-sans mt-1">
                    Thanh {currentPair.primary.tone}
                  </span>
                </button>

                <button
                  onClick={() => handleChooseAnswer('contrasting')}
                  disabled={selectedAnswer !== null}
                  className={`p-6 rounded-2xl border-2 text-2xl font-black font-chinese transition-all ${
                    selectedAnswer === 'contrasting'
                      ? secretSound === 'contrasting'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : 'border-gray-200 hover:border-primary-400 bg-gray-50 text-gray-800'
                  }`}
                >
                  {currentPair.contrasting?.syllable}
                  <span className="block text-xs font-normal text-gray-400 font-sans mt-1">
                    Thanh {currentPair.contrasting?.tone}
                  </span>
                </button>
              </div>
            )}

            {/* Feedback Message */}
            {quizFeedback && (
              <div
                className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 justify-center animate-fade-in ${
                  quizFeedback.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {quizFeedback.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span>{quizFeedback.message}</span>
              </div>
            )}

            {/* Pedagogical Tip */}
            {currentPair?.pedagogicalTip && (
              <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl leading-relaxed">
                🎯 <strong>Mẹo phân biệt:</strong> {currentPair.pedagogicalTip}
              </p>
            )}

            {selectedAnswer !== null && (
              <button
                onClick={handleNextPair}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-all"
              >
                Cặp tiếp theo
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab: Initials or Finals List */}
      {(tab === 'INITIAL' || tab === 'FINAL') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {pinyinList
            .filter((p) => (tab === 'INITIAL' ? p.category === 'INITIAL' : p.category !== 'INITIAL'))
            .map((item) => (
              <button
                key={item.syllableId}
                onClick={() => playSound(item.syllable)}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all flex flex-col items-center gap-2 group"
              >
                <span className="text-2xl font-black text-gray-800 group-hover:text-primary-600 transition-colors">
                  {item.syllable}
                </span>
                <span className="text-[11px] text-gray-400">
                  {item.f0PitchContour ? `Cao độ ${item.f0PitchContour}` : 'Phát âm'}
                </span>
                <span className="w-7 h-7 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform mt-1">
                  <Volume2 className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
