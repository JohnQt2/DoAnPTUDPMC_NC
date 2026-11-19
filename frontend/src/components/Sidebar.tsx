import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Route,
  BookOpen,
  Mic,
  MessagesSquare,
  FileText,
  Trophy,
  TrendingUp,
  LogOut,
  FileQuestion,
  Users,
  Menu,
  X,
} from 'lucide-react';

export const STUDENT_SIDEBAR_ITEMS = [
  { label: 'Hôm nay', hash: '#/today', icon: Home },
  { label: 'Lộ trình', hash: '#/courses', icon: Route },
  { label: 'Từ vựng', hash: '#/vocab', icon: BookOpen },
  { label: 'Học nói', hash: '#/speak-learn', icon: Mic },
  { label: 'Luyện nói', hash: '#/speak-practice', icon: MessagesSquare },
  { label: 'Đề thi', hash: '#/exams', icon: FileText },
  { label: 'Xếp hạng', hash: '#/leaderboard', icon: Trophy },
  { label: 'Tiến độ', hash: '#/progress', icon: TrendingUp },
];

export const Sidebar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CONTENT_EDITOR';
  const isSuperAdmin = user?.role === 'ADMIN';
  const basePath = currentPath.split('?')[0] || (isAdmin ? '#/admin/courses' : '#/today');

  const adminItems = [
    { label: 'Quản lý khóa học', hash: '#/admin/courses', icon: BookOpen },
    { label: 'Ngân hàng câu hỏi', hash: '#/admin/questions', icon: FileQuestion },
    ...(isSuperAdmin ? [{ label: 'Người dùng & Phân quyền', hash: '#/admin/users', icon: Users }] : []),
  ];

  const menuItems = isAdmin ? adminItems : STUDENT_SIDEBAR_ITEMS;

  const isItemActive = (hash: string) => {
    if (isAdmin) {
      if (hash === '#/admin/courses') {
        return (
          basePath === '#/admin/courses' ||
          basePath === '#/admin' ||
          !basePath.startsWith('#/admin/')
        );
      }
      return basePath.startsWith(hash);
    }

    if (hash === '#/today') {
      return basePath === '#/today' || basePath === '#/' || basePath === '';
    }
    if (hash === '#/courses') {
      return (
        basePath.startsWith('#/courses') ||
        basePath.startsWith('#/lessons') ||
        basePath.startsWith('#/roadmap') ||
        basePath.startsWith('#/onboarding')
      );
    }
    if (hash === '#/vocab') {
      return (
        basePath.startsWith('#/vocab') ||
        basePath.startsWith('#/srs') ||
        basePath.startsWith('#/characters')
      );
    }
    if (hash === '#/speak-learn') {
      return basePath.startsWith('#/speak-learn') || basePath === '#/pinyin';
    }
    if (hash === '#/exams') {
      return basePath.startsWith('#/exams') || basePath.startsWith('#/test');
    }
    return basePath.startsWith(hash);
  };

  const renderNavContent = (onSelect?: () => void) => (
    <div className="flex flex-col h-full">
      {/* Brand Logo */}
      <div className="px-5 py-6">
        <a
          href={isAdmin ? '#/admin/courses' : '#/today'}
          onClick={onSelect}
          className="flex items-center gap-3 group"
        >
          <span
            aria-hidden="true"
            className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center font-chinese font-black text-xl shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform"
          >
            汉
          </span>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 leading-none">
              Hanzi<span className="text-primary-500">4u</span>
            </span>
            {isAdmin && (
              <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider mt-1">
                Trang quản trị
              </span>
            )}
          </div>
        </a>
      </div>

      {/* Menu Items: Admin-only OR Student-only */}
      <nav
        className="flex-1 px-3 space-y-1 overflow-y-auto"
        aria-label={isAdmin ? 'Menu quản trị' : 'Menu học tập'}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.hash);
          return (
            <a
              key={item.hash}
              href={item.hash}
              onClick={onSelect}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] transition-all ${
                active
                  ? 'bg-primary-50 text-primary-600 font-bold'
                  : 'text-gray-700 font-semibold hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`w-5 h-5 shrink-0 ${active ? 'text-primary-600' : 'text-gray-500'}`}
                strokeWidth={active ? 2.25 : 1.9}
              />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Bottom User Profile & Logout */}
      {user && (
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2 px-2 py-2 rounded-2xl hover:bg-gray-50 transition-colors">
            {isAdmin ? (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {user.displayName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-[11px] text-primary-600 font-semibold truncate">
                    {isSuperAdmin ? 'Quản trị viên' : 'Biên tập nội dung'}
                  </p>
                </div>
              </div>
            ) : (
              <a
                href="#/profile"
                onClick={onSelect}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {user.displayName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-[11px] text-gray-500 truncate">Tài khoản cá nhân</p>
                </div>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                onSelect?.();
                logout();
              }}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200/80 z-40">
        {renderNavContent()}
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <a href={isAdmin ? '#/admin/courses' : '#/today'} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center font-chinese font-black text-base">
            汉
          </span>
          <span className="font-extrabold text-lg tracking-tight text-gray-900">
            Hanzi<span className="text-primary-500">4u</span>
          </span>
          {isAdmin && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 uppercase">
              Admin
            </span>
          )}
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu"
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] bg-white h-full shadow-2xl flex flex-col z-10">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Đóng menu"
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {renderNavContent(() => setMobileOpen(false))}
          </div>
        </div>
      )}
    </>
  );
};
