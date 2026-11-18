import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { HanziCanvas } from '../../components/HanziCanvas';
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
  Layers,
  Award,
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

  // Dialogue toggle states
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [playingDialogueIdx, setPlayingDialogueIdx] = useState<number | null>(null);

  // Hanzi practice selection
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);

  // Flashcard flip states for vocabulary tab
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadLesson();
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

  const playSpeech = (text: string, customAudioUrl?: string | null) => {
    if (customAudioUrl) {
      const audio = new Audio(customAudioUrl);
      audio.play().catch(() => playSpeechFallback(text));
    } else {
      playSpeechFallback(text);
    }
  };

  const playSpeechFallback = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85; // Slightly slower for language learners
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

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Status Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <a
          href={`#/courses/${lesson.chapter.course?.course_id || 1}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại {lesson.chapter.title}</span>
        </a>

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
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Làm bài test củng cố (≥80%)</span>
            </a>
          )}
        </div>
      </div>

      {/* Lesson Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-md">
            {lesson.chapter.title}
          </span>
          <span className="text-xs text-gray-400 font-semibold">•</span>
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lesson.estimatedDurationMins} phút
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {lesson.title}
        </h1>

        <p className="text-xs sm:text-sm text-gray-500">
          Không gian học tập tích hợp: Đầy đủ từ vựng Flashcard, ngữ pháp trọng tâm, luyện nghe hội thoại Audio và luyện viết nét chữ Hán SVG theo Unit.
        </p>

        {/* Tab Switcher */}
        <div className="pt-4 border-t border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'content'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Nội dung bài học ({blocks.length} phần)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'vocab'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Từ vựng Unit ({lesson.vocabularies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grammar')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'grammar'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ngữ pháp & Mẫu câu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dialogue')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'dialogue'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Hội thoại Audio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hanzi')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              activeTab === 'hanzi'
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Luyện viết chữ Hán SVG</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: NỘI DUNG BÀI HỌC TUẦN TỰ (STEP-BY-STEP BLOCKS)
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Progress bar inside step */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-gray-600">
              Phần {currentBlockIdx + 1} / {blocks.length}
            </span>

            <div className="flex-1 max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="text-xs font-semibold text-primary-600">{progressPercent}%</span>
          </div>

          {/* Current Block Content Card */}
          {currentBlock ? (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-extrabold text-xs uppercase tracking-wider">
                  {currentBlock.blockType === 'THEORY' && 'Lý Thuyết & Ngữ Pháp'}
                  {currentBlock.blockType === 'PINYIN' && 'Ngữ Âm Pinyin & Thanh Điệu'}
                  {currentBlock.blockType === 'HANZI' && 'Chữ Hán & Bút Thuận'}
                  {currentBlock.blockType === 'AUDIO' && 'Hội Thoại Audio Thực Tế'}
                </span>

                <span className="text-xs text-gray-400">Thứ tự {currentBlock.orderIndex}</span>
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
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm leading-relaxed">
                      💡 <strong>Quy tắc quan trọng:</strong> {blockContent.rule}
                    </div>
                  )}

                  {blockContent.syllables && (
                    <div className="flex flex-wrap gap-3 justify-center py-4">
                      {blockContent.syllables.map((syl: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => playSpeech(syl)}
                          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-800 font-bold text-lg transition-all cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 text-primary-600" />
                          <span>{syl}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. HANZI */}
              {currentBlock.blockType === 'HANZI' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-5xl font-chinese font-black text-gray-900 block">
                      {blockContent.character}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">{blockContent.meaning}</p>
                  </div>

                  <div className="text-center pt-2">
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
                            <span className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lesson.vocabularies.map((vocab, idx) => {
              const isFlipped = flippedCards[idx] ?? false;

              return (
                <div
                  key={vocab.charId || idx}
                  className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
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
                      <span>Luyện viết</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: NGỮ PHÁP & MẪU CÂU TRỌNG TÂM
         ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'grammar' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-gray-900">Ngữ Pháp & Mẫu Câu Trọng Tâm</h2>
            <p className="text-xs text-gray-500">
              Quy tắc cấu trúc câu tiếng Trung và các mẫu câu thông dụng trong bài học
            </p>
          </div>

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
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                      <h3 className="text-lg font-black text-gray-900">
                        {content.title || 'Chủ điểm ngữ pháp'}
                      </h3>
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                      {content.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-500 border border-gray-200">
              Bài học này tập trung vào làm quen ngữ âm và chữ Hán căn bản.
            </div>
          )}

          {/* Minimal Pairs / Pinyin Rules if present */}
          {pinyinBlocks.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-gray-900">Quy Tắc Biến Điệu & Ngữ Âm</h3>
              <div className="space-y-3">
                {pinyinBlocks.map((b) => {
                  let pContent: any = {};
                  try {
                    pContent = JSON.parse(b.contentJson);
                  } catch {}

                  return (
                    <div key={b.blockId} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 space-y-2">
                      {pContent.rule && <p className="font-semibold leading-relaxed">💡 {pContent.rule}</p>}
                      {pContent.syllables && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {pContent.syllables.map((s: string, sIdx: number) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => playSpeech(s)}
                              className="px-3 py-1 rounded-lg bg-white border border-amber-300 font-bold text-amber-900 hover:bg-amber-100 cursor-pointer flex items-center gap-1.5"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-amber-700" />
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 4: HỘI THOẠI AUDIO THỰC TẾ
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

            {/* Display Toggles */}
            <div className="flex items-center gap-2">
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
              {allDialogues.map((line, idx) => {
                const isPlaying = playingDialogueIdx === idx;

                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-gray-200 flex items-start justify-between gap-4 hover:border-primary-200 transition-colors"
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
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-gray-900">
              Bảng Luyện Viết Chữ Hán Theo Nét Bút Thuận
            </h2>
            <p className="text-xs text-gray-500">
              Xem hoạt họa các nét vẽ chuẩn SVG và tự tay tập vẽ trên ô chữ mễ (米字格)
            </p>
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm">
              <HanziCanvas
                character={selectedChar.character}
                pinyin={selectedChar.pinyin}
                meaning={selectedChar.meaning}
                sinoVietnamese={selectedChar.sinoVietnamese}
                strokesCount={selectedChar.strokesCount}
                strokeOrderSvg={selectedChar.strokeOrderSvg}
                audioUrl={selectedChar.audioUrl}
              />
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md">
              Kiểm Tra Hoàn Thành Unit
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
              {linkedTest.title}
            </h3>
            <p className="text-xs text-gray-600">
              Đạt ≥ {linkedTest.passing_score}% để hệ thống tự động ghi nhận hoàn thành bài và mở khóa bài học kế tiếp.
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
