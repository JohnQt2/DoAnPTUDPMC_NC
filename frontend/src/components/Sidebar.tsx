import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './ui';
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
    if (el) {
      setActiveRect({ top: el.offsetTop, height: el.offsetHeight });
    }
  }, [activeHash, menuItems.length]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="px-5 h-15 flex items-center border-b border-zinc-100">
        <a
          href={isAdmin ? '#/admin/courses' : '#/today'}
          onClick={onSelect}
          className="flex items-center gap-2.5 group"
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-hanzi-serif font-bold text-base"
          >
            汉
          </span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-[17px] tracking-tight text-zinc-950 leading-none">
              Hanzi<span className="text-[#BE123C]">4U</span>
            </span>
            {isAdmin && (
              <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">
                {isSuperAdmin ? 'Quản trị' : 'Biên tập'}
              </span>
            )}
          </div>
        </a>
      </div>

      {/* Navigation Links */}
      <nav
        className="relative flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto no-scrollbar"
        aria-label={isAdmin ? 'Menu quản trị' : 'Menu học tập'}
      >
        {activeRect && (
          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${activeRect.top}px, 0)`,
              height: activeRect.height,
            }}
            className="pointer-events-none absolute left-3 right-3 top-0 rounded-lg bg-zinc-100 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
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
              className={`relative z-10 flex items-center justify-between gap-3 px-3 h-9 rounded-lg text-[13.5px] transition-colors duration-150 ${
                active
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-600 font-medium hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-[#BE123C]' : 'text-zinc-400'
                  }`}
                  strokeWidth={active ? 2.15 : 1.75}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C] shrink-0" />}
            </a>
          );
        })}
      </nav>

      {/* Profile Footer */}
      {user && (
        <div className="p-3 border-t border-zinc-100">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors">
            <a
              href="#/profile"
              onClick={onSelect}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size="sm" />
              <div className="min-w-0 leading-tight">
                <p className="text-[13px] font-semibold text-zinc-950 truncate">{user.displayName}</p>
                <p className="text-[11px] text-zinc-500 truncate">
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
              className="p-1.5 text-zinc-400 hover:text-[#BE123C] hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
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

      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 h-14 flex items-center justify-between">
        <a href={isAdmin ? '#/admin/courses' : '#/today'} className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center font-hanzi-serif font-bold text-sm">
            汉
          </span>
          <span className="font-display font-bold text-base tracking-tight text-zinc-950">
            Hanzi<span className="text-[#BE123C]">4U</span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu"
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer"
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
              className="fixed inset-0 bg-zinc-950/30 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-64 max-w-[82vw] bg-white h-full shadow-xl border-r border-zinc-200 flex flex-col z-10"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="absolute top-3.5 right-3 p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer z-20"
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
