import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { HanziCanvas } from '../../components/HanziCanvas';
import { Sparkles, Search, CheckCircle2, BookOpen } from 'lucide-react';

export const CharacterPracticePage: React.FC = () => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedChar, setSelectedChar] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [practiceSuccessMsg, setPracticeSuccessMsg] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async (searchTerm?: string) => {
    try {
      const data = await api.get<any[]>('/learning/characters', {
        params: { search: searchTerm },
      });
      setCharacters(data || []);
      if (data && data.length > 0 && !selectedChar) {
        setSelectedChar(data[0]);
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
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
    try {
      await api.post('/learning/practices', {
        practice_type: 'HANZI_STROKE',
        char_id: selectedChar.charId,
        is_successful: true,
        mistakes_count: 0,
      });
      setPracticeSuccessMsg(true);
      setTimeout(() => setPracticeSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Failed to record practice:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3.5 py-1 rounded-full bg-primary-50 text-primary-600 font-extrabold text-xs uppercase tracking-wider">
          Tập Viết & Bút Thuận Chữ Hán (UC06)
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Luyện Viết Chữ Hán Chuẩn Nét
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Tập viết chữ Hán trên ô điền tự cách (田字格), quan sát hoạt ảnh vector SVG và tự tay luyện nét với cọ vẽ cảm ứng.
        </p>
      </div>

      {practiceSuccessMsg && (
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-3 text-emerald-800 text-sm animate-fade-in font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Đã lưu kết quả luyện viết và tự động thêm vào lịch ôn tập SRS!</span>
        </div>
      )}

      {/* Main Content Layout: Left Character Picker, Right Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Characters Picker (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm chữ Hán, Pinyin, nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </form>

          <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto pr-1">
            {characters.map((c) => {
              const isSelected = selectedChar?.charId === c.charId;
              return (
                <button
                  key={c.charId}
                  onClick={() => setSelectedChar(c)}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all ${
                    isSelected ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl font-chinese font-bold text-gray-900 border border-gray-200">
                      {c.character}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-primary-600">{c.pinyin}</span>
                        {c.sinoVietnamese && (
                          <span className="text-xs text-gray-400">[{c.sinoVietnamese}]</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 line-clamp-1">{c.meaning}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                    {c.strokesCount} nét
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Canvas (7 cols) */}
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
              onPracticeComplete={handlePracticeComplete}
            />
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 w-full">
              Chọn một chữ Hán bên trái để bắt đầu luyện viết.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
