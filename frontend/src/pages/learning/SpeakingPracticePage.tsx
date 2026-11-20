import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, BorderBeam, ShimmerButton, NumberTicker } from '../../components/ui';
import { PathMap, PathNode } from '../../components/PathMap';
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
  ArrowLeft,
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
  const [mode, setMode] = useState<'path' | 'shadowing' | 'roleplay'>('path');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState<number>(0.85);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState<string | null>(null);
  const [scorePercent, setScorePercent] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'good' | 'try_again' | 'unsupported'>('idle');
  const [completedIds, setCompletedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('hanzi4u_speaking_done_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const openSentenceOnStudio = (sentenceId: number) => {
    setLevelFilter('ALL');
    const idx = HANPEAK_SPEAKING_BANK.findIndex((s) => s.id === sentenceId);
    setCurrentIndex(idx >= 0 ? idx : 0);
    setSpokenText(null);
    setScorePercent(null);
    setFeedback('idle');
    setMode('shadowing');
  };

  const speakingPath = useMemo(() => {
    const groups = [
      { title: 'Nền tảng 1/3 • Giao tiếp HSK 1', items: HANPEAK_SPEAKING_BANK.filter((s) => s.level === 'HSK1') },
      { title: 'Nền tảng 2/3 • Giao tiếp HSK 2', items: HANPEAK_SPEAKING_BANK.filter((s) => s.level === 'HSK2') },
      {
        title: 'Nền tảng 3/3 • Giao tiếp HSK 3–4',
        items: HANPEAK_SPEAKING_BANK.filter((s) => s.level === 'HSK3' || s.level === 'HSK4'),
      },
    ];

    let foundCurrent = false;
    let firstCurrentId = HANPEAK_SPEAKING_BANK[0]?.id ?? 1;

    const sections = groups.map((g) => {
      const nodes: PathNode[] = g.items.map((s) => {
        const isDone = completedIds.includes(s.id);
        let status: PathNode['status'] = 'locked';
        if (isDone) {
          status = 'done';
        } else if (!foundCurrent) {
          status = 'current';
          foundCurrent = true;
          firstCurrentId = s.id;
        }
        return {
          id: s.id,
          label: `${s.topic}: ${s.hanzi}`,
          glyph: s.hanzi.charAt(0) || '说',
          status,
          onClick: () => openSentenceOnStudio(s.id),
        };
      });
      return { title: g.title, nodes };
    });

    return { sections, todaySentenceId: firstCurrentId };
  }, [completedIds]);

  const cleanSpokenForHighlight = (spokenText || '').replace(/[，。？！?.,\s]/g, '');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header + Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 flex items-center gap-2.5 tracking-tight">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-primary-600 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <MessagesSquare className="w-5 h-5" />
            </span>
            <span>Luyện nói giao tiếp</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Luyện đọc theo mẫu và đối đáp theo tình huống thực tế từ HSK 1 đến HSK 4.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 rounded-2xl glass-light">
            {[
              { id: 'path' as const, label: 'Lộ trình nói' },
              { id: 'shadowing' as const, label: 'Đọc theo mẫu' },
              { id: 'roleplay' as const, label: 'Hội thoại' },
            ].map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                    active ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="speaking-mode-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {mode === 'path' ? (
        <div className="max-w-2xl mx-auto space-y-12 pb-20">
          {speakingPath.sections.map((sec) => (
            <PathMap
              key={sec.title}
              title={sec.title}
              nodes={sec.nodes}
              onHeaderAction={() => setMode('shadowing')}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode('path')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-light text-xs font-bold text-slate-700 hover:text-rose-600 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về lộ trình luyện nói</span>
            </button>
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-gradient-to-r from-primary-600 to-amber-500 text-white shadow-md'
                  : 'glass-light text-gray-600 hover:bg-white'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả cấp độ' : lvl.replace('HSK', 'HSK ')}
            </button>
          ))}
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
          <Flame className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
          Đã chinh phục: {completedIds.length}/{HANPEAK_SPEAKING_BANK.length} câu
        </span>
      </div>

      {/* Main Hanpeak Interactive Studio Card */}
      <GlassCard className="p-6 sm:p-8 relative overflow-hidden space-y-6">
        <BorderBeam duration={8} colorFrom="#f43f5e" colorTo="#8b5cf6" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary-600 to-rose-500 text-white text-xs font-black">
              {item.level.replace('HSK', 'HSK ')}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              {item.topic}
            </span>
          </div>

          {/* Speed Control */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-gray-200 text-xs font-bold text-gray-600">
            <Gauge className="w-3.5 h-3.5 text-primary-500" />
            {[
              { label: '0.6x', rate: 0.6 },
              { label: '0.85x', rate: 0.85 },
              { label: '1.0x', rate: 1.0 },
            ].map((sp) => (
              <button
                key={sp.label}
                type="button"
                onClick={() => setSpeechRate(sp.rate)}
                className={`px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                  speechRate === sp.rate ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Roleplay AI Bubble */}
        {mode === 'roleplay' && item.aiPromptCn && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 via-fuchsia-50/60 to-white border border-violet-200/80 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-violet-700">
                <Sparkles className="w-3.5 h-3.5" />
                Câu hỏi tình huống:
              </span>
              <p className="font-chinese text-xl font-black text-gray-900">{item.aiPromptCn}</p>
              <p className="text-xs font-bold text-violet-600">{item.aiPromptPy}</p>
              <p className="text-xs text-gray-500">{item.aiPromptVi}</p>
            </div>
            <button
              type="button"
              onClick={() => speakText(item.aiPromptCn!, speechRate)}
              className="w-11 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-md shrink-0 cursor-pointer"
              aria-label="Nghe câu hỏi của AI"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Target Sentence with Per-Character Scoring Highlight */}
        <div className="py-5 text-center space-y-3">
          {mode === 'roleplay' && (
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary-600">
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
                  className={`font-chinese text-3xl sm:text-5xl font-black px-1 py-0.5 rounded-xl transition-all ${
                    evaluated
                      ? matched
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-rose-600 bg-rose-50 underline decoration-wavy decoration-rose-400'
                      : 'text-gray-900'
                  }`}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-primary-600">{item.pinyin}</p>
          <p className="text-sm text-gray-600 font-medium">{item.vietnamese}</p>
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
                  className="w-1.5 rounded-full bg-gradient-to-t from-primary-600 via-rose-500 to-amber-400"
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
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-primary-50 border border-gray-200 text-gray-800 font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-primary-600" />
            <span>Nghe mẫu ({speechRate}x)</span>
          </button>

          <ShimmerButton
            type="button"
            onClick={startRecording}
            disabled={isListening}
            size="lg"
            className={isListening ? 'animate-pulse' : ''}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span>{isListening ? 'Đang thu âm & phân tích...' : 'Bấm Micro để nói'}</span>
          </ShimmerButton>
        </div>

        {/* Score & AI Feedback Banner */}
        {scorePercent !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              feedback === 'good'
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md shrink-0 ${
                  feedback === 'good'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500'
                }`}
              >
                <NumberTicker value={scorePercent} suffix="%" />
              </div>
              <div>
                <p className="text-sm font-black flex items-center gap-1.5">
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
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-primary-700 font-extrabold text-xs shadow-sm hover:bg-primary-50 cursor-pointer shrink-0"
            >
              <span>Câu tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {feedback === 'unsupported' && (
          <div className="p-4 rounded-2xl bg-white/60 border border-white/85 text-gray-600 text-xs text-center">
            Trình duyệt hiện tại chưa hỗ trợ thu âm giọng nói (nên dùng Chrome hoặc Edge). Bạn vẫn có thể bấm “Nghe mẫu” để luyện đọc theo.
          </div>
        )}
      </GlassCard>

      {/* Sentence Selector List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredList.map((s, idx) => {
          const isCurrent = idx === safeIndex;
          const isDone = completedIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSentence(idx)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-gradient-to-br from-primary-50 via-white to-amber-50 border-primary-400 shadow-md ring-1 ring-primary-300'
                  : 'glass-light hover:bg-white'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-primary-100 text-primary-700">
                    {s.level}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">{s.topic}</span>
                </div>
                <p className="font-chinese font-black text-base text-gray-900 truncate">{s.hanzi}</p>
                <p className="text-xs text-gray-500 truncate">{s.vietnamese}</p>
              </div>
              {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            </button>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
};
