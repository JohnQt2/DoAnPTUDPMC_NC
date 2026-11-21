import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { celebrateSuccess } from '../../lib/celebration';
import { appConfirm, appNotice } from '../../lib/dialog';
import { GlassCard, UserAvatar, ShimmerButton } from '../../components/ui';
import {
  normalizeLevel,
  normalizeGoal,
  normalizeDailyMins,
  normalizeReminderTime,
} from '../onboarding/OnboardingRoadmapPage';
import {
  User,
  Bell,
  Compass,
  Monitor,
  Trash2,
  Save,
  Clock,
  Sparkles,
  Smartphone,
  Laptop,
  Shield,
  Search,
  LogOut,
  Camera,
  Sun,
  Moon,
} from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Học viên',
  CONTENT_EDITOR: 'Biên tập nội dung',
  ADMIN: 'Quản trị viên',
};

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'CONTENT_EDITOR';

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWebpush, setNotifyWebpush] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  // Student learning goals
  const [startingLevel, setStartingLevel] = useState('ZERO');
  const [targetGoal, setTargetGoal] = useState('HSK1');
  const [dailyCommitment, setDailyCommitment] = useState(15);

  // Admin account management
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      appNotice('Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const compressed = canvas.toDataURL('image/jpeg', 0.84);

        setAvatarUrl(compressed);
        setIsUploadingAvatar(true);
        try {
          const updatedRes = await api.put<any>('/users/me', {
            display_name: displayName || user?.displayName || 'Người dùng',
            avatar_url: compressed,
          });
          const savedAvatar =
            updatedRes?.profile?.avatarUrl !== undefined
              ? updatedRes.profile.avatarUrl
              : compressed;
          updateUser({ avatarUrl: savedAvatar });
          celebrateSuccess('Đã cập nhật ảnh đại diện', 'sparkle');
        } catch (err: any) {
          appNotice(err.message || 'Không thể lưu ảnh đại diện.', 'error');
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadProfile();
    loadSessions();
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminUsers();
    }
  }, [user?.role, adminRoleFilter]);

  const loadProfile = async () => {
    try {
      const data = await api.get<any>('/users/me');
      setDisplayName(data.displayName || data.display_name || '');
      setAvatarUrl(data.avatarUrl || data.avatar_url || '');
      setCompletedLessonsCount(data.completedLessonsCount || data.completed_lessons_count || 0);

      const activeRm = data.activeRoadmap || data.active_roadmap;
      const userProf = data.profile;

      const savedLevel =
        activeRm?.startingLevel ||
        activeRm?.starting_level ||
        data.starting_level ||
        data.startingLevel ||
        data.current_level ||
        userProf?.current_level;
      if (savedLevel) setStartingLevel(normalizeLevel(savedLevel));

      const savedGoal =
        activeRm?.targetGoal ||
        activeRm?.target_goal ||
        data.target_goal ||
        data.targetGoal ||
        data.goal ||
        userProf?.goal;
      if (savedGoal) setTargetGoal(normalizeGoal(savedGoal));

      const savedCommitment =
        activeRm?.dailyCommitmentMins ||
        activeRm?.daily_commitment_mins ||
        data.daily_commitment_mins ||
        data.dailyCommitmentMins ||
        data.daily_study_minutes ||
        userProf?.daily_study_minutes;
      if (savedCommitment) setDailyCommitment(normalizeDailyMins(savedCommitment));

      const savedReminder =
        data.reminder_time ||
        data.reminderTime ||
        data.daily_reminder_time ||
        data.notificationSettings?.reminderTime ||
        data.notificationSettings?.reminder_time ||
        activeRm?.reminder_time;
      if (savedReminder) setReminderTime(normalizeReminderTime(savedReminder));

      if (data.notificationSettings) {
        setNotifyEmail(data.notificationSettings.notifyEmail ?? data.notificationSettings.notify_email ?? true);
        setNotifyWebpush(data.notificationSettings.notifyWebpush ?? data.notificationSettings.notify_webpush ?? false);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await api.get<any[]>('/auth/sessions');
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadAdminUsers = async (searchOverride?: string) => {
    try {
      const data = await api.get<any>('/users/admin/all', {
        params: {
          search: (searchOverride !== undefined ? searchOverride : adminSearch) || undefined,
          role: adminRoleFilter || undefined,
          limit: 20,
        },
      });
      setAdminUsers(data?.users || []);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    }
  };

  const handleAdminUpdateUser = async (
    targetUserId: number,
    updates: { role?: string; status?: string }
  ) => {
    try {
      await api.put(`/users/admin/${targetUserId}`, updates);
      loadAdminUsers();
      appNotice('Đã cập nhật quyền và trạng thái tài khoản.', 'success');
    } catch (err: any) {
      appNotice(err.message || 'Lỗi khi cập nhật quyền người dùng.', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: any = { display_name: displayName };
      if (avatarUrl.trim()) {
        payload.avatar_url = avatarUrl.trim();
      }
      const updatedRes = await api.put<any>('/users/me', payload);
      const savedAvatar =
        updatedRes?.profile?.avatarUrl !== undefined
          ? updatedRes.profile.avatarUrl
          : avatarUrl.trim() || null;
      updateUser({
        displayName,
        avatarUrl: savedAvatar,
      });

      if (!isAdminRole) {
        await api.put('/users/notifications', {
          reminder_time: reminderTime,
          notify_email: notifyEmail,
          notify_webpush: notifyWebpush,
        });

        await api.post<any>('/users/onboarding', {
          starting_level: startingLevel,
          target_goal: targetGoal,
          daily_commitment_mins: dailyCommitment,
          reminder_time: reminderTime,
        });

        await loadProfile();
      }

      celebrateSuccess('Đã lưu cài đặt tài khoản', 'sparkle');
    } catch (err: any) {
      appNotice(err.message || 'Lỗi cập nhật hồ sơ.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    const ok = await appConfirm({
      title: 'Thu hồi phiên đăng nhập?',
      message: 'Thiết bị này sẽ bị đăng xuất khỏi tài khoản Hanzi4U của bạn.',
      confirmLabel: 'Thu hồi',
      cancelLabel: 'Quay lại',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      appNotice('Đã đăng xuất thiết bị thành công.', 'success');
    } catch (err: any) {
      appNotice(err.message || 'Lỗi khi thu hồi phiên.', 'error');
    }
  };

  const handleRevokeOtherSessions = async () => {
    const ok = await appConfirm({
      title: 'Đăng xuất các thiết bị khác?',
      message: 'Tất cả thiết bị khác sẽ bị đăng xuất, chỉ giữ lại thiết bị hiện tại.',
      confirmLabel: 'Đăng xuất tất cả',
      cancelLabel: 'Quay lại',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.post('/auth/sessions/revoke-others');
      loadSessions();
      appNotice('Đã đăng xuất toàn bộ thiết bị khác.', 'success');
    } catch (err: any) {
      appNotice(err.message || 'Lỗi khi thu hồi phiên.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-7">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900">
            Hồ sơ cá nhân
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isAdminRole
              ? 'Cập nhật thông tin tài khoản và quản lý thiết bị đăng nhập.'
              : 'Quản lý thông tin tài khoản, lộ trình HSK và lịch nhắc học mỗi ngày.'}
          </p>
        </div>
        <span className="px-3.5 py-1.5 glass-light text-primary-700 dark:text-rose-300 rounded-full text-xs font-bold">
          {ROLE_LABEL[user?.role || 'STUDENT'] || user?.role}
        </span>
      </div>

      {/* Theme Appearance Card (Light / Dark) */}
      <GlassCard className="p-6 sm:p-8 space-y-4 rounded-[28px]">
        <div className="flex items-center justify-between border-b border-white/75 pb-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900">Giao diện hiển thị</h2>
              <p className="text-xs text-gray-500">Áp dụng chế độ Sáng hoặc Tối cho toàn bộ hệ thống</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/25 shadow-sm'
                : 'bg-white/50 border-white/80 hover:bg-white/80'
            }`}
          >
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">Giao diện sáng</p>
              <p className="text-xs text-gray-500">Tươi sáng, rõ nét ban ngày</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/90 border-rose-400 ring-2 ring-rose-400/25 shadow-sm'
                : 'bg-white/50 border-white/80 hover:bg-white/80'
            }`}
          >
            <span className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">Giao diện tối</p>
              <p className="text-xs text-gray-500">Dịu mắt khi học ban đêm</p>
            </div>
          </button>
        </div>
      </GlassCard>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Basic Profile & Single-Button Avatar */}
        <GlassCard className="p-6 sm:p-8 space-y-6 rounded-[28px]">
          <div className="flex items-center justify-between border-b border-white/75 pb-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-300" />
              <h2 className="text-lg font-display font-bold text-gray-900">Thông tin tài khoản</h2>
            </div>
            {!isAdminRole && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/12 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/70 px-3 py-1 rounded-full">
                Đã hoàn thành: {completedLessonsCount} bài học
              </span>
            )}
          </div>

          {/* Clean Avatar Row — ONLY ONE button: "Thay đổi ảnh" */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/45 border border-white/80">
            <UserAvatar
              avatarUrl={avatarUrl || null}
              displayName={displayName || user?.displayName}
              size="xl"
            />
            <div className="flex-1 text-center sm:text-left space-y-2.5">
              <h3 className="text-sm font-display font-bold text-gray-900">Ảnh đại diện</h3>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <ShimmerButton
                  type="button"
                  size="sm"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploadingAvatar ? 'Đang cập nhật...' : 'Thay đổi ảnh'}</span>
                </ShimmerButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Tên hiển thị
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/65 border border-white/85 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-3 rounded-xl border border-white/70 bg-white/35 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </GlassCard>

        {/* Section 2: Student Study Goal (Complete Liquid Glass) */}
        {!isAdminRole && (
          <GlassCard className="p-6 sm:p-8 space-y-6 rounded-[28px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/75 pb-4">
              <div className="flex items-center gap-3">
                <Compass className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                <div>
                  <h2 className="text-lg font-display font-bold text-gray-900">Lộ trình học HSK</h2>
                  <p className="text-xs text-gray-500">
                    Điều chỉnh trình độ, mục tiêu HSK và thời gian học mỗi ngày
                  </p>
                </div>
              </div>
              <a
                href="#/onboarding"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/65 hover:bg-white border border-white/85 text-primary-700 dark:text-rose-300 font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xem lộ trình chi tiết</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Trình độ hiện tại
                </label>
                <select
                  value={startingLevel}
                  onChange={(e) => setStartingLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/65 border border-white/85 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm transition-colors"
                >
                  <option value="ZERO">Mới bắt đầu</option>
                  <option value="PINYIN_KNOWN">Đã biết Pinyin cơ bản</option>
                  <option value="HSK1">Đang ở trình độ HSK 1</option>
                  <option value="HSK2">Đang ở trình độ HSK 2</option>
                  <option value="HSK3">Đang ở trình độ HSK 3</option>
                  <option value="HSK4">Đang ở trình độ HSK 4</option>
                  <option value="HSK5">Đang ở trình độ HSK 5</option>
                  <option value="HSK6">Đang ở trình độ HSK 6</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Mục tiêu chính
                </label>
                <select
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/65 border border-white/85 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm transition-colors"
                >
                  <option value="HSK1">Đạt chứng chỉ HSK 1</option>
                  <option value="HSK2">Đạt chứng chỉ HSK 2</option>
                  <option value="HSK3">Đạt chứng chỉ HSK 3</option>
                  <option value="HSK4">Đạt chứng chỉ HSK 4</option>
                  <option value="HSK5">Đạt chứng chỉ HSK 5</option>
                  <option value="HSK6">Đạt chứng chỉ HSK 6</option>
                  <option value="COMMUNICATION">Giao tiếp đời sống</option>
                  <option value="HOBBY">Học theo sở thích</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Thời gian mỗi ngày
                </label>
                <select
                  value={dailyCommitment}
                  onChange={(e) => setDailyCommitment(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 rounded-xl bg-white/65 border border-white/85 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm transition-colors"
                >
                  <option value={15}>15 phút / ngày</option>
                  <option value={30}>30 phút / ngày</option>
                  <option value={45}>45 phút / ngày</option>
                  <option value={60}>60 phút / ngày</option>
                  <option value={90}>90 phút / ngày</option>
                  <option value={120}>120 phút / ngày</option>
                </select>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Section 3: Notification Reminder Settings (Complete Liquid Glass) */}
        {!isAdminRole && (
          <GlassCard className="p-6 sm:p-8 space-y-5 rounded-[28px]">
            <div className="flex items-center gap-3 border-b border-white/75 pb-4">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900">
                  Nhắc lịch học hằng ngày
                </h2>
                <p className="text-xs text-gray-500">
                  Duy trì thói quen học tiếng Trung đều đặn mỗi ngày
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/50 border border-white/80">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary-600 dark:text-primary-300 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-gray-900">Giờ nhắc học</span>
                    <p className="text-xs text-gray-500">Gửi lời nhắc ôn bài vào khung giờ này</p>
                  </div>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-white/85 bg-white/75 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white/80">
                <div>
                  <span className="text-sm font-bold text-gray-900">Nhắc học qua Email</span>
                  <p className="text-xs text-gray-500">Gửi email nhắc danh sách từ vựng cần ôn</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white/80">
                <div>
                  <span className="text-sm font-bold text-gray-900">Thông báo trên trình duyệt</span>
                  <p className="text-xs text-gray-500">Nhận thông báo nhắc giờ học trên thiết bị</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWebpush}
                  onChange={(e) => setNotifyWebpush(e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                />
              </div>
            </div>
          </GlassCard>
        )}

        <ShimmerButton type="submit" disabled={isSaving} size="lg">
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
        </ShimmerButton>
      </form>

      {/* Section 4: Device Sessions Management (Complete Liquid Glass) */}
      <GlassCard className="p-6 sm:p-8 space-y-5 rounded-[28px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/75 pb-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-gray-700" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-display font-bold text-gray-900">
                  Thiết bị đang đăng nhập
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/75 border border-white text-[11px] font-bold text-slate-600">
                  {sessions.length}/3 thiết bị
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Phiên tự động gia hạn 30 ngày khi học lại. Tối đa 3 thiết bị cùng lúc — thiết bị cũ nhất sẽ tự đăng xuất khi vượt quá.
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              className="text-xs text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 font-bold underline cursor-pointer"
            >
              Đăng xuất tất cả thiết bị khác
            </button>
          )}
        </div>

        <div className="divide-y divide-white/65">
          {sessions.map((sess) => {
            const isMobile = sess.user_agent?.toLowerCase().includes('mobile');
            return (
              <div key={sess.session_id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/65 border border-white/85 flex items-center justify-center text-gray-600 shrink-0">
                    {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {sess.user_agent?.slice(0, 42) || 'Thiết bị trình duyệt'}
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-800 border border-emerald-200/70 px-2.5 py-0.5 rounded-full font-bold">
                          Thiết bị hiện tại
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      IP: {sess.ip_address || '127.0.0.1'} • Đăng nhập:{' '}
                      {new Date(sess.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {sess.isCurrent ? (
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 hover:text-rose-600 bg-white/65 hover:bg-rose-50/90 rounded-xl border border-white/85 transition-colors cursor-pointer shrink-0"
                    title="Đăng xuất phiên hiện tại"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(sess.session_id)}
                    className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50/90 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Thu hồi phiên"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Section 5: Account Role Management (Visible for ADMIN) */}
      {user?.role === 'ADMIN' && (
        <GlassCard className="p-6 sm:p-8 space-y-5 rounded-[28px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/75 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-300" />
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900">
                  Quản lý quyền tài khoản
                </h2>
                <p className="text-xs text-gray-500">
                  Cấp quyền học viên, biên tập nội dung, quản trị viên và quản lý trạng thái tài khoản
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm email hoặc tên..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAdminUsers()}
                  className="pl-9 pr-3 py-2 rounded-xl bg-white/65 border border-white/85 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <select
                value={adminRoleFilter}
                onChange={(e) => setAdminRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/65 border border-white/85 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">Tất cả vai trò</option>
                <option value="STUDENT">Học viên</option>
                <option value="CONTENT_EDITOR">Biên tập nội dung</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-white/65">
            {adminUsers.map((u) => (
              <div
                key={u.user_id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{u.display_name}</span>
                    <span className="text-xs text-gray-500">({u.email})</span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    ID #{u.user_id} • Trạng thái:{' '}
                    <strong className={u.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'LOCKED' ? 'Tạm khóa' : 'Đã khóa'}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    disabled={u.user_id === user.userId}
                    onChange={(e) => handleAdminUpdateUser(u.user_id, { role: e.target.value })}
                    className="px-3 py-1.5 rounded-xl bg-white/65 border border-white/85 text-xs font-semibold disabled:opacity-70"
                  >
                    <option value="STUDENT">Học viên</option>
                    <option value="CONTENT_EDITOR">Biên tập nội dung</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>

                  <select
                    value={u.status}
                    disabled={u.user_id === user.userId}
                    onChange={(e) => handleAdminUpdateUser(u.user_id, { status: e.target.value })}
                    className="px-3 py-1.5 rounded-xl bg-white/65 border border-white/85 text-xs font-semibold disabled:opacity-70"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="LOCKED">Tạm khóa</option>
                    <option value="BANNED">Khóa vĩnh viễn</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
