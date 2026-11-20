import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './ui';
import { HanziLogo } from './HanziLogo';
import {
  Home,
  Route,
  BookOpen,
  Languages,
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
  { label: 'Bảng chữ cái', hash: '#/speak-learn', icon: Languages },
  { label: 'Luyện nói', hash: '#/speak-practice', icon: MessagesSquare },
  { label: 'Đề thi', hash: '#/exams', icon: FileText },
  { label: 'Xếp hạng', hash: '#/leaderboard', icon: Trophy },
  { label: 'Tiến độ', hash: '#/progress', icon: TrendingUp },
];

interface NavContentProps {
  menuItems: Array<{ label: string; hash: string; icon: React.ComponentType<any> }>;
  activeHash: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: any;
  logout: () => void;
  onSelect?: () => void;
}

const SidebarNavContent: React.FC<NavContentProps> = ({
  menuItems,
  activeHash,
  isAdmin,
  isSuperAdmin,
  user,
  logout,
  onSelect,
}) => {
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [activeRect, setActiveRect] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = itemRefs.current[activeHash];
    if (!el) {
      setActiveRect(null);
      return;
    }
    setActiveRect({ top: el.offsetTop, height: el.offsetHeight });
  }, [activeHash, menuItems.length]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="px-5 h-16 flex items-center border-b border-[#EAE3DE]">
        <a href={isAdmin ? '#/admin/courses' : '#/today'} onClick={onSelect}>
          <HanziLogo
            variant="light"
            size="sm"
            subtitle={isAdmin ? (isSuperAdmin ? 'QUẢN TRỊ VIÊN' : 'BIÊN TẬP VIÊN') : 'HỌC VIỆN HÁN NGỮ'}
          />
        </a>
      </div>

      {/* Zero-Lag GPU Active Pill Navigation */}
      <nav
        className="relative flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto no-scrollbar"
        aria-label={isAdmin ? 'Menu quản trị' : 'Menu học tập'}
      >
        {activeRect && (
          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${activeRect.top}px, 0)`,
              height: activeRect.height,
            }}
            className="pointer-events-none absolute left-3 right-3 top-0 rounded-xl bg-[#C41E3A] shadow-[0_6px_16px_-6px_rgba(196,30,58,0.5)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          />
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = item.hash === activeHash;
          return (
            <a
              key={item.hash}
              ref={(el) => {
                itemRefs.current[item.hash] = el;
              }}
              href={item.hash}
              onClick={onSelect}
              className={`relative z-10 flex items-center justify-between gap-3 px-3.5 h-10 rounded-xl text-[13.5px] transition-colors duration-150 ${
                active
                  ? 'text-white font-semibold'
                  : 'text-[#5F5658] font-medium hover:text-[#181415] hover:bg-[#FAF8F6]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-[#F2D16B]' : 'text-[#8C7F82]'
                  }`}
                  strokeWidth={active ? 2.2 : 1.85}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#F2D16B] shrink-0" />}
            </a>
          );
        })}
      </nav>

      {/* Profile Footer */}
      {user && (
        <div className="p-3 border-t border-[#EAE3DE]">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-[#FAF8F6] transition-colors">
            <a
              href="#/profile"
              onClick={onSelect}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size="sm" />
              <div className="min-w-0 leading-tight">
                <p className="text-[13px] font-semibold text-[#181415] truncate">
                  {user.displayName}
                </p>
                <p className="text-[11px] text-[#5F5658] truncate">
                  {isAdmin
                    ? isSuperAdmin
                      ? 'Quản trị viên'
                      : 'Biên tập nội dung'
                    : 'Hồ sơ cá nhân'}
                </p>
              </div>
            </a>

            <button
              type="button"
              onClick={() => {
                onSelect?.();
                logout();
              }}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="p-1.5 text-[#5F5658] hover:text-[#C41E3A] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CONTENT_EDITOR';
  const isSuperAdmin = user?.role === 'ADMIN';
  const basePath = currentPath.split('?')[0] || (isAdmin ? '#/admin/courses' : '#/today');

  const menuItems = useMemo(() => {
    if (!isAdmin) return STUDENT_SIDEBAR_ITEMS;
    return [
      { label: 'Quản lý khóa học', hash: '#/admin/courses', icon: BookOpen },
      { label: 'Ngân hàng câu hỏi', hash: '#/admin/questions', icon: FileQuestion },
      ...(isSuperAdmin
        ? [{ label: 'Người dùng & Phân quyền', hash: '#/admin/users', icon: Users }]
        : []),
    ];
  }, [isAdmin, isSuperAdmin]);

  const activeHash = useMemo(() => {
    if (isAdmin) {
      if (basePath.startsWith('#/admin/questions')) return '#/admin/questions';
      if (basePath.startsWith('#/admin/users') && isSuperAdmin) return '#/admin/users';
      return '#/admin/courses';
    }
    if (basePath === '#/today' || basePath === '#/' || basePath === '') return '#/today';
    if (
      basePath.startsWith('#/courses') ||
      basePath.startsWith('#/lessons') ||
      basePath.startsWith('#/roadmap') ||
      basePath.startsWith('#/onboarding')
    ) {
      return '#/courses';
    }
    if (
      basePath.startsWith('#/vocab') ||
      basePath.startsWith('#/srs') ||
      basePath.startsWith('#/characters')
    ) {
      return '#/vocab';
    }
    if (basePath.startsWith('#/speak-learn') || basePath === '#/pinyin') return '#/speak-learn';
    if (basePath.startsWith('#/speak-practice')) return '#/speak-practice';
    if (basePath.startsWith('#/exams') || basePath.startsWith('#/test')) return '#/exams';
    if (basePath.startsWith('#/leaderboard')) return '#/leaderboard';
    if (basePath.startsWith('#/progress')) return '#/progress';
    return '';
  }, [basePath, isAdmin, isSuperAdmin]);

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 liquid-sidebar z-40">
        <SidebarNavContent
          menuItems={menuItems}
          activeHash={activeHash}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          user={user}
          logout={logout}
        />
      </aside>

      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE3DE] px-4 h-14 flex items-center justify-between">
        <a href={isAdmin ? '#/admin/courses' : '#/today'}>
          <HanziLogo variant="light" size="sm" showSubtitle={false} />
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu"
          className="p-2 rounded-lg text-[#181415] hover:bg-[#FAF8F6] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 bg-[#141112]/45 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-64 max-w-[82vw] bg-white h-full shadow-2xl border-r border-[#EAE3DE] flex flex-col z-10"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="absolute top-3.5 right-3 p-1.5 rounded-lg text-[#5F5658] hover:bg-[#FAF8F6] cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarNavContent
                menuItems={menuItems}
                activeHash={activeHash}
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
                user={user}
                logout={logout}
                onSelect={() => setMobileOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
