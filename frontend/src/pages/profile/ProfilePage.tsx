import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { celebrateSuccess } from '../../lib/celebration';
import { appConfirm, appNotice } from '../../lib/dialog';
import { GlassCard, UserAvatar, ShimmerButton } from '../../components/ui';
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
} from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Học viên',
  CONTENT_EDITOR: 'Biên tập nội dung',
  ADMIN: 'Quản trị viên',
};

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
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
      setDisplayName(data.displayName || '');
      setAvatarUrl(data.avatarUrl || '');
      setCompletedLessonsCount(data.completedLessonsCount || 0);
      if (data.notificationSettings) {
        setReminderTime(data.notificationSettings.reminderTime || '20:00');
        setNotifyEmail(data.notificationSettings.notifyEmail ?? true);
        setNotifyWebpush(data.notificationSettings.notifyWebpush ?? false);
      }
      if (data.activeRoadmap) {
        setStartingLevel(data.activeRoadmap.startingLevel);
        setTargetGoal(data.activeRoadmap.targetGoal);
        setDailyCommitment(data.activeRoadmap.dailyCommitmentMins);
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
    <div className="max-w-4xl mx-auto py-9 px-5 sm:px-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-5 border-b border-zinc-200">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-zinc-400">
            Cài đặt & Bảo mật
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 tracking-tight mt-1">
            Hồ sơ cá nhân
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            {isAdminRole
              ? 'Cập nhật thông tin tài khoản và quản lý thiết bị đăng nhập.'
              : 'Quản lý thông tin tài khoản, lộ trình HSK và lịch nhắc học mỗi ngày.'}
          </p>
        </div>
        <span className="px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold">
          {ROLE_LABEL[user?.role || 'STUDENT'] || user?.role}
        </span>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Basic Profile & Single-Button Avatar */}
        <GlassCard className="p-6 sm:p-7 space-y-6 rounded-2xl">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-[#BE123C]" />
              <h2 className="text-base font-display font-bold text-zinc-950">Thông tin tài khoản</h2>
            </div>
            {!isAdminRole && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Đã hoàn thành: {completedLessonsCount} bài học
              </span>
            )}
          </div>

          {/* Clean Avatar Row — ONLY ONE button: "Thay đổi ảnh" */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <UserAvatar
              avatarUrl={avatarUrl || null}
              displayName={displayName || user?.displayName}
              size="xl"
            />
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="text-sm font-display font-semibold text-zinc-950">Ảnh đại diện</h3>
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
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploadingAvatar ? 'Đang cập nhật...' : 'Thay đổi ảnh'}</span>
                </ShimmerButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Tên hiển thị
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm text-zinc-950 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </GlassCard>

        {/* Section 2: Student Study Goal */}
        {!isAdminRole && (
          <GlassCard className="p-6 sm:p-7 space-y-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#BE123C]" />
                <div>
                  <h2 className="text-base font-display font-bold text-zinc-950">Lộ trình học HSK</h2>
                  <p className="text-xs text-zinc-500">
                    Điều chỉnh trình độ, mục tiêu HSK và thời gian học mỗi ngày
                  </p>
                </div>
              </div>
              <a
                href="#/onboarding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#BE123C]" />
                <span>Xem lộ trình chi tiết</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Trình độ hiện tại
                </label>
                <select
                  value={startingLevel}
                  onChange={(e) => setStartingLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm text-zinc-950 transition-colors"
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
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Mục tiêu chính
                </label>
                <select
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm text-zinc-950 transition-colors"
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
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Thời gian mỗi ngày
                </label>
                <select
                  value={dailyCommitment}
                  onChange={(e) => setDailyCommitment(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 text-sm text-zinc-950 transition-colors"
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

        {/* Section 3: Notification Reminder Settings */}
        {!isAdminRole && (
          <GlassCard className="p-6 sm:p-7 space-y-5 rounded-2xl">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-4">
              <Bell className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-base font-display font-bold text-zinc-950">
                  Nhắc lịch học hằng ngày
                </h2>
                <p className="text-xs text-zinc-500">
                  Duy trì thói quen học tiếng Trung đều đặn mỗi ngày
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-zinc-600 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-zinc-950">Giờ nhắc học</span>
                    <p className="text-xs text-zinc-500">Gửi lời nhắc ôn bài vào khung giờ này</p>
                  </div>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-mono font-semibold text-zinc-950 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div>
                  <span className="text-sm font-semibold text-zinc-950">Nhắc học qua Email</span>
                  <p className="text-xs text-zinc-500">Gửi email nhắc danh sách từ vựng cần ôn</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 accent-zinc-900 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div>
                  <span className="text-sm font-semibold text-zinc-950">Thông báo trên trình duyệt</span>
                  <p className="text-xs text-zinc-500">Nhận thông báo nhắc giờ học trên thiết bị</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWebpush}
                  onChange={(e) => setNotifyWebpush(e.target.checked)}
                  className="w-4 h-4 accent-zinc-900 rounded cursor-pointer"
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

      {/* Section 4: Device Sessions Management */}
      <GlassCard className="p-6 sm:p-7 space-y-5 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Monitor className="w-4 h-4 text-zinc-700" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-display font-bold text-[#181415]">
                  Thiết bị đang đăng nhập
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[11px] font-mono font-semibold text-[#C41E3A]">
                  {sessions.length}/3 thiết bị
                </span>
              </div>
              <p className="text-xs text-[#5F5658] mt-0.5">
                Phiên tự động gia hạn 30 ngày khi học lại. Tối đa 3 thiết bị cùng lúc — thiết bị cũ nhất sẽ tự đăng xuất khi vượt quá.
              </p>
            </div>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              className="text-xs text-[#BE123C] hover:text-rose-800 font-semibold underline cursor-pointer"
            >
              Đăng xuất tất cả thiết bị khác
            </button>
          )}
        </div>

        <div className="divide-y divide-zinc-100">
          {sessions.map((sess) => {
            const isMobile = sess.user_agent?.toLowerCase().includes('mobile');
            return (
              <div key={sess.session_id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
                    {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-950 truncate">
                        {sess.user_agent?.slice(0, 42) || 'Thiết bị trình duyệt'}
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                          Thiết bị hiện tại
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      IP: {sess.ip_address || '127.0.0.1'} · Đăng nhập:{' '}
                      {new Date(sess.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {sess.isCurrent ? (
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-[#BE123C] bg-white hover:bg-rose-50 rounded-lg border border-zinc-200 transition-colors cursor-pointer shrink-0"
                    title="Đăng xuất phiên hiện tại"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(sess.session_id)}
                    className="p-2 text-zinc-500 hover:text-[#BE123C] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
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
        <GlassCard className="p-6 sm:p-7 space-y-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#BE123C]" />
              <div>
                <h2 className="text-base font-display font-bold text-zinc-950">
                  Quản lý quyền tài khoản
                </h2>
                <p className="text-xs text-zinc-500">
                  Cấp quyền học viên, biên tập nội dung, quản trị viên và quản lý trạng thái tài khoản
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm email hoặc tên..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAdminUsers()}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-zinc-900"
                />
              </div>
              <select
                value={adminRoleFilter}
                onChange={(e) => setAdminRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-medium focus:outline-none focus:border-zinc-900"
              >
                <option value="">Tất cả vai trò</option>
                <option value="STUDENT">Học viên</option>
                <option value="CONTENT_EDITOR">Biên tập nội dung</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {adminUsers.map((u) => (
              <div
                key={u.user_id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-950">{u.display_name}</span>
                    <span className="text-xs text-zinc-500">({u.email})</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    ID #{u.user_id} · Trạng thái:{' '}
                    <strong className={u.status === 'ACTIVE' ? 'text-emerald-700' : 'text-[#BE123C]'}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'LOCKED' ? 'Tạm khóa' : 'Đã khóa'}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    disabled={u.user_id === user.userId}
                    onChange={(e) => handleAdminUpdateUser(u.user_id, { role: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-medium disabled:opacity-50"
                  >
                    <option value="STUDENT">Học viên</option>
                    <option value="CONTENT_EDITOR">Biên tập nội dung</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>

                  <select
                    value={u.status}
                    disabled={u.user_id === user.userId}
                    onChange={(e) => handleAdminUpdateUser(u.user_id, { status: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-medium disabled:opacity-50"
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
