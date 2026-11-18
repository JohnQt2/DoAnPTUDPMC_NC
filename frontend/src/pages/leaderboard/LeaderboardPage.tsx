import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Flame, Medal } from 'lucide-react';

const SAMPLE_LEADERS = [
  { rank: 1, name: 'Nguyễn Minh Anh', level: 'HSK 3', points: 1420, streak: 19 },
  { rank: 2, name: 'Trần Quốc Bảo', level: 'HSK 2', points: 1280, streak: 14 },
  { rank: 3, name: 'Lê Thu Hà', level: 'HSK 2', points: 1150, streak: 12 },
  { rank: 4, name: 'Phạm Gia Huy', level: 'HSK 1', points: 980, streak: 9 },
  { rank: 5, name: 'Hoàng Lan Phương', level: 'HSK 1', points: 860, streak: 7 },
];

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary-500" />
          Bảng xếp hạng tuần
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Học đều mỗi ngày để tích điểm và leo hạng cùng cộng đồng Hanzi4u.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
        {SAMPLE_LEADERS.map((entry) => (
          <div
            key={entry.rank}
            className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                  entry.rank === 1
                    ? 'bg-amber-100 text-amber-700'
                    : entry.rank === 2
                      ? 'bg-gray-200 text-gray-700'
                      : entry.rank === 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-50 text-gray-500'
                }`}
              >
                {entry.rank <= 3 ? <Medal className="w-5 h-5" /> : entry.rank}
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">{entry.name}</p>
                <p className="text-xs text-gray-500">{entry.level}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
                <Flame className="w-3.5 h-3.5" />
                {entry.streak} ngày
              </span>
              <span className="text-sm font-extrabold text-gray-900 min-w-[70px] text-right">
                {entry.points} XP
              </span>
            </div>
          </div>
        ))}

        {/* Current User Row */}
        {user && (
          <div className="px-5 py-4 bg-primary-50/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center font-black text-sm">
                Bạn
              </div>
              <div>
                <p className="text-sm font-bold text-primary-700">{user.displayName}</p>
                <p className="text-xs text-primary-600/80">Đang tích lũy điểm tuần này</p>
              </div>
            </div>
            <a
              href="#/today"
              className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-colors"
            >
              Học thêm ngay
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

