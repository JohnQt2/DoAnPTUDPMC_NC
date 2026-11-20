import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, ShimmerButton, NumberTicker } from '../../components/ui';
import { celebrateSuccess } from '../../lib/celebration';
import {
  Volume2,
  Mic,
  MicOff,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  Sparkles,
  MessagesSquare,
  Flame,
  Gauge,
} from 'lucide-react';

interface SpeakingSentence {
  id: number;
  level: 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4';
  topic: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  aiPromptCn?: string;
  aiPromptPy?: string;
  aiPromptVi?: string;
}

const HANPEAK_SPEAKING_BANK: SpeakingSentence[] = [
  // HSK 1
  { id: 1, level: 'HSK1', topic: 'Chào hỏi', hanzi: '你好，很高兴认识你', pinyin: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ', vietnamese: 'Xin chào, rất vui được làm quen với bạn', aiPromptCn: '你好！你是新同学吗？', aiPromptPy: 'Nǐ hǎo! Nǐ shì xīn tóngxué ma?', aiPromptVi: 'Chào bạn! Bạn là học viên mới à?' },
  { id: 2, level: 'HSK1', topic: 'Giới thiệu', hanzi: '我是越南学生，我在学习汉语', pinyin: 'Wǒ shì Yuènán xuésheng, wǒ zài xuéxí Hànyǔ', vietnamese: 'Tôi là sinh viên Việt Nam, tôi đang học tiếng Trung', aiPromptCn: '请问你是哪国人？', aiPromptPy: 'Qǐngwèn nǐ shì nǎ guó rén?', aiPromptVi: 'Xin hỏi bạn là người nước nào?' },
  { id: 3, level: 'HSK1', topic: 'Mua sắm', hanzi: '请问，这个苹果多少钱一斤', pinyin: 'Qǐngwèn, zhège píngguǒ duōshao qián yì jīn?', vietnamese: 'Xin hỏi quả táo này bao nhiêu tiền một cân?', aiPromptCn: '欢迎光临，你想买什么水果？', aiPromptPy: 'Huānyíng guānglín, nǐ xiǎng mǎi shénme shuǐguǒ?', aiPromptVi: 'Chào mừng quý khách, bạn muốn mua trái cây gì?' },
  { id: 4, level: 'HSK1', topic: 'Đời sống', hanzi: '今天天气很好，我们一起去吃饭吧', pinyin: 'Jīntiān tiānqì hěn hǎo, wǒmen yìqǐ qù chīfàn ba', vietnamese: 'Thời tiết hôm nay rất đẹp, chúng ta cùng đi ăn cơm nhé', aiPromptCn: '中午你有什么安排吗？', aiPromptPy: 'Zhōngwǔ nǐ yǒu shénme ānpái ma?', aiPromptVi: 'Buổi trưa bạn có dự định gì không?' },
  // HSK 2
  { id: 5, level: 'HSK2', topic: 'Nhà hàng', hanzi: '服务员，请给我一杯冰咖啡，不要糖', pinyin: 'Fúwùyuán, qǐng gěi wǒ yì bēi bīng kāfēi, búyào táng', vietnamese: 'Phục vụ ơi, cho tôi một ly cà phê đá, không đường', aiPromptCn: '您好，请问您想喝点儿什么？', aiPromptPy: 'Nín hǎo, qǐngwèn nín xiǎng hē diǎnr shénme?', aiPromptVi: 'Xin chào, quý khách muốn uống gì ạ?' },
  { id: 6, level: 'HSK2', topic: 'Du lịch', hanzi: '我准备下个月去北京旅游', pinyin: 'Wǒ zhǔnbèi xià gè yuè qù Běijīng lǚyóu', vietnamese: 'Tôi dự định tháng sau đi Bắc Kinh du lịch', aiPromptCn: '假期你打算去哪儿玩？', aiPromptPy: 'Jiàqī nǐ dǎsuàn qù nǎr wán?', aiPromptVi: 'Kỳ nghỉ bạn định đi đâu chơi?' },
  { id: 7, level: 'HSK2', topic: 'Học tập', hanzi: '虽然汉字有点难，但是非常有意思', pinyin: 'Suīrán Hànzì yǒudiǎn nán, dànshì fēicháng yǒu yìsi', vietnamese: 'Tuy chữ Hán hơi khó nhưng vô cùng thú vị', aiPromptCn: '你觉得学汉语难不难？', aiPromptPy: 'Nǐ juéde xué Hànyǔ nán bu nán?', aiPromptVi: 'Bạn thấy học tiếng Hán có khó không?' },
  // HSK 3
  { id: 8, level: 'HSK3', topic: 'Văn hóa', hanzi: '我对中国传统文化非常感兴趣', pinyin: 'Wǒ duì Zhōngguó chuántǒng wénhuà fēicháng gǎn xìngqù', vietnamese: 'Tôi vô cùng hứng thú với văn hóa truyền thống Trung Hoa', aiPromptCn: '你为什么想学习中文？', aiPromptPy: 'Nǐ wèishénme xiǎng xuéxí Zhōngwén?', aiPromptVi: 'Tại sao bạn lại muốn học tiếng Trung?' },
  { id: 9, level: 'HSK3', topic: 'Thói quen', hanzi: '我每天都坚持复习生词和练习口语', pinyin: 'Wǒ měitiān dōu jiānchí fùxí shēngcí hé liànxí kǒuyǔ', vietnamese: 'Mỗi ngày tôi đều kiên trì ôn từ mới và luyện khẩu ngữ', aiPromptCn: '你的口语怎么提高得这么快？', aiPromptPy: 'Nǐ de kǒuyǔ zěnme tígāo de zhème kuài?', aiPromptVi: 'Sao khẩu ngữ của bạn tiến bộ nhanh thế?' },
  { id: 10, level: 'HSK3', topic: 'Giao thông', hanzi: '坐地铁去市中心又快又方便', pinyin: 'Zuò dìtiě qù shìzhōngxīn yòu kuài yòu fāngbiàn', vietnamese: 'Đi tàu điện ngầm vào trung tâm thành phố vừa nhanh vừa tiện', aiPromptCn: '去市中心怎么走最合适？', aiPromptPy: 'Qù shìzhōngxīn zěnme zǒu zuì héshì?', aiPromptVi: 'Đi trung tâm thành phố bằng cách nào hợp lý nhất?' },
  // HSK 4
  { id: 11, level: 'HSK4', topic: 'Phỏng vấn', hanzi: '我不仅有丰富的经验，而且很注重效率', pinyin: 'Wǒ bùjǐn yǒu fēngfù de jīngyàn, érqiě hěn zhùzhòng xiàolǜ', vietnamese: 'Tôi không chỉ có kinh nghiệm phong phú mà còn rất chú trọng hiệu suất', aiPromptCn: '请简单介绍一下您的优势。', aiPromptPy: 'Qǐng jiǎndān jièshào yíxià nín de yōushì.', aiPromptVi: 'Xin hãy giới thiệu ngắn gọn thế mạnh của bạn.' },
  { id: 12, level: 'HSK4', topic: 'Công sở', hanzi: '只要坚持科学的方法，就一定能成功', pinyin: 'Zhǐyào jiānchí kēxué de fāngfǎ, jiù yídìng néng chénggōng', vietnamese: 'Chỉ cần kiên trì phương pháp khoa học thì nhất định sẽ thành công', aiPromptCn: '面对困难时，你通常会怎么鼓励自己？', aiPromptPy: 'Miànduì kùnnan shí, nǐ tōngcháng huì zěnme gǔlì zìjǐ?', aiPromptVi: 'Khi đối mặt khó khăn, bạn thường động viên mình thế nào?' },
];

export const SpeakingPracticePage: React.FC = () => {
  const [mode, setMode] = useState<'shadowing' | 'roleplay'>('shadowing');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState<number>(0.85);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState<string | null>(null);
  const [scorePercent, setScorePercent] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'good' | 'try_again' | 'unsupported'>('idle');
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  const filteredList =
    levelFilter === 'ALL'
      ? HANPEAK_SPEAKING_BANK
      : HANPEAK_SPEAKING_BANK.filter((s) => s.level === levelFilter);

  const safeIndex = currentIndex < filteredList.length ? currentIndex : 0;
  const item = filteredList[safeIndex] || HANPEAK_SPEAKING_BANK[0];

  const speakText = (text: string, rate = speechRate) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const evaluateSpeech = (transcript: string, target: string) => {
    const cleanTarget = target.replace(/[，。？！?.,\s]/g, '');
    const cleanSpoken = transcript.replace(/[，。？！?.,\s]/g, '');
    if (!cleanTarget) return 0;
    let matched = 0;
    for (const ch of cleanTarget) {
      if (cleanSpoken.includes(ch)) matched++;
    }
    return Math.round((matched / cleanTarget.length) * 100);
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
    setScorePercent(null);
    setFeedback('idle');

    recognition.onresult = (event: any) => {
      const transcript = (event.results?.[0]?.[0]?.transcript || '').trim();
      setSpokenText(transcript);
      const pct = evaluateSpeech(transcript, item.hanzi);
      setScorePercent(pct);
      if (pct >= 70) {
        setFeedback('good');
        setCompletedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        celebrateSuccess(
          pct >= 90 ? `Phát âm rất chuẩn (${pct}%)` : `Đạt ${pct}% (+15 XP)`,
          pct >= 90 ? 'fireworks' : 'confetti',
          `Ghi nhận: “${transcript}”`
        );
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
    setScorePercent(null);
    setFeedback('idle');
  };

  const cleanSpokenForHighlight = (spokenText || '').replace(/[，。？！?.,\s]/g, '');

  return (
    <div className="max-w-5xl mx-auto py-8 px-5 sm:px-8 space-y-6">
      {/* Header + Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400">
            Khẩu ngữ thực hành
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 flex items-center gap-2.5 tracking-tight mt-1">
            <span className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
              <MessagesSquare className="w-4 h-4" />
            </span>
            <span>Luyện nói giao tiếp</span>
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Luyện đọc theo mẫu và đối đáp theo tình huống thực tế từ HSK 1 đến HSK 4.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-zinc-100 border border-zinc-200/80">
            {[
              { id: 'shadowing' as const, label: 'Đọc theo mẫu' },
              { id: 'roleplay' as const, label: 'Hội thoại tình huống' },
            ].map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="speaking-mode-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                      className="absolute inset-0 rounded-lg bg-zinc-900 shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Level Filter + Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'HSK1', 'HSK2', 'HSK3', 'HSK4'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setLevelFilter(lvl);
                selectSentence(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                levelFilter === lvl
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả cấp độ' : lvl.replace('HSK', 'HSK ')}
            </button>
          ))}
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 text-emerald-600" />
          Đã hoàn thành: {completedIds.length}/{HANPEAK_SPEAKING_BANK.length} câu
        </span>
      </div>

      {/* Main Interactive Studio Card */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-white text-xs font-mono font-semibold">
              {item.level.replace('HSK', 'HSK ')}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium">
              {item.topic}
            </span>
          </div>

          {/* Speed Control */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-600">
            <Gauge className="w-3.5 h-3.5 text-zinc-400 mr-0.5" />
            {[
              { label: '0.6x', rate: 0.6 },
              { label: '0.85x', rate: 0.85 },
              { label: '1.0x', rate: 1.0 },
            ].map((sp) => (
              <button
                key={sp.label}
                type="button"
                onClick={() => setSpeechRate(sp.rate)}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  speechRate === sp.rate ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-200'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Roleplay Prompt Bubble */}
        {mode === 'roleplay' && item.aiPromptCn && (
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase text-[#BE123C]">
                <Sparkles className="w-3.5 h-3.5" />
                Câu hỏi tình huống:
              </span>
              <p className="font-hanzi-serif text-xl font-bold text-zinc-950">{item.aiPromptCn}</p>
              <p className="text-xs font-mono font-semibold text-zinc-600">{item.aiPromptPy}</p>
              <p className="text-xs text-zinc-500">{item.aiPromptVi}</p>
            </div>
            <button
              type="button"
              onClick={() => speakText(item.aiPromptCn!, speechRate)}
              className="w-10 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              aria-label="Nghe câu hỏi tình huống"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Target Sentence with Per-Character Scoring Highlight */}
        <div className="py-5 text-center space-y-3">
          {mode === 'roleplay' && (
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#BE123C]">
              Lượt của bạn đáp lại:
            </span>
          )}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {item.hanzi.split('').map((ch, i) => {
              const isPunct = /[，。？！?.,\s]/.test(ch);
              const evaluated = spokenText !== null && !isPunct;
              const matched = evaluated && cleanSpokenForHighlight.includes(ch);
              return (
                <span
                  key={`${item.id}-${i}`}
                  className={`font-hanzi-serif text-3xl sm:text-4xl font-bold px-1 py-0.5 rounded-lg transition-colors ${
                    evaluated
                      ? matched
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-[#BE123C] bg-rose-50 underline decoration-wavy decoration-rose-400'
                      : 'text-zinc-950'
                  }`}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <p className="text-base sm:text-lg font-mono font-semibold text-[#BE123C]">{item.pinyin}</p>
          <p className="text-sm text-zinc-600">{item.vietnamese}</p>
        </div>

        {/* Live Animated Waveform when recording */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-1.5 py-2"
            >
              {[14, 28, 42, 24, 48, 32, 40, 20, 36, 16].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [10, h, 12] }}
                  transition={{ repeat: Infinity, duration: 0.65, delay: i * 0.06 }}
                  className="w-1.5 rounded-full bg-[#BE123C]"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => speakText(item.hanzi, speechRate)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#BE123C]" />
            <span>Nghe mẫu ({speechRate}x)</span>
          </button>

          <ShimmerButton
            type="button"
            onClick={startRecording}
            disabled={isListening}
            size="lg"
            className={isListening ? 'animate-pulse' : ''}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Đang thu âm & phân tích...' : 'Bấm Micro để nói'}</span>
          </ShimmerButton>
        </div>

        {/* Score & Feedback Banner */}
        {scorePercent !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              feedback === 'good'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-base text-white shrink-0 ${
                  feedback === 'good' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                <NumberTicker value={scorePercent} suffix="%" />
              </div>
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  {feedback === 'good' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Phát âm rất tự nhiên!</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>Cần đọc rõ hơn các chữ gạch chân đỏ!</span>
                    </>
                  )}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  Hệ thống nhận diện được: “<strong className="font-chinese">{spokenText}</strong>”
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => selectSentence((safeIndex + 1) % filteredList.length)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-900 font-semibold text-xs hover:bg-zinc-50 cursor-pointer shrink-0"
            >
              <span>Câu tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {feedback === 'unsupported' && (
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs text-center">
            Trình duyệt hiện tại chưa hỗ trợ thu âm giọng nói (nên dùng Chrome hoặc Edge). Bạn vẫn có thể bấm “Nghe mẫu” để luyện đọc theo.
          </div>
        )}
      </GlassCard>

      {/* Sentence Selector List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredList.map((s, idx) => {
          const isCurrent = idx === safeIndex;
          const isDone = completedIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSentence(idx)}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-zinc-50 border-zinc-900 ring-1 ring-zinc-900'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                    {s.level}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400">{s.topic}</span>
                </div>
                <p className="font-hanzi-serif font-bold text-base text-zinc-950 truncate">{s.hanzi}</p>
                <p className="text-xs text-zinc-500 truncate">{s.vietnamese}</p>
              </div>
              {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
