import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { HanziCanvas } from '../../components/HanziCanvas';
import { PitchVisualizer } from '../../components/PitchVisualizer';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileQuestion,
  Headphones,
  PenTool,
  BookMarked,
  Eye,
  EyeOff,
  Flame,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface VocabularyItem {
  charId: number;
  character: string;
  pinyin: string;
  sinoVietnamese: string;
  meaning: string;
  strokesCount: number;
  strokeOrderSvg?: string | null;
  audioUrl?: string | null;
}

interface LessonBlockItem {
  blockId: number;
  blockType: 'THEORY' | 'PINYIN' | 'HANZI' | 'AUDIO';
  orderIndex: number;
  contentJson: string;
  mediaUrl?: string | null;
}

interface LessonDetailData {
  lessonId: number;
  title: string;
  orderIndex: number;
  estimatedDurationMins: number;
  status: string;
  userProgress?: {
    status: string;
    isCompleted: boolean;
    highestScore: number;
    completedAt?: string | null;
  } | null;
  chapter: {
    chapterId: number;
    title: string;
    course: {
      course_id: number;
      title: string;
      code: string;
    };
  };
  blocks: LessonBlockItem[];
  vocabularies: VocabularyItem[];
  tests: Array<{
    test_id: number;
    title: string;
    test_type: string;
    passing_score: number;
    time_limit_mins: number;
  }>;
}

