import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, ShimmerButton, NumberTicker, UserAvatar } from '../../components/ui';
import {
  Trophy,
  Flame,
  Medal,
  RefreshCw,
  Calendar,
  BookOpen,
  Users,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  displayName: string;
  avatarUrl: string | null;
  level: string;
  weeklyXp: number;
  totalXp: number;
  streak: number;
  weeklyLessons: number;
  completedLessons: number;
  isCurrentUser: boolean;
}

interface WeeklyLeaderboardResponse {
  weekStart: string;
  weekEnd: string;
  totalParticipants: number;
  leaders: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
}

function formatShortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklyLeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLeaderboard = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await api.get<WeeklyLeaderboardResponse>('/users/leaderboard/weekly');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load weekly leaderboard:', err);
      setErrorMsg(err?.message || 'Không thể tải bảng xếp hạng lúc này.');
    } finally {
      setIsLoading(false);
      if (showSpinner) {
        setIsRefreshing(false);
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 1600);
      }
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const leaders = data?.leaders || [];
  const currentUserEntry = data?.currentUser || null;
  const isCurrentUserInList = Boolean(
    currentUserEntry && leaders.some((e) => e.userId === currentUserEntry.userId)
  );
  const hasWeeklyActivity = leaders.some((e) => e.weeklyXp > 0);
  const podiumEntries = hasWeeklyActivity && leaders.length >= 2 ? leaders.slice(0, 3) : [];
  const weekRangeLabel =
    data?.weekStart && data?.weekEnd
      ? `Tuần ${formatShortDate(data.weekStart)} – ${formatShortDate(data.weekEnd)}`
      : 'Tuần này';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900 flex items-center gap-2.5 tracking-tight">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4A017] to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Trophy className="w-5 h-5" />
            </span>
            <span>Bảng xếp hạng tuần</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Tổng hợp điểm XP thực tế từ tiến độ học bài, kiểm tra, luyện viết và ôn thẻ SRS.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full glass-light border border-[#1C1917]/10 dark:border-white/12 text-xs font-bold text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-[#C41E3A] dark:text-rose-400" />
            <span>{weekRangeLabel}</span>
          </span>
          <button
            type="button"
            onClick={() => loadLeaderboard(true)}
            disabled={isRefreshing}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full glass-light border text-xs font-bold transition-all cursor-pointer disabled:opacity-65 ${
              justRefreshed
                ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300 bg-emerald-50/75 dark:bg-emerald-950/35'
                : 'border-[#1C1917]/10 dark:border-white/12 text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            {justRefreshed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Đã cập nhật</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C41E3A]' : ''}`} />
                <span>{isRefreshing ? 'Đang tải...' : 'Tải lại'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transparent Real XP Formula Legend */}
      <div className="px-4 py-3 rounded-2xl glass-light flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-gray-600">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 text-gray-800 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
            Cách tính XP tuần:
          </span>
          <span>Bài học +50 XP</span>
          <span aria-hidden="true">·</span>
          <span>Bài test ≤ +80 XP</span>
          <span aria-hidden="true">·</span>
          <span>Tập viết +10 XP</span>
          <span aria-hidden="true">·</span>
          <span>Ôn thẻ SRS +5 XP</span>
        </div>
        {data && (
          <span className="inline-flex items-center gap-1 text-gray-500 shrink-0">
            <Users className="w-3.5 h-3.5" />
            {data.totalParticipants} học viên
          </span>
        )}
      </div>

      {isLoading ? (
        <GlassCard className="p-5 space-y-3 rounded-[26px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/60 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </GlassCard>
      ) : errorMsg ? (
        <GlassCard className="p-8 text-center space-y-4 rounded-[26px]">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{errorMsg}</p>
          <ShimmerButton type="button" onClick={() => loadLeaderboard(true)} size="sm">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử tải lại</span>
          </ShimmerButton>
        </GlassCard>
      ) : leaders.length === 0 ? (
        <GlassCard className="p-10 text-center space-y-4 rounded-[26px]">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/12 text-[#D4A017] flex items-center justify-center mx-auto">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-display font-bold text-gray-900">
              Chưa có dữ liệu xếp hạng tuần này
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Hoàn thành bài học, làm bài kiểm tra hoặc ôn tập thẻ nhớ để ghi những điểm XP đầu tiên của tuần mới.
            </p>
          </div>
          <div className="pt-1 flex justify-center">
            <ShimmerButton href="#/today" size="sm">
              Bắt đầu học ngay
            </ShimmerButton>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Top 3 Real Podium Cards (only when weekly activity exists) */}
          {podiumEntries.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {podiumEntries.map((entry) => {
                const rankStyle =
                  entry.rank === 1
                    ? {
                        ring: 'border-[#D4A017]/45 bg-gradient-to-b from-amber-50/90 to-[#FCFBF8]/95 dark:from-amber-950/30 dark:to-[#141c2b]/90',
                        badge: 'bg-gradient-to-tr from-[#D4A017] to-amber-300 text-amber-950',
                        label: 'Hạng 1',
                      }
                    : entry.rank === 2
                      ? {
                          ring: 'border-slate-300/70 bg-gradient-to-b from-slate-50/90 to-[#FCFBF8]/95 dark:from-slate-800/60 dark:to-[#141c2b]/90',
                          badge: 'bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 dark:from-slate-600 dark:to-slate-700 dark:text-slate-100',
                          label: 'Hạng 2',
                        }
                      : {
                          ring: 'border-orange-300/65 bg-gradient-to-b from-orange-50/85 to-[#FCFBF8]/95 dark:from-orange-950/25 dark:to-[#141c2b]/90',
                          badge: 'bg-gradient-to-tr from-orange-300 to-amber-200 text-orange-950',
                          label: 'Hạng 3',
                        };

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: (entry.rank - 1) * 0.06 }}
                    className={`rounded-[24px] p-4 border shadow-xs flex flex-col items-center text-center gap-2.5 ${rankStyle.ring}`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${rankStyle.badge}`}
                    >
                      <Medal className="w-3.5 h-3.5" />
                      {rankStyle.label}
                    </span>

                    <UserAvatar
                      avatarUrl={entry.avatarUrl}
                      displayName={entry.displayName}
                      size="md"
                    />

                    <div className="min-w-0 w-full">
                      <p className="text-sm font-extrabold text-gray-900 truncate">
                        {entry.displayName}
                        {entry.isCurrentUser && (
                          <span className="ml-1 text-[10px] font-bold text-[#C41E3A] dark:text-rose-400">
                            (Bạn)
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">{entry.level}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2.5 pt-1">
                      <span className="text-sm font-black text-[#C41E3A] dark:text-rose-400">
                        <NumberTicker value={entry.weeklyXp} suffix=" XP" />
                      </span>
                      {entry.streak > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/12 px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {entry.streak}d
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full Real Leaderboard Table */}
          <GlassCard className="overflow-hidden divide-y divide-gray-200/60 dark:divide-white/10 rounded-[26px]">
            {!hasWeeklyActivity && (
              <div className="px-5 py-3 bg-amber-50/70 dark:bg-amber-950/25 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                <span>Tuần mới vừa bắt đầu — hãy là người đầu tiên bứt phá điểm XP!</span>
                <a
                  href="#/today"
                  className="underline font-bold hover:text-[#C41E3A] shrink-0"
                >
                  Học ngay →
                </a>
              </div>
            )}

            {leaders.map((entry, idx) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: Math.min(idx * 0.035, 0.35) }}
                className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                  entry.isCurrentUser
                    ? 'bg-rose-50/75 dark:bg-rose-950/25'
                    : 'hover:bg-white/65 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                      entry.rank === 1 && entry.weeklyXp > 0
                        ? 'bg-gradient-to-tr from-[#D4A017] to-yellow-300 text-amber-950'
                        : entry.rank === 2 && entry.weeklyXp > 0
                          ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 dark:from-slate-600 dark:to-slate-700 dark:text-slate-100'
                          : entry.rank === 3 && entry.weeklyXp > 0
                            ? 'bg-gradient-to-tr from-orange-300 to-amber-200 text-orange-950'
                            : 'bg-white/80 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 text-gray-500'
                    }`}
                  >
                    {entry.rank <= 3 && entry.weeklyXp > 0 ? (
                      <Medal className="w-4 h-4" />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  <UserAvatar
                    avatarUrl={entry.avatarUrl}
                    displayName={entry.displayName}
                    size="sm"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-extrabold text-gray-900 truncate">
                        {entry.displayName}
                      </p>
                      {entry.isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-[#C41E3A]/12 text-[#C41E3A] dark:bg-rose-500/20 dark:text-rose-300 text-[10px] font-extrabold shrink-0">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>{entry.level}</span>
                      {entry.weeklyLessons > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {entry.weeklyLessons} bài tuần này
                          </span>
                        </>
                      )}
                      {entry.weeklyXp === 0 && entry.totalXp > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Tổng tích lũy: {entry.totalXp} XP</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl border ${
                      entry.streak > 0
                        ? 'text-[#C41E3A] dark:text-rose-300 bg-rose-50/85 dark:bg-rose-950/35 border-rose-200/70 dark:border-rose-800/60'
                        : 'text-gray-400 bg-white/60 dark:bg-slate-800/60 border-gray-200/60 dark:border-slate-700'
                    }`}
                  >
                    <Flame
                      className={`w-3.5 h-3.5 ${
                        entry.streak > 0
                          ? 'fill-[#C41E3A] text-[#C41E3A] dark:fill-rose-400 dark:text-rose-400'
                          : 'text-gray-400'
                      }`}
                    />
                    {entry.streak} ngày
                  </span>
                  <span className="text-sm font-black text-gray-900 min-w-[74px] text-right tabular-nums">
                    <NumberTicker value={entry.weeklyXp} suffix=" XP" />
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Pinned Current User Row if logged-in student is outside top 20 */}
            {currentUserEntry && !isCurrentUserInList && (
              <div className="px-4 sm:px-5 py-4 bg-rose-50/70 dark:bg-rose-950/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#C41E3A] text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                    #{currentUserEntry.rank}
                  </div>
                  <UserAvatar
                    avatarUrl={currentUserEntry.avatarUrl}
                    displayName={currentUserEntry.displayName}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-900 truncate">
                      {currentUserEntry.displayName}{' '}
                      <span className="text-xs text-[#C41E3A] dark:text-rose-400">(Bạn)</span>
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {currentUserEntry.level} · {currentUserEntry.weeklyXp} XP tuần này
                    </p>
                  </div>
                </div>
                <ShimmerButton href="#/today" size="sm" className="rounded-xl shrink-0">
                  Học thêm ngay
                </ShimmerButton>
              </div>
            )}
          </GlassCard>

          {/* Footer Encouragement CTA for Current Student */}
          {user && currentUserEntry && (
            <div className="rounded-2xl glass-light px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-gray-600 leading-relaxed">
                Hạng hiện tại của bạn:{' '}
                <strong className="text-gray-900">
                  #{currentUserEntry.rank}/{data?.totalParticipants || leaders.length}
                </strong>{' '}
                với{' '}
                <strong className="text-[#C41E3A] dark:text-rose-400">
                  {currentUserEntry.weeklyXp} XP
                </strong>{' '}
                tuần này ({currentUserEntry.completedLessons} bài đã hoàn thành).
              </div>
              <ShimmerButton href="#/today" size="sm" className="rounded-xl shrink-0 self-start sm:self-auto">
                Học thêm để tăng hạng
              </ShimmerButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};
