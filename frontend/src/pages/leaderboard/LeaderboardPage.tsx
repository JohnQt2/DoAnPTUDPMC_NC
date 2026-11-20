import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, ShimmerButton, NumberTicker } from '../../components/ui';
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
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5 tracking-tight">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-secondary-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Trophy className="w-5 h-5" />
          </span>
          <span>Bảng xếp hạng tuần</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Học đều mỗi ngày để tích điểm và leo hạng cùng cộng đồng Hanzi4U.
        </p>
      </div>

      <GlassCard className="overflow-hidden divide-y divide-gray-200/60">
        {SAMPLE_LEADERS.map((entry, idx) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/70 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                  entry.rank === 1
                    ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950'
                    : entry.rank === 2
                      ? 'bg-gradient-to-tr from-gray-300 to-gray-100 text-gray-800'
                      : entry.rank === 3
                        ? 'bg-gradient-to-tr from-orange-300 to-amber-200 text-orange-950'
                        : 'bg-white/80 border border-gray-200 text-gray-500'
                }`}
              >
                {entry.rank <= 3 ? <Medal className="w-5 h-5" /> : entry.rank}
              </div>

              <div>
                <p className="text-sm font-extrabold text-gray-900">{entry.name}</p>
                <p className="text-xs text-gray-500 font-medium">{entry.level}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-primary-600 bg-primary-50/90 border border-primary-100 px-2.5 py-1 rounded-xl">
                <Flame className="w-3.5 h-3.5 fill-primary-500 text-primary-500" />
                {entry.streak} ngày
              </span>
              <span className="text-sm font-black text-gray-900 min-w-[76px] text-right">
                <NumberTicker value={entry.points} suffix=" XP" />
              </span>
            </div>
          </motion.div>
        ))}

        {/* Current User Row */}
        {user && (
          <div className="px-5 py-4 bg-gradient-to-r from-primary-500/10 via-rose-500/5 to-secondary-500/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-secondary-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                Bạn
              </div>
              <div>
                <p className="text-sm font-extrabold text-primary-700">{user.displayName}</p>
                <p className="text-xs text-primary-600/80 font-medium">Đang tích lũy điểm tuần này</p>
              </div>
            </div>
            <ShimmerButton href="#/today" size="sm" className="rounded-xl">
              Học thêm ngay
            </ShimmerButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
