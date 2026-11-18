import React, { useState } from 'react';
import { SrsReviewPage } from '../srs/SrsReviewPage';
import { CharacterPracticePage } from '../learning/CharacterPracticePage';
import { BookOpen, PenTool } from 'lucide-react';

export const VocabPage: React.FC<{ initialTab?: 'srs' | 'writing' }> = ({ initialTab = 'srs' }) => {
  const [tab, setTab] = useState<'srs' | 'writing'>(initialTab);

  return (
    <div className="max-w-5xl mx-auto pt-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Từ vựng & Chữ Hán</h1>
          <p className="text-sm text-gray-500">Ôn từ mới bằng thẻ nhớ hoặc tập viết từng nét chữ</p>
        </div>

        <div className="inline-flex p-1 rounded-2xl bg-gray-100 self-start">
          <button
            type="button"
            onClick={() => setTab('srs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              tab === 'srs'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Thẻ từ vựng</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('writing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              tab === 'writing'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Tập viết chữ Hán</span>
          </button>
        </div>
      </div>

      <div className="mt-2">
        {tab === 'srs' ? <SrsReviewPage /> : <CharacterPracticePage />}
      </div>
    </div>
  );
};