export const LessonPage: React.FC<{ lessonId: number }> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<LessonDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'vocab' | 'grammar' | 'dialogue' | 'hanzi'>(
    'content'
  );

  // Content Blocks Step-by-Step state
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);

  // Dialogue toggle & player states
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.75, 0.85, 1.0
  const [playingDialogueIdx, setPlayingDialogueIdx] = useState<number | null>(null);
  const [isAutoPlayingDialogue, setIsAutoPlayingDialogue] = useState(false);
  const autoPlayTimerRef = useRef<any>(null);

  // Hanzi practice selection
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);

  // Pinyin Pitch Visualizer interactive state
  const [selectedPinyinTone, setSelectedPinyinTone] = useState<number>(1);
  const [selectedPinyinSyllable, setSelectedPinyinSyllable] = useState<string>('mā');

  // Flashcard flip states for vocabulary tab
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadLesson();
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [lessonId]);

  const loadLesson = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<LessonDetailData>(`/curriculum/lessons/${lessonId}`);
      setLesson(data);
      setCurrentBlockIdx(0);
      setSelectedCharIdx(0);

      // Record in-progress progress automatically
      api.post(`/curriculum/lessons/${lessonId}/progress`).catch(() => {});
    } catch (err) {
      console.error('Failed to load lesson:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playSpeech = (text: string, customAudioUrl?: string | null, customRate?: number) => {
    if (customAudioUrl) {
      const audio = new Audio(customAudioUrl);
      audio.playbackRate = customRate ?? speechRate;
      audio.play().catch(() => playSpeechFallback(text, customRate));
    } else {
      playSpeechFallback(text, customRate);
    }
  };

  const playSpeechFallback = (text: string, customRate?: number) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = customRate ?? speechRate;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis not available:', e);
    }
  };

  const toggleCardFlip = (idx: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const flipAllCards = (flipState: boolean) => {
    if (!lesson) return;
    const newFlips: Record<number, boolean> = {};
    lesson.vocabularies.forEach((_, idx) => {
      newFlips[idx] = flipState;
    });
    setFlippedCards(newFlips);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
        <div className="h-28 rounded-3xl bg-gray-100 animate-pulse border border-gray-200" />
        <div className="h-96 rounded-3xl bg-gray-100 animate-pulse border border-gray-200" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-gray-500 font-medium">Không tìm thấy thông tin bài học này.</p>
        <a href="#/courses" className="text-primary-600 font-bold underline">
          Quay lại danh sách khóa học
        </a>
      </div>
    );
  }

  const blocks = lesson.blocks || [];
  const currentBlock = blocks[currentBlockIdx];
  const progressPercent = blocks.length > 0 ? Math.round(((currentBlockIdx + 1) / blocks.length) * 100) : 0;

  // Safe parse of block JSON
  let blockContent: any = {};
  try {
    if (currentBlock?.contentJson) {
      blockContent = JSON.parse(currentBlock.contentJson);
    }
  } catch {
    blockContent = {};
  }

  // Extract all dialogue lines from all AUDIO blocks for Tab 4
  const allDialogues: any[] = [];
  blocks.forEach((b) => {
    if (b.blockType === 'AUDIO' && b.contentJson) {
      try {
        const parsed = JSON.parse(b.contentJson);
        if (Array.isArray(parsed.dialogue)) {
          allDialogues.push(...parsed.dialogue);
        }
      } catch {}
    }
  });

  // Extract all theory / grammar blocks for Tab 3
  const grammarBlocks = blocks.filter((b) => b.blockType === 'THEORY');

  // Extract all pinyin blocks
  const pinyinBlocks = blocks.filter((b) => b.blockType === 'PINYIN');

  const linkedTest = lesson.tests && lesson.tests.length > 0 ? lesson.tests[0] : null;
  const isCompleted = lesson.userProgress?.isCompleted ?? false;
  const isInProgress = lesson.userProgress?.status === 'IN_PROGRESS';
  const highestScore = lesson.userProgress?.highestScore ?? 0;

  const selectedChar =
    lesson.vocabularies && lesson.vocabularies.length > 0
      ? lesson.vocabularies[selectedCharIdx]
      : null;

  // Handle Dialogue Auto-play sequential
  const handleToggleAutoPlayDialogue = () => {
    if (isAutoPlayingDialogue) {
      setIsAutoPlayingDialogue(false);
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      setPlayingDialogueIdx(null);
      window.speechSynthesis?.cancel();
    } else {
      if (allDialogues.length === 0) return;
      setIsAutoPlayingDialogue(true);
      playDialogueSequence(0);
    }
  };

  const playDialogueSequence = (idx: number) => {
    if (idx >= allDialogues.length) {
      setIsAutoPlayingDialogue(false);
      setPlayingDialogueIdx(null);
      return;
    }
    setPlayingDialogueIdx(idx);
    playSpeech(allDialogues[idx].hanzi);

    // Approximate duration + pause before next speaker
    const delay = Math.max(2200, allDialogues[idx].hanzi.length * 400);
    autoPlayTimerRef.current = setTimeout(() => {
      playDialogueSequence(idx + 1);
    }, delay);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Clickable Multi-Level Breadcrumb & Status Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <nav
          aria-label="Điều hướng bài học"
          className="inline-flex flex-wrap items-center gap-1.5 px-3.5 py-2 rounded-full glass-light text-xs font-semibold text-gray-600 self-start"
        >
          <a
            href="#/courses"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-white/80 hover:text-primary-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lộ trình</span>
          </a>
          <span className="text-gray-400">/</span>
          <a
            href={`#/courses?level=${(lesson.chapter.course?.code || 'HSK1').toUpperCase()}`}
            className="px-2 py-0.5 rounded-full hover:bg-white/80 hover:text-primary-600 text-gray-800 font-bold transition-colors cursor-pointer"
          >
            {(lesson.chapter.course?.code || 'HSK1').replace('HSK', 'HSK ')}
          </a>
          <span className="text-gray-400">/</span>
          <a
            href={`#/courses/${lesson.chapter.course?.course_id || 1}`}
            className="px-2 py-0.5 rounded-full hover:bg-white/80 hover:text-primary-600 transition-colors truncate max-w-[200px] cursor-pointer"
          >
            {lesson.chapter.title}
          </a>
        </nav>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã hoàn thành {highestScore > 0 ? `(Điểm: ${highestScore}%)` : ''}</span>
            </span>
          ) : isInProgress ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Đang học</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
              <span>Sẵn sàng học</span>
            </span>
          )}

          {linkedTest && (
            <a
              href={`#/test/${linkedTest.test_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Bài test củng cố (≥80%)</span>
            </a>
          )}
        </div>
      </div>

      {/* Lesson Header Banner */}
      <div className="glass-light rounded-[28px] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary-700 bg-primary-50/90 px-2.5 py-0.5 rounded-md border border-primary-100">
            {lesson.chapter.title}
          </span>
          <span className="text-xs text-gray-400 font-semibold">•</span>
          <span className="text-xs text-gray-600 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lesson.estimatedDurationMins} phút
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 tracking-tight">
          {lesson.title}
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Học đầy đủ từ vựng, ngữ pháp, hội thoại nghe nói và luyện viết chữ Hán của bài học.
        </p>

        {/* Tab Switcher — Clean wrap, ZERO horizontal scrollbar */}
        <div className="pt-4 border-t border-white/75 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'content'
                ? 'bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 text-white border-transparent shadow-md'
                : 'bg-white/60 border-white/85 text-gray-700 hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Nội dung bài ({blocks.length} phần)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'vocab'
                ? 'bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 text-white border-transparent shadow-md'
                : 'bg-white/60 border-white/85 text-gray-700 hover:bg-white'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Từ vựng bài ({lesson.vocabularies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grammar')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'grammar'
                ? 'bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 text-white border-transparent shadow-md'
                : 'bg-white/60 border-white/85 text-gray-700 hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ngữ pháp & Pinyin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dialogue')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'dialogue'
                ? 'bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 text-white border-transparent shadow-md'
                : 'bg-white/60 border-white/85 text-gray-700 hover:bg-white'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Hội thoại mẫu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hanzi')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'hanzi'
                ? 'bg-gradient-to-r from-primary-600 via-rose-500 to-amber-500 text-white border-transparent shadow-md'
                : 'bg-white/60 border-white/85 text-gray-700 hover:bg-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Tập viết chữ Hán</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: NỘI DUNG BÀI HỌC TUẦN TỰ (STEP-BY-STEP BLOCKS)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Progress bar inside step */}
          <div className="glass-light rounded-2xl p-4 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-gray-600">
              Phần {currentBlockIdx + 1} / {blocks.length}
            </span>

            <div className="flex-1 max-w-xs h-2 bg-white/70 border border-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="text-xs font-semibold text-primary-600">{progressPercent}%</span>
          </div>

          {/* Current Block Content Card */}
          {currentBlock ? (
            <div className="glass-light rounded-[28px] p-6 sm:p-10 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-extrabold text-xs uppercase tracking-wider">
                  {currentBlock.blockType === 'THEORY' && 'Lý Thuyết & Ngữ Pháp'}
                  {currentBlock.blockType === 'PINYIN' && 'Ngữ Âm Pinyin & Thanh Điệu'}
                  {currentBlock.blockType === 'HANZI' && 'Chữ Hán & Bút Thuận'}
                  {currentBlock.blockType === 'AUDIO' && 'Hội Thoại Audio Thực Tế'}
                </span>

                <span className="text-xs text-gray-400 font-medium">Thứ tự {currentBlock.orderIndex}</span>
              </div>

              {/* 1. THEORY */}
              {currentBlock.blockType === 'THEORY' && (
                <div className="space-y-4">
                  {blockContent.title && (
                    <h3 className="text-xl font-extrabold text-gray-900">{blockContent.title}</h3>
                  )}
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                    {blockContent.content || 'Nội dung kiến thức lý thuyết bài học.'}
                  </p>
                </div>
              )}

              {/* 2. PINYIN */}
              {currentBlock.blockType === 'PINYIN' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900">Hướng Dẫn Ngữ Âm & Quy Tắc</h3>
                  {blockContent.rule && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Quy tắc quan trọng:</strong> {blockContent.rule}
                      </div>
                    </div>
                  )}

                  {blockContent.syllables && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 font-medium">Bấm vào âm tiết để nghe phát âm mẫu:</p>
                      <div className="flex flex-wrap gap-3 justify-center py-2">
                        {blockContent.syllables.map((syl: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => playSpeech(syl)}
                            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-800 font-bold text-lg transition-all cursor-pointer shadow-sm hover:scale-105"
                          >
                            <Volume2 className="w-4 h-4 text-primary-600" />
                            <span>{syl}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. HANZI */}
              {currentBlock.blockType === 'HANZI' && (
                <div className="space-y-4 text-center">
                  <div className="py-2">
                    <span className="text-6xl font-chinese font-black text-gray-900 block hover:scale-105 transition-transform">
                      {blockContent.character}
                    </span>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">{blockContent.meaning}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('hanzi')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <PenTool className="w-4 h-4" />
                      <span>Mở bảng luyện viết nét chữ Hán này</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. AUDIO / DIALOGUE */}
              {currentBlock.blockType === 'AUDIO' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Đoạn Hội Thoại Thực Tế</h3>
                  <div className="space-y-3">
                    {blockContent.dialogue?.map((d: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {d.speaker}
                            </span>
                            <span className="text-lg font-bold text-gray-900 font-chinese">{d.hanzi}</span>
                            <span className="text-sm font-semibold text-primary-600">({d.pinyin})</span>
                          </div>
                          <p className="text-xs text-gray-500 pl-8.5">{d.meaning}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => playSpeech(d.hanzi)}
                          className="p-2.5 rounded-xl bg-white hover:bg-primary-50 border border-gray-200 text-gray-600 hover:text-primary-600 transition-colors shadow-sm cursor-pointer"
                          title="Nghe phát âm câu này"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-500 border border-gray-200">
              Bài học này hiện chưa có nội dung văn bản.
            </div>
          )}

          {/* Navigation Controls between blocks */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentBlockIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentBlockIdx === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Phần trước</span>
            </button>

            {currentBlockIdx < blocks.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentBlockIdx((prev) => Math.min(blocks.length - 1, prev + 1))}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <span>Phần tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('vocab')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <span>Chuyển sang Học Từ Vựng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: TỪ VỰNG UNIT (FLASHCARDS TƯƠNG TÁC)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'vocab' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Từ Vựng Cốt Lõi Trong Bài ({lesson.vocabularies.length} từ)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Bấm vào thẻ để lật xem phiên âm Pinyin, âm Hán Việt và giải nghĩa tiếng Việt
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => flipAllCards(true)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer"
              >
                Lật tất cả
              </button>
              <button
                type="button"
                onClick={() => flipAllCards(false)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer"
              >
                Thu gọn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lesson.vocabularies.map((vocab, idx) => {
              const isFlipped = flippedCards[idx] ?? false;

              return (
                <div
                  key={vocab.charId || idx}
                  className="glass-card-grid rounded-[26px] p-5 space-y-4 flex flex-col justify-between"
                >
                  {/* Top card action */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-bold text-gray-400">Từ vựng #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => playSpeech(vocab.character, vocab.audioUrl)}
                      className="p-2 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Character presentation */}
                  <div
                    onClick={() => toggleCardFlip(idx)}
                    className="cursor-pointer text-center py-4 space-y-2 select-none"
                  >
                    <span className="text-5xl font-chinese font-black text-gray-900 hover:text-primary-600 transition-colors block">
                      {vocab.character}
                    </span>

                    <div className="space-y-1">
                      <p className="text-base font-extrabold text-primary-600">{vocab.pinyin}</p>
                      {isFlipped ? (
                        <div className="space-y-1 animate-fade-in pt-1">
                          <p className="text-xs text-gray-400">
                            Hán Việt: <strong className="text-gray-700">{vocab.sinoVietnamese || '—'}</strong>
                          </p>
                          <p className="text-sm font-bold text-gray-800">{vocab.meaning}</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 underline decoration-dotted">
                          Bấm để xem nghĩa tiếng Việt
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Practice Shortcut */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400">{vocab.strokesCount || 6} nét bút</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCharIdx(idx);
                        setActiveTab('hanzi');
                      }}
                      className="font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Luyện viết nét</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: NGỮ PHÁP & QUY TẮC PINYIN (CÓ BIỂU ĐỒ CAO ĐỘ F0 CHAO)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'grammar' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-gray-900">Ngữ Pháp & Luyện Ngữ Âm Pinyin</h2>
            <p className="text-xs text-gray-500">
              Quy tắc cấu trúc câu tiếng Trung và trực quan hóa đường cong cao độ thanh điệu F0
            </p>
          </div>

          {/* Grammar theory cards */}
          {grammarBlocks.length > 0 ? (
            <div className="space-y-4">
              {grammarBlocks.map((b) => {
                let content: any = {};
                try {
                  content = JSON.parse(b.contentJson);
                } catch {}

                return (
                  <div
                    key={b.blockId}
                    className="glass-light rounded-[28px] p-6 sm:p-8 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                      <h3 className="text-lg font-display font-bold text-gray-900">
                        {content.title || 'Chủ điểm ngữ pháp trọng tâm'}
                      </h3>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/55 border border-white/80 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                      {content.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-light rounded-[28px] p-8 text-center text-gray-600">
              Bài học này tập trung vào làm quen ngữ âm và chữ Hán căn bản.
            </div>
          )}

          {/* Pinyin & Tone Contour Visualizer */}
          <div className="glass-light rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/75 pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Biểu đồ cao độ 4 thanh điệu
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Chọn thanh điệu để nghe phát âm mẫu và xem đường cao độ chuẩn
                </p>
              </div>

              {/* Quick Tone Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { tone: 1, syl: 'mā', label: 'Thanh 1 (55)' },
                  { tone: 2, syl: 'má', label: 'Thanh 2 (35)' },
                  { tone: 3, syl: 'mǎ', label: 'Thanh 3 (214)' },
                  { tone: 4, syl: 'mà', label: 'Thanh 4 (51)' },
                ].map((item) => (
                  <button
                    key={item.tone}
                    type="button"
                    onClick={() => {
                      setSelectedPinyinTone(item.tone);
                      setSelectedPinyinSyllable(item.syl);
                      playSpeech(item.syl);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedPinyinTone === item.tone
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch Visualizer Component */}
            <div className="max-w-md mx-auto">
              <PitchVisualizer
                tone={selectedPinyinTone}
                syllable={selectedPinyinSyllable}
              />
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => playSpeech(selectedPinyinSyllable)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe lại âm mẫu ({selectedPinyinSyllable})</span>
                </button>
              </div>
            </div>

            {/* Pinyin Syllables from Lesson Blocks */}
            {pinyinBlocks.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Các âm tiết Pinyin trong bài học
                </h4>
                <div className="space-y-3">
                  {pinyinBlocks.map((b) => {
                    let pContent: any = {};
                    try {
                      pContent = JSON.parse(b.contentJson);
                    } catch {}

                    return (
                      <div key={b.blockId} className="space-y-2">
                        {pContent.rule && (
                          <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                            💡 {pContent.rule}
                          </p>
                        )}
                        {pContent.syllables && (
                          <div className="flex flex-wrap gap-2">
                            {pContent.syllables.map((s: string, sIdx: number) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  setSelectedPinyinSyllable(s);
                                  playSpeech(s);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 font-bold text-xs text-gray-800 hover:text-primary-700 cursor-pointer flex items-center gap-1.5 transition-colors"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-primary-600" />
                                <span>{s}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 4: HỘI THOẠI AUDIO THỰC TẾ (INTERACTIVE LISTENING PLAYER)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'dialogue' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Hội Thoại Đàm Thoại Mẫu</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Luyện nghe và đối đáp phản xạ theo từng câu của bài học
              </p>
            </div>

            {/* Controls Bar: Auto-play, Rate, Display Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Auto play button */}
              <button
                type="button"
                onClick={handleToggleAutoPlayDialogue}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  isAutoPlayingDialogue
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {isAutoPlayingDialogue ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isAutoPlayingDialogue ? 'Dừng phát' : 'Nghe toàn bài'}</span>
              </button>

              {/* Speed rate selector */}
              <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden text-xs font-bold text-gray-600">
                <span className="px-2 py-1.5 text-gray-400 bg-gray-50 flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                </span>
                {[
                  { r: 0.75, l: '0.75x' },
                  { r: 0.85, l: 'Chuẩn' },
                  { r: 1.0, l: '1.0x' },
                ].map((sp) => (
                  <button
                    key={sp.r}
                    type="button"
                    onClick={() => setSpeechRate(sp.r)}
                    className={`px-2.5 py-1.5 transition-colors cursor-pointer ${
                      speechRate === sp.r ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    {sp.l}
                  </button>
                ))}
              </div>

              {/* Pinyin toggle */}
              <button
                type="button"
                onClick={() => setShowPinyin(!showPinyin)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showPinyin
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Pinyin</span>
              </button>

              {/* Translation toggle */}
              <button
                type="button"
                onClick={() => setShowTranslation(!showTranslation)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showTranslation
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {showTranslation ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Dịch nghĩa</span>
              </button>
            </div>
          </div>

          {allDialogues.length > 0 ? (
            <div className="glass-light rounded-[28px] p-6 sm:p-8 space-y-4">
              {allDialogues.map((line, idx) => {
                const isPlaying = playingDialogueIdx === idx;

                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      isPlaying
                        ? 'bg-primary-50/60 border-primary-400 ring-2 ring-primary-500/20'
                        : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-primary-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {line.speaker}
                        </span>
                        <span className="text-xl sm:text-2xl font-chinese font-bold text-gray-900">
                          {line.hanzi}
                        </span>
                      </div>

                      {showPinyin && (
                        <p className="text-sm font-semibold text-primary-600 pl-9.5">
                          {line.pinyin}
                        </p>
                      )}

                      {showTranslation && (
                        <p className="text-xs sm:text-sm text-gray-600 pl-9.5">
                          {line.meaning}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPlayingDialogueIdx(idx);
                        playSpeech(line.hanzi);
                        setTimeout(() => setPlayingDialogueIdx(null), 1500);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                        isPlaying
                          ? 'bg-primary-600 text-white border-primary-600 scale-105'
                          : 'bg-white text-gray-600 hover:text-primary-600 hover:bg-primary-50 border-gray-200'
                      }`}
                      title="Nghe câu này"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-500 border border-gray-200">
              Bài học này không có đoạn hội thoại âm thanh.
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 5: LUYỆN VIẾT CHỮ HÁN SVG & Ô CHỮ MỄ
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'hanzi' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-extrabold text-gray-900">
                Bảng luyện viết chữ Hán theo thứ tự nét
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Xem thứ tự nét chuẩn và tự tay tập viết trên ô chữ mễ (米字格).
              </p>
            </div>

            {selectedChar && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Chữ {selectedCharIdx + 1} / {lesson.vocabularies.length}
              </span>
            )}
          </div>

          {/* Character horizontal selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {lesson.vocabularies.map((v, idx) => {
              const isSelected = selectedCharIdx === idx;
              return (
                <button
                  key={v.charId || idx}
                  type="button"
                  onClick={() => setSelectedCharIdx(idx)}
                  className={`px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-chinese text-lg">{v.character}</span>
                  <span className="text-xs opacity-90">{v.pinyin}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Hanzi Canvas Component */}
          {selectedChar ? (
            <div className="glass-light rounded-[28px] p-6 sm:p-8 space-y-6">
              <HanziCanvas
                character={selectedChar.character}
                pinyin={selectedChar.pinyin}
                meaning={selectedChar.meaning}
                sinoVietnamese={selectedChar.sinoVietnamese}
                strokesCount={selectedChar.strokesCount}
                strokeOrderSvg={selectedChar.strokeOrderSvg}
                audioUrl={selectedChar.audioUrl}
              />

              {/* Next Character Shortcut button */}
              {selectedCharIdx < lesson.vocabularies.length - 1 && (
                <div className="text-center pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedCharIdx((prev) => prev + 1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span>Luyện viết chữ tiếp theo: {lesson.vocabularies[selectedCharIdx + 1].character}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-500 border border-gray-200">
              Không có chữ Hán trong bài học này để luyện tập.
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          FOOTER CALL TO ACTION (BÀI TEST CỦNG CỐ CUỐI BÀI)
         ══════════════════════════════════════════════════════════════════════════ */}
      {linkedTest && (
        <div className="bg-gradient-to-r from-primary-50 via-white to-amber-50 rounded-3xl p-6 sm:p-8 border border-primary-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md inline-block">
              Kiểm Tra Hoàn Thành Unit
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
              {linkedTest.title}
            </h3>
            <p className="text-xs text-gray-600">
              Đạt ≥ {linkedTest.passing_score}% để hệ thống tự động ghi nhận hoàn thành bài và mở khóa bài học kế tiếp theo chuỗi tiến độ.
            </p>
          </div>

          <a
            href={`#/test/${linkedTest.test_id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm shadow-md shadow-primary-600/20 transition-all shrink-0 cursor-pointer"
          >
            <FileQuestion className="w-4 h-4" />
            <span>Làm Bài Kiểm Tra Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
};
