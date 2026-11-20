import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { getCached, setCached } from '../../lib/cache';
import { celebrateSuccess } from '../../lib/celebration';
import { SrsReviewPage } from '../srs/SrsReviewPage';
import { CharacterPracticePage } from '../learning/CharacterPracticePage';
import { GlassCard, NumberTicker } from '../../components/ui';
import {
  BookOpen,
  PenTool,
  Library,
  Volume2,
  Search,
  Sparkles,
  RotateCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface VocabEntry {
  vocabularyId: string;
  word: string;
  pinyin: string;
  meaning: string;
  wordType: string | null;
  hskLevel: string;
  examples: Array<{ cn?: string; py?: string; vi?: string }>;
  notes?: { sinoVietnamese?: string; radical?: string } | null;
}

const PAGE_SIZE = 12;

const VocabFlashcard = React.memo(
  ({
    v,
    isFlipped,
    isMastered,
    onToggleFlip,
    onMarkMastered,
    onSpeak,
  }: {
    v: VocabEntry;
    isFlipped: boolean;
    isMastered: boolean;
    onToggleFlip: (id: string) => void;
    onMarkMastered: (v: VocabEntry, e: React.MouseEvent) => void;
    onSpeak: (text: string, e?: React.MouseEvent) => void;
  }) => {
    const firstEx = Array.isArray(v.examples) ? v.examples[0] : null;
    const sino = v.notes?.sinoVietnamese;

    return (
      <div
        onClick={() => onToggleFlip(v.vocabularyId)}
        className="perspective-1000 h-[212px] cursor-pointer select-none group"
      >
        <div className={`relative w-full h-full flip-3d-inner ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* FRONT FACE */}
          <div
            className={`absolute inset-0 backface-hidden rounded-2xl glass-card-grid p-5 flex flex-col justify-between ${
              isMastered ? 'ring-1 ring-emerald-500 border-emerald-300' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200">
                  {v.hskLevel.replace('HSK', 'HSK ')}
                </span>
                {v.wordType && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-500 text-[10px] font-medium">
                    {v.wordType}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => onMarkMastered(v, e)}
                  title="Đánh dấu đã thuộc"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer border ${
                    isMastered
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 border-zinc-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => onSpeak(v.word, e)}
                  aria-label={`Nghe phát âm ${v.word}`}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-zinc-900 text-zinc-600 hover:text-white border border-zinc-200 hover:border-zinc-900 flex items-center justify-center transition-colors duration-150 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="font-hanzi-serif text-4xl font-bold text-zinc-950 tracking-wide">
                {v.word}
              </p>
              <p className="text-[13px] font-mono font-semibold text-[#BE123C]">{v.pinyin}</p>
              <p className="text-sm font-medium text-zinc-700">{v.meaning}</p>
            </div>

            <p className="text-[10.5px] font-medium text-zinc-400 text-center flex items-center justify-center gap-1">
              <RotateCw className="w-3 h-3 text-zinc-400 group-hover:rotate-90 transition-transform duration-200" />
              Bấm để xem ví dụ & âm Hán-Việt
            </p>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-zinc-50 border border-zinc-200 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-hanzi-serif font-bold text-xl text-zinc-950 truncate">
                  {v.word}
                </span>
                <span className="text-xs font-mono font-semibold text-[#BE123C] truncate">
                  {v.pinyin}
                </span>
              </div>
              {sino && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-700 font-semibold text-[10px] shrink-0">
                  Hán-Việt: {sino}
                </span>
              )}
            </div>

            {firstEx?.cn ? (
              <div className="p-3 rounded-xl bg-white border border-zinc-200 text-xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-chinese font-semibold text-sm text-zinc-950 leading-snug">
                    {firstEx.cn}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => onSpeak(firstEx.cn || v.word, e)}
                    className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-900 text-zinc-700 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    aria-label="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {firstEx.py && <p className="text-[11px] font-mono text-[#BE123C]">{firstEx.py}</p>}
                {firstEx.vi && <p className="text-[11px] text-zinc-600">{firstEx.vi}</p>}
              </div>
            ) : (
              <p className="text-sm font-medium text-zinc-800 text-center">{v.meaning}</p>
            )}

            <p className="text-[10.5px] font-medium text-zinc-400 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              Bấm để lật lại mặt trước
            </p>
          </div>
        </div>
      </div>
    );
  }
);

export const VocabPage: React.FC<{ initialTab?: 'bank' | 'srs' | 'writing' }> = ({
  initialTab = 'bank',
}) => {
  const [tab, setTab] = useState<'bank' | 'srs' | 'writing'>(initialTab);
  const [levelFilter, setLevelFilter] = useState<string>('HSK1');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [vocabList, setVocabList] = useState<VocabEntry[]>(
    () => getCached<VocabEntry[]>('vocab:HSK1:') || []
  );
  const [loadingBank, setLoadingBank] = useState(() => !getCached<VocabEntry[]>('vocab:HSK1:'));
  const [page, setPage] = useState(1);
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});
  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  // Debounce search input so typing feels effortless and avoids extra API requests
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 180);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (tab !== 'bank') return;
    const cacheKey = `vocab:${levelFilter}:${debouncedSearch.toLowerCase()}`;
    const cached = getCached<VocabEntry[]>(cacheKey);
    setPage(1);

    if (cached) {
      setVocabList(cached);
      setLoadingBank(false);
      return;
    }

    let cancelled = false;
    // Keep existing list visible while fetching to avoid jarring flicker/reflow
    if (vocabList.length === 0) setLoadingBank(true);

    api
      .get<VocabEntry[]>('/curriculum/vocabularies', {
        params: {
          level: levelFilter === 'ALL' ? undefined : levelFilter,
          search: debouncedSearch || undefined,
          limit: 160,
        },
      })
      .then((res) => {
        if (cancelled) return;
        const list = res || [];
        setCached(cacheKey, list);
        setVocabList(list);
      })
      .catch(() => {
        if (!cancelled) setVocabList([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBank(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, levelFilter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(vocabList.length / PAGE_SIZE));
  const visibleVocab = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return vocabList.slice(start, start + PAGE_SIZE);
  }, [vocabList, page]);

  const speakWord = useCallback((text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, []);

  const toggleFlip = useCallback((id: string) => {
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const markMastered = useCallback((v: VocabEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setMasteredIds((prev) => {
      const nextVal = !prev[v.vocabularyId];
      const next = { ...prev, [v.vocabularyId]: nextVal };
      if (nextVal) {
        const total = Object.values(next).filter(Boolean).length;
        celebrateSuccess(
          total % 5 === 0 ? `Xuất sắc! Đã thuộc ${total} từ vựng` : `Đã thuộc “${v.word}” (+5 XP)`,
          total % 5 === 0 ? 'confetti' : 'sparkle',
          `${v.pinyin} — ${v.meaning}`
        );
      }
      return next;
    });
  }, []);

  const tabs = [
    { id: 'bank' as const, label: 'Kho HSK 1–6', icon: Library },
    { id: 'srs' as const, label: 'Ôn thẻ nhớ', icon: BookOpen },
    { id: 'writing' as const, label: 'Tập viết Hán tự', icon: PenTool },
  ];

  return (
    <div className="max-w-6xl mx-auto pt-8 px-5 sm:px-8 space-y-6">
      {/* Header & Clean Segmented Control */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400">
            Kho từ vựng & Thư pháp
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 flex items-center gap-2.5 mt-1 tracking-tight">
            <span className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
              <Library className="w-4 h-4" />
            </span>
            <span>Từ vựng & Chữ Hán HSK 1–6</span>
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Tra cứu từ vựng HSK 1–6 theo cấp độ, ôn thẻ nhớ SRS và luyện viết chữ Hán.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 self-start shrink-0">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => startTransition(() => setTab(item.id))}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                  active ? 'text-white' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="vocab-liquid-tab"
                    transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                    className="absolute inset-0 rounded-lg bg-zinc-900 shadow-xs"
                  />
                )}
                <Icon className="relative z-10 w-3.5 h-3.5 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Body */}
      {tab === 'bank' && (
        <div className="space-y-6">
          <GlassCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const).map((lvl) => {
                const active = levelFilter === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => startTransition(() => setLevelFilter(lvl))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap border ${
                      active
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    {lvl === 'ALL' ? 'Tất cả' : lvl.replace('HSK', 'HSK ')}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm chữ Hán, pinyin, nghĩa..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-colors"
                />
              </div>
              <span className="px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono font-semibold shrink-0 tabular-nums">
                <NumberTicker value={vocabList.length} suffix=" từ" />
              </span>
            </div>
          </GlassCard>

          {loadingBank ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[212px] rounded-2xl glass-card-grid animate-pulse" />
              ))}
            </div>
          ) : visibleVocab.length === 0 ? (
            <GlassCard className="p-12 text-center text-zinc-500 text-sm">
              Không tìm thấy từ vựng phù hợp. Hãy thử đổi từ khóa hoặc cấp độ HSK.
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleVocab.map((v) => (
                  <VocabFlashcard
                    key={v.vocabularyId}
                    v={v}
                    isFlipped={!!flippedIds[v.vocabularyId]}
                    isMastered={!!masteredIds[v.vocabularyId]}
                    onToggleFlip={toggleFlip}
                    onMarkMastered={markMastered}
                    onSpeak={speakWord}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trang trước
                  </button>
                  <span className="px-3.5 py-2 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono font-semibold text-zinc-900 tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-700 disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    Trang sau
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'srs' && <SrsReviewPage />}
      {tab === 'writing' && <CharacterPracticePage />}
    </div>
  );
};
