import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './ui';
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

interface NavContentProps {
  menuItems: Array<{ label: string; hash: string; icon: React.ComponentType<any> }>;
  activeHash: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: any;
  logout: () => void;
  onSelect?: () => void;
}

/**
 * Scroll-immune sidebar nav:
 * Uses local offsetTop / offsetHeight inside <nav> via GPU translate3d instead of viewport layoutId,
 * so window.scrollTo(0, 0) on route changes NEVER causes the active pill to jump up from the bottom!
 */
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
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);
  const [activeRect, setActiveRect] = useState<{ top: number; height: number } | null>(null);
  const [hoverRect, setHoverRect] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = itemRefs.current[activeHash];
    if (el) {
      setActiveRect({ top: el.offsetTop, height: el.offsetHeight });
    }
  }, [activeHash, menuItems.length]);

  useLayoutEffect(() => {
    if (!hoveredHash || hoveredHash === activeHash) {
      setHoverRect(null);
      return;
    }
    const el = itemRefs.current[hoveredHash];
    if (el) {
      setHoverRect({ top: el.offsetTop, height: el.offsetHeight });
    }
  }, [hoveredHash, activeHash]);

  return (
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
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-300 text-white flex items-center justify-center font-hanzi-serif font-black text-xl shadow-md shadow-rose-300/35"
          >
            汉
          </span>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-2xl tracking-tight text-slate-800 leading-none">
              Hanzi<span className="text-rose-500">4U</span>
            </span>
            {isAdmin && (
              <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mt-1">
                {isSuperAdmin ? 'Trang quản trị' : 'Biên tập nội dung'}
              </span>
            )}
          </div>
        </a>
      </div>

      {/* Menu Items with Scroll-Immune Local GPU Pill (flex gap never affects position:absolute!) */}
      <nav
        className="relative flex-1 px-3 flex flex-col gap-1 overflow-y-auto no-scrollbar"
        aria-label={isAdmin ? 'Menu quản trị' : 'Menu học tập'}
        onMouseLeave={() => setHoveredHash(null)}
      >
        {/* Local Hover Highlight Pill */}
        <span
          aria-hidden="true"
          style={{
            transform: hoverRect ? `translate3d(0, ${hoverRect.top}px, 0)` : 'translate3d(0, 0, 0)',
            height: hoverRect ? hoverRect.height : 0,
            opacity: hoverRect ? 1 : 0,
          }}
          className="pointer-events-none absolute left-3 right-3 top-0 m-0 rounded-2xl bg-white/70 border border-white/95 shadow-[0_4px_14px_rgba(148,163,184,0.08)] transition-[transform,opacity] duration-200 ease-out"
        />

        {/* Local Active Pastel Liquid Crystal Pill (Pixel-aligned with item offsetTop) */}
        {activeRect && (
          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${activeRect.top}px, 0)`,
              height: activeRect.height,
            }}
            className="pointer-events-none absolute left-3 right-3 top-0 m-0 rounded-2xl bg-gradient-to-r from-rose-200/60 via-pink-100/65 to-amber-100/65 border border-white/95 shadow-[0_6px_18px_rgba(244,114,182,0.14),inset_0_1.5px_1px_rgba(255,255,255,0.98)] transition-transform duration-250 ease-out"
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
              onMouseEnter={() => setHoveredHash(item.hash)}
              className={`group/nav relative z-10 flex items-center gap-3.5 px-4 h-11 rounded-2xl text-[14.5px] leading-none transition-colors duration-200 ${
                active
                  ? 'text-rose-700 font-bold'
                  : 'text-slate-600 font-semibold hover:text-slate-900'
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`w-[19px] h-[19px] shrink-0 transition-colors duration-200 ${
                  active ? 'text-rose-500' : 'text-slate-400 group-hover/nav:text-rose-400'
                }`}
                strokeWidth={active ? 2.25 : 1.9}
              />
              <span className="leading-none">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Bottom User Profile & Logout */}
      {user && (
        <div className="p-3 border-t border-white/70">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-2xl bg-white/55 hover:bg-white/85 border border-white/85 shadow-sm transition-colors duration-200">
            <a
              href="#/profile"
              onClick={onSelect}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{user.displayName}</p>
                <p
                  className={`text-[11px] truncate ${
                    isAdmin ? 'text-rose-600 font-semibold' : 'text-slate-500'
                  }`}
                >
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
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer shrink-0"
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
      {/* Desktop Floating Sculpted Liquid Glass Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-3 lg:bottom-3 lg:left-3 lg:rounded-[28px] liquid-sidebar z-40 overflow-hidden">
        <SidebarNavContent
          menuItems={menuItems}
          activeHash={activeHash}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          user={user}
          logout={logout}
        />
      </aside>

      {/* Mobile Liquid Glass Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 liquid-sidebar px-4 h-14 flex items-center justify-between">
        <a href={isAdmin ? '#/admin/courses' : '#/today'} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-400 to-amber-300 text-white flex items-center justify-center font-hanzi-serif font-black text-base shadow-sm">
            汉
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight text-slate-800">
            Hanzi<span className="text-rose-500">4U</span>
          </span>
          {isAdmin && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 uppercase">
              {isSuperAdmin ? 'Admin' : 'Biên tập'}
            </span>
          )}
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu"
          className="p-2 rounded-xl text-slate-600 hover:bg-white/80 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Slide-Over Liquid Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="relative w-72 max-w-[82vw] bg-white/92 backdrop-blur-2xl h-full shadow-2xl border-r border-white flex flex-col z-10"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer z-20"
              >
                <X className="w-5 h-5" />
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
