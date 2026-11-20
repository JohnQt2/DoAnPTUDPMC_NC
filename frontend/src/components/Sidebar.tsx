import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getCached, setCached } from '../lib/cache';
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

// Deduplicated background hover prefetch so clicking any menu item feels instant
const prefetchedInFlight = new Set<string>();
function prefetchRouteData(hash: string) {
  if (prefetchedInFlight.has(hash)) return;
  if (hash === '#/courses' && !getCached('courses:list')) {
    prefetchedInFlight.add(hash);
    api
      .get<any[]>('/curriculum/courses')
      .then((d) => Array.isArray(d) && setCached('courses:list', d))
      .catch(() => {})
      .finally(() => prefetchedInFlight.delete(hash));
  } else if (hash === '#/vocab' && !getCached('vocab:HSK1:')) {
    prefetchedInFlight.add(hash);
    api
      .get<any[]>('/curriculum/vocabularies', { params: { level: 'HSK1', limit: 160 } })
      .then((d) => Array.isArray(d) && setCached('vocab:HSK1:', d))
      .catch(() => {})
      .finally(() => prefetchedInFlight.delete(hash));
  } else if (hash === '#/exams' && !getCached('exams:list')) {
    prefetchedInFlight.add(hash);
    Promise.all([
      api.get<any[]>('/assessment/tests').catch(() => null),
      api.get<any[]>('/assessment/submissions').catch(() => null),
    ])
      .then(([t, s]) => {
        if (Array.isArray(t)) setCached('exams:list', t);
        if (Array.isArray(s)) setCached('exams:submissions', s);
      })
      .finally(() => prefetchedInFlight.delete(hash));
  }
}

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
 * 2026 Minimalist Executive Sidebar (Linear / Vercel / Claude precision):
 * - Full-height pure #FFFFFF rail with 1px zinc-200 border
 * - Pixel-aligned 36px rows, crisp neutral #F4F4F5 active indicator sliding smoothly on GPU translate3d
 * - Zero bounce, zero blur lag, zero visual bloat
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
  const [activeRect, setActiveRect] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = itemRefs.current[activeHash];
    if (el) {
      setActiveRect({ top: el.offsetTop, height: el.offsetHeight });
    } else {
      setActiveRect(null);
    }
  }, [activeHash, menuItems.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center border-b border-zinc-200/80 shrink-0">
        <a
          href={isAdmin ? '#/admin/courses' : '#/today'}
          onClick={onSelect}
          className="flex items-center gap-2.5"
        >
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-lg bg-[#09090B] text-white flex items-center justify-center font-hanzi-serif font-bold text-sm"
          >
            汉
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-[16px] tracking-tight text-zinc-950 leading-none">
              Hanzi<span className="text-[#BE123C]">4U</span>
            </span>
            {isAdmin && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                {isSuperAdmin ? 'Admin' : 'CMS'}
              </span>
            )}
          </div>
        </a>
      </div>

      {/* Navigation Group Label */}
      <div className="px-4 pt-5 pb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
          {isAdmin ? 'Quản trị hệ thống' : 'Không gian học'}
        </span>
      </div>

      {/* Navigation Items */}
      <nav
        className="relative flex-1 px-2.5 pb-4 flex flex-col gap-0.5 overflow-y-auto no-scrollbar"
        aria-label={isAdmin ? 'Menu quản trị' : 'Menu học tập'}
      >
        {/* Crisp Neutral Active Indicator Pill (GPU translate3d, 100% scroll-immune) */}
        {activeRect && (
          <span
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${activeRect.top}px, 0)`,
              height: activeRect.height,
            }}
            className="pointer-events-none absolute left-2.5 right-2.5 top-0 rounded-lg bg-zinc-100 border border-zinc-200/70 transition-transform duration-150 ease-out"
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
              onMouseEnter={() => {
                if (!isAdmin) prefetchRouteData(item.hash);
              }}
              className={`relative z-10 flex items-center justify-between px-3 h-9 rounded-lg text-[13.5px] leading-none transition-colors duration-150 select-none ${
                active
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-600 font-medium hover:text-zinc-950 hover:bg-zinc-100/60'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                    active ? 'text-[#BE123C]' : 'text-zinc-400'
                  }`}
                  strokeWidth={active ? 2.1 : 1.75}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#BE123C] shrink-0" />}
            </a>
          );
        })}
      </nav>

      {/* Bottom Account Footer */}
      {user && (
        <div className="p-2.5 border-t border-zinc-200/80 shrink-0">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors">
            <a
              href="#/profile"
              onClick={onSelect}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size="sm" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 truncate leading-tight">
                  {user.displayName}
                </p>
                <p className="text-[11px] text-zinc-500 truncate leading-tight mt-0.5">
                  {isAdmin ? (isSuperAdmin ? 'Quản trị viên' : 'Biên tập nội dung') : 'Tài khoản'}
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
              className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<{ currentPath: string }> = React.memo(({ currentPath }) => {
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
      {/* Desktop Fixed Full-Height Executive Rail */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-zinc-200 z-40">
        <SidebarNavContent
          menuItems={menuItems}
          activeHash={activeHash}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          user={user}
          logout={logout}
        />
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-4 h-14 flex items-center justify-between">
        <a href={isAdmin ? '#/admin/courses' : '#/today'} className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#09090B] text-white flex items-center justify-center font-hanzi-serif font-bold text-sm">
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
          className="p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
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
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative w-64 max-w-[82vw] bg-white h-full border-r border-zinc-200 shadow-xl flex flex-col z-10"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 cursor-pointer z-20"
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
});

Sidebar.displayName = 'Sidebar';
