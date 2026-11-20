import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { getCached, setCached } from '../../lib/cache';
import { celebrateSuccess } from '../../lib/celebration';
import { HanziCanvas } from '../../components/HanziCanvas';
import { FALLBACK_STARTER_CHARACTERS } from '../../components/hanziStrokes.data';
import { GlassCard } from '../../components/ui';
import { Search, CheckCircle2 } from 'lucide-react';

const COMPLETED_CHARS_STORAGE_KEY = 'hanzi4u_practiced_chars';

function loadCompletedIds(): number[] {
  try {
    const raw = localStorage.getItem(COMPLETED_CHARS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const CharacterPracticePage: React.FC = () => {
  const [characters, setCharacters] = useState<any[]>(() => getCached<any[]>('characters:all') || []);
  const [selectedChar, setSelectedChar] = useState<any | null>(
    () => (getCached<any[]>('characters:all') || [])[0] || null
  );
  const [completedIds, setCompletedIds] = useState<number[]>(loadCompletedIds);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(() => !getCached<any[]>('characters:all'));

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async (searchTerm?: string) => {
    const cacheKey = `characters:${(searchTerm || 'all').trim().toLowerCase()}`;
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      setCharacters(cached);
      if (cached.length > 0 && !selectedChar) setSelectedChar(cached[0]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.get<any[]>('/learning/characters', {
        params: { search: searchTerm || undefined },
      });
      const apiList = Array.isArray(data) ? data : [];
      const list = apiList.length > 0 || searchTerm ? apiList : FALLBACK_STARTER_CHARACTERS;
      setCached(cacheKey, list);
      setCharacters(list);
      if (list.length > 0 && !selectedChar) {
        setSelectedChar(list[0]);
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
      if (!searchTerm && characters.length === 0) {
        setCharacters(FALLBACK_STARTER_CHARACTERS);
        setSelectedChar(FALLBACK_STARTER_CHARACTERS[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCharacters(search);
  };

  const handlePracticeComplete = async () => {
    if (!selectedChar) return;
    const cid = selectedChar.charId;
    setCompletedIds((prev) => {
      if (prev.includes(cid)) return prev;
      const next = [...prev, cid];
      try {
        localStorage.setItem(COMPLETED_CHARS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await api.post('/learning/practices', {
        practice_type: 'HANZI_STROKE',
        char_id: cid,
        is_successful: true,
        mistakes_count: 0,
      });
    } catch (err) {
      console.error('Failed to record practice:', err);
    }

    celebrateSuccess(
      `Đã hoàn thành luyện viết chữ “${selectedChar.character}”`,
      'sparkle',
      'Đã đánh dấu hoàn thành và lưu vào danh sách ôn tập.'
    );
  };

  const handleNextCharacter = () => {
    if (!selectedChar || characters.length === 0) return;
    const idx = characters.findIndex((c) => c.charId === selectedChar.charId);
    const nextIdx = idx >= 0 ? (idx + 1) % characters.length : 0;
    setSelectedChar(characters[nextIdx]);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">
            Luyện viết chữ Hán theo thứ tự nét
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Quan sát thứ tự từng nét chữ Hán và luyện viết trực tiếp trên ô Điền Tự Cách (田字格).
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-light text-xs font-bold text-emerald-700 self-start sm:self-auto shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Đã luyện: {completedIds.length} / {characters.length} chữ
        </span>
      </div>

      {/* Main Content Layout: Left Character Picker, Right Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <GlassCard className="lg:col-span-5 rounded-2xl p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm chữ Hán, Pinyin, nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-colors"
            />
          </form>

          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl glass-card-grid animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {characters.map((c) => {
                const isSelected = selectedChar?.charId === c.charId;
                const isDone = completedIds.includes(c.charId);
                const isMulti = String(c.character || '').length > 1;
                return (
                  <button
                    key={c.charId}
                    type="button"
                    onClick={() => setSelectedChar(c)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-zinc-50 border-zinc-900 ring-1 ring-zinc-900'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-11 h-11 rounded-lg bg-zinc-50 flex items-center justify-center font-hanzi-serif font-bold text-zinc-950 border border-zinc-200 shrink-0 ${
                          isMulti ? 'text-base leading-none tracking-tight' : 'text-2xl'
                        }`}
                      >
                        {c.character}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sm text-[#BE123C]">
                            {c.pinyin}
                          </span>
                          {c.sinoVietnamese && (
                            <span className="text-xs text-zinc-500 truncate">[{c.sinoVietnamese}]</span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-600 line-clamp-1">{c.meaning}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDone && (
                        <span
                          title="Đã luyện xong"
                          className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
                        {c.strokesCount} nét
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>

        <div className="lg:col-span-7 flex flex-col items-center">
          {selectedChar ? (
            <HanziCanvas
              character={selectedChar.character}
              pinyin={selectedChar.pinyin}
              meaning={selectedChar.meaning}
              sinoVietnamese={selectedChar.sinoVietnamese}
              strokesCount={selectedChar.strokesCount}
              strokeOrderSvg={selectedChar.strokeOrderSvg}
              audioUrl={selectedChar.audioUrl}
              isAlreadyCompleted={completedIds.includes(selectedChar.charId)}
              onPracticeComplete={handlePracticeComplete}
              onNextCharacter={handleNextCharacter}
            />
          ) : (
            <GlassCard className="rounded-[28px] p-12 text-center text-slate-500 w-full">
              Chọn một chữ Hán bên trái để bắt đầu luyện viết.
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
