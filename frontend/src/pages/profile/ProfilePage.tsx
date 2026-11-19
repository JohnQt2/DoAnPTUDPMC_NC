import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  User,
  Bell,
  Compass,
  Monitor,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  Smartphone,
  Laptop,
  Shield,
  Search,
  LogOut,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWebpush, setNotifyWebpush] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<any>(null);

  // Onboarding goals
  const [startingLevel, setStartingLevel] = useState('ZERO');
  const [targetGoal, setTargetGoal] = useState('HSK1');
  const [dailyCommitment, setDailyCommitment] = useState(15);

  // Admin RBAC user management state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        setActiveRoadmap(data.activeRoadmap);
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

  const handleAdminUpdateUser = async (targetUserId: number, updates: { role?: string; status?: string }) => {
    try {
      await api.put(`/users/admin/${targetUserId}`, updates);
      loadAdminUsers();
      setSuccessMsg('Đã cập nhật phân quyền / trạng thái người dùng (RBAC) thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật quyền người dùng');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      // 1. Update Profile name & avatar
      const payload: any = { display_name: displayName };
      if (avatarUrl.trim()) {
        payload.avatar_url = avatarUrl.trim();
      }
      const updatedRes = await api.put<any>('/users/me', payload);
      updateUser({
        displayName,
        avatarUrl: updatedRes?.profile?.avatarUrl ?? (avatarUrl.trim() || undefined),
      });

      // 2. Update Notifications
      await api.put('/users/notifications', {
        reminder_time: reminderTime,
        notify_email: notifyEmail,
        notify_webpush: notifyWebpush,
      });

      // 3. Save Onboarding / Roadmap Goal
      const res = await api.post<any>('/users/onboarding', {
        starting_level: startingLevel,
        target_goal: targetGoal,
        daily_commitment_mins: dailyCommitment,
        reminder_time: reminderTime,
      });
      setActiveRoadmap(res.roadmap);

      setSuccessMsg('Đã cập nhật hồ sơ, lộ trình học và cài đặt thông báo thành công!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi phiên đăng nhập trên thiết bị này?')) return;
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thu hồi phiên');
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!confirm('Đăng xuất tất cả các thiết bị khác ngoại trừ thiết bị đang dùng?')) return;
    try {
      await api.post('/auth/sessions/revoke-others');
      loadSessions();
    } catch (err: any) {
      alert(err.message || 'Lỗi thu hồi');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Hồ Sơ Cá Nhân & Thiết Lập Học Tập
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý thông tin định danh, thiết lập lộ trình và thông báo nhắc học
          </p>
        </div>
        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wider">
          {user?.role || 'STUDENT'}
        </span>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Basic Profile */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold text-gray-900">Thông Tin Tài Khoản</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Đã hoàn thành: {completedLessonsCount} bài học
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Tên hiển thị
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Địa chỉ Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Ảnh đại diện (Avatar URL)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Onboarding & Study Goal */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-secondary-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Lộ Trình Cá Nhân</h2>
                <p className="text-xs text-gray-400">Khảo sát mục tiêu và gán khóa học phù hợp từ HSK 1 đến HSK 6</p>
              </div>
            </div>
            <a
              href="#/onboarding"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Xem lộ trình chi tiết</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Starting Level */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Trình độ hiện tại
              </label>
              <select
                value={startingLevel}
                onChange={(e) => setStartingLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="ZERO">Mới bắt đầu (Chưa biết gì)</option>
                <option value="PINYIN_KNOWN">Đã biết Pinyin cơ bản</option>
                <option value="HSK1">Đang ở trình độ HSK 1</option>
                <option value="HSK2">Đang ở trình độ HSK 2</option>
                <option value="HSK3">Đang ở trình độ HSK 3</option>
                <option value="HSK4">Đang ở trình độ HSK 4</option>
                <option value="HSK5">Đang ở trình độ HSK 5</option>
                <option value="HSK6">Đang ở trình độ HSK 6</option>
              </select>
            </div>

            {/* Target Goal */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Mục tiêu chính
              </label>
              <select
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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

            {/* Daily Commitment */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Cam kết mỗi ngày
              </label>
              <select
                value={dailyCommitment}
                onChange={(e) => setDailyCommitment(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value={15}>15 phút / ngày (0.25 giờ)</option>
                <option value={30}>30 phút / ngày (0.5 giờ)</option>
                <option value={45}>45 phút / ngày (0.75 giờ)</option>
                <option value={60}>60 phút / ngày (1 giờ)</option>
                <option value={90}>90 phút / ngày (1.5 giờ)</option>
                <option value={120}>120 phút / ngày (2 giờ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Reminder Settings */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Bell className="w-5 h-5 text-accent-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Cài Đặt Thông Báo Nhắc Học</h2>
              <p className="text-xs text-gray-400">Giữ chuỗi học tập (Streak) và nhận lời nhắc đều đặn</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-600" />
                <div>
                  <span className="text-sm font-bold text-gray-900">Khung giờ nhắc học hằng ngày</span>
                  <p className="text-xs text-gray-500">Hệ thống sẽ gửi thông báo vào giờ này</p>
                </div>
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white text-gray-900"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <span className="text-sm font-bold text-gray-900">Nhắc nhở qua Email</span>
                <p className="text-xs text-gray-500">Gửi email tóm tắt từ vựng đến hạn ôn tập</p>
              </div>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <span className="text-sm font-bold text-gray-900">Thông báo trình duyệt (Web Push)</span>
                <p className="text-xs text-gray-500">Hiện popup nhắc nhở học bài trên máy tính/điện thoại</p>
              </div>
              <input
                type="checkbox"
                checked={notifyWebpush}
                onChange={(e) => setNotifyWebpush(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md shadow-primary-600/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Đang lưu thay đổi...' : 'Lưu Tất Cả Cài Đặt'}
        </button>
      </form>

      {/* Section 4: Device Sessions Management */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quản Lý Phiên Đăng Nhập Theo Thiết Bị</h2>
              <p className="text-xs text-gray-400">Kiểm tra và thu hồi quyền truy cập từ các thiết bị khác</p>
            </div>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOtherSessions}
              className="text-xs text-red-600 hover:text-red-700 font-semibold underline"
            >
              Thu hồi tất cả thiết bị khác
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {sessions.map((sess) => {
            const isMobile = sess.user_agent?.toLowerCase().includes('mobile');
            return (
              <div key={sess.session_id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                    {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {sess.user_agent?.slice(0, 40) || 'Thiết bị không xác định'}...
                      </span>
                      {sess.isCurrent && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Thiết bị hiện tại
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      IP: {sess.ip_address || '127.0.0.1'} • Đăng nhập:{' '}
                      {new Date(sess.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {sess.isCurrent ? (
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition-colors"
                    title="Đăng xuất phiên hiện tại"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                  </button>
                ) : (
                  <button
                    onClick={() => handleRevokeSession(sess.session_id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Thu hồi phiên"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 5: RBAC User Management (Visible for ADMIN role) */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Quản Trị Phân Quyền Người Dùng (RBAC - Admin)
                </h2>
                <p className="text-xs text-gray-400">
                  Phân quyền vai trò (STUDENT, CONTENT_EDITOR, ADMIN) và khóa/mở khóa tài khoản
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
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={adminRoleFilter}
                onChange={(e) => setAdminRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Tất cả vai trò</option>
                <option value="STUDENT">STUDENT</option>
                <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {adminUsers.map((u) => (
              <div key={u.user_id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{u.display_name}</span>
                    <span className="text-xs text-gray-400">({u.email})</span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    ID #{u.user_id} • Trạng thái:{' '}
                    <strong className={u.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'}>
                      {u.status}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    disabled={u.user_id === user.userId}
                    onChange={(e) => handleAdminUpdateUser(u.user_id, { role: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 disabled:opacity-50"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="CONTENT_EDITOR">CONTENT_EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <select
                    value={u.status}
                    disabled={u.user_id === user.userId}
                    onChange={(e) => handleAdminUpdateUser(u.user_id, { status: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-50 disabled:opacity-50"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                    <option value="BANNED">BANNED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
