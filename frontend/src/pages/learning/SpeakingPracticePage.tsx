import React, { useState } from 'react';
import { Volume2, Mic, MicOff, CheckCircle2, RotateCcw, ChevronRight } from 'lucide-react';

interface DialogueSentence {
  id: number;
  topic: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
}

const PRACTICE_SENTENCES: DialogueSentence[] = [
  { id: 1, topic: 'Chào hỏi', hanzi: '你好', pinyin: 'Nǐ hǎo', vietnamese: 'Xin chào' },
  { id: 2, topic: 'Chào hỏi', hanzi: '你叫什么名字', pinyin: 'Nǐ jiào shénme míngzi?', vietnamese: 'Bạn tên là gì?' },
  { id: 3, topic: 'Chào hỏi', hanzi: '很高兴认识你', pinyin: 'Hěn gāoxìng rènshi nǐ', vietnamese: 'Rất vui được làm quen với bạn' },
  { id: 4, topic: 'Giới thiệu', hanzi: '我是越南人', pinyin: 'Wǒ shì Yuènán rén', vietnamese: 'Tôi là người Việt Nam' },
  { id: 5, topic: 'Giới thiệu', hanzi: '我在学习汉语', pinyin: 'Wǒ zài xuéxí Hànyǔ', vietnamese: 'Tôi đang học tiếng Trung' },
  { id: 6, topic: 'Đời sống', hanzi: '这个多少钱', pinyin: 'Zhège duōshao qián?', vietnamese: 'Cái này bao nhiêu tiền?' },
  { id: 7, topic: 'Đời sống', hanzi: '谢谢你', pinyin: 'Xièxie nǐ', vietnamese: 'Cảm ơn bạn' },
  { id: 8, topic: 'Đời sống', hanzi: '明天见', pinyin: 'Míngtiān jiàn', vietnamese: 'Hẹn gặp lại ngày mai' },
];

export const SpeakingPracticePage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'good' | 'try_again' | 'unsupported'>('idle');
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  const item = PRACTICE_SENTENCES[currentIndex];

  const speakSample = (rate = 0.85) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(item.hanzi);
    u.lang = 'zh-CN';
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback('unsupported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setSpokenText(null);
    setFeedback('idle');

    recognition.onresult = (event: any) => {
      const transcript = (event.results?.[0]?.[0]?.transcript || '').replace(/[。？！?.,\s]/g, '');
      setSpokenText(transcript);
      const target = item.hanzi.replace(/[。？！?.,\s]/g, '');
      if (transcript && (transcript.includes(target) || target.includes(transcript))) {
        setFeedback('good');
        setCompletedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
      } else {
        setFeedback('try_again');
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setFeedback('try_again');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const selectSentence = (idx: number) => {
    setCurrentIndex(idx);
    setSpokenText(null);
    setFeedback('idle');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Luyện nói giao tiếp</h1>
        <p className="text-sm text-gray-500 mt-1">
          Nghe mẫu rồi bấm micro đọc theo để luyện phát âm tự nhiên.
        </p>
      </div>

      {/* Main Practice Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm text-center space-y-6">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
          <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-600">{item.topic}</span>
          <span>
            Câu {currentIndex + 1} / {PRACTICE_SENTENCES.length}
          </span>
        </div>

        <div className="py-4 space-y-2">
          <p className="text-4xl sm:text-5xl font-chinese font-bold text-gray-900 tracking-wide">
            {item.hanzi}
          </p>
          <p className="text-xl font-bold text-primary-600">{item.pinyin}</p>
          <p className="text-sm text-gray-500">{item.vietnamese}</p>
        </div>

        {/* Audio & Mic Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => speakSample(0.85)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-primary-600" />
            <span>Nghe mẫu</span>
          </button>

          <button
            type="button"
            onClick={() => speakSample(0.55)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
          >
            <span>Nghe chậm</span>
          </button>

          <button
            type="button"
            onClick={startRecording}
            disabled={isListening}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-md ${
              isListening
                ? 'bg-primary-600 text-white animate-pulse'
                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Đang nghe bạn nói...' : 'Bấm để đọc theo'}</span>
          </button>
        </div>

        {/* Feedback */}
        {feedback === 'good' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Rất tốt! Hệ thống nghe được: “{spokenText}”</span>
          </div>
        )}

        {feedback === 'try_again' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>
              {spokenText
                ? `Nghe được “${spokenText}”. Hãy nghe lại mẫu và thử đọc chậm hơn nhé!`
                : 'Chưa nghe rõ giọng bạn. Vui lòng cho phép micro và thử lại.'}
            </span>
          </div>
        )}

        {feedback === 'unsupported' && (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 text-xs">
            Trình duyệt này chưa hỗ trợ chấm phát âm bằng micro (hãy dùng Chrome hoặc Edge). Bạn vẫn có thể bấm “Nghe mẫu” và đọc theo.
          </div>
        )}

        {/* Next sentence button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => selectSentence((currentIndex + 1) % PRACTICE_SENTENCES.length)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-primary-600 hover:bg-primary-50 cursor-pointer"
          >
            <span>Câu tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sentence List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRACTICE_SENTENCES.map((s, idx) => {
          const isCurrent = idx === currentIndex;
          const isDone = completedIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSentence(idx)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-primary-50 border-primary-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <p className="font-chinese font-bold text-lg text-gray-900">{s.hanzi}</p>
                <p className="text-xs text-gray-500">
                  {s.pinyin} • {s.vietnamese}
                </p>
              </div>
              {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

