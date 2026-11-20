import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion';
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

// Deduplicated background hover prefetch so clicking menu items renders instantly
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
 * Clean Floating iPhone / ThreeUI AnimatedTopDock-Inspired Sidebar:
 * - Zero nested backdrop-filter inside .liquid-sidebar (120fps instant response)
 * - Proximity subtle scale wave on hover (inspired by MengTo/threeui topDockController)
 * - Clean restrained ink (#16151B) + Seal Vermilion (#D93A55) accent (zero rainbow clutter)
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
  const hasMountedRef = useRef(false);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeVisible, setActiveVisible] = useState(false);
  const [activeHeight, setActiveHeight] = useState(44);

  // Smooth spring-damper active capsule (zero scroll jump, GPU-pure)
  const activeTargetY = useMotionValue(0);
  const activeY = useSpring(activeTargetY, { stiffness: 340, damping: 28, mass: 0.65 });

  useLayoutEffect(() => {
    const el = itemRefs.current[activeHash];
    if (!el) {
      setActiveVisible(false);
      hasMountedRef.current = false;
      return;
    }
    setActiveHeight(el.offsetHeight);
    if (!hasMountedRef.current) {
      activeTargetY.jump(el.offsetTop);
      activeY.jump(el.offsetTop);
      hasMountedRef.current = true;
    } else {
      activeTargetY.set(el.offsetTop);
    }
    setActiveVisible(true);
  }, [activeHash, menuItems.length, activeTargetY, activeY]);

  return (
    <div className="flex flex-col h-full">
      {/* Clean Editorial Brand Mark */}
      <div className="px-5 pt-6 pb-5 border-b border-[#16151B]/[0.07]">
        <a
          href={isAdmin ? '#/admin/courses' : '#/today'}
          onClick={onSelect}
          className="flex items-center gap-3 group"
        >
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-xl bg-[#16151B] text-[#F4F2EE] flex items-center justify-center font-hanzi-serif font-bold text-lg shadow-sm transition-transform duration-200 group-hover:scale-105"
          >
            汉
          </span>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-xl tracking-tight text-[#16151B] leading-none">
              Hanzi<span className="text-[#D93A55]">4U</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8E8A97] mt-1">
              {isAdmin ? (isSuperAdmin ? 'Quản trị' : 'Biên tập') : 'HSK 1–6 Studio'}
            </span>
          </div>
        </a>
      </div>

      {/* Navigation Dock List */}
      <nav
        className="relative flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto no-scrollbar"
        aria-label={isAdmin ? 'Menu quản trị' : 'Menu học tập'}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Active Crisp iPhone Liquid Glass Pill (zero nested blur -> locked 120fps) */}
        <motion.div
          aria-hidden="true"
          style={{ y: activeY, height: activeHeight }}
          animate={{ opacity: activeVisible ? 1 : 0 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-none absolute left-3 right-3 top-0 m-0 rounded-2xl bg-white/88 border border-white shadow-[0_8px_22px_-10px_rgba(22,21,27,0.16),inset_0_1.5px_1px_rgba(255,255,255,1)] will-change-transform"
        >
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[#D93A55]" />
        </motion.div>

        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const active = item.hash === activeHash;

          // ThreeUI AnimatedTopDock proximity magnification (subtle, crisp, zero layout shift)
          const dist = hoveredIdx === null ? 99 : Math.abs(hoveredIdx - idx);
          const dockScale = dist === 0 ? 1.03 : dist === 1 ? 1.012 : 1;
          const dockShiftX = dist === 0 ? 3 : dist === 1 ? 1 : 0;

          return (
            <motion.a
              key={item.hash}
              ref={(el) => {
                itemRefs.current[item.hash] = el;
              }}
              href={item.hash}
              onClick={onSelect}
              onMouseEnter={() => {
                setHoveredIdx(idx);
                if (!isAdmin) prefetchRouteData(item.hash);
              }}
              animate={{ scale: dockScale, x: dockShiftX }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              style={{ transformOrigin: 'left center' }}
              className={`relative z-10 flex items-center justify-between px-4 h-11 rounded-2xl text-[14px] leading-none transition-colors duration-150 select-none ${
                active
                  ? 'text-[#16151B] font-bold'
                  : 'text-[#57535F] font-medium hover:text-[#16151B]'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  aria-hidden="true"
                  className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
                    active ? 'text-[#D93A55]' : 'text-[#8E8A97]'
                  }`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className="leading-none truncate">{item.label}</span>
              </span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#D93A55] shrink-0" />}
            </motion.a>
          );
        })}
      </nav>

      {/* Bottom Profile Card */}
      {user && (
        <div className="p-3 border-t border-[#16151B]/[0.07]">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-2xl bg-white/65 hover:bg-white/90 border border-white/90 transition-colors duration-200">
            <a
              href="#/profile"
              onClick={onSelect}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#16151B] truncate">{user.displayName}</p>
                <p className="text-[11px] text-[#57535F] truncate">
                  {isAdmin ? (isSuperAdmin ? 'Quản trị viên' : 'Biên tập') : 'Hồ sơ cá nhân'}
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
              className="p-2 text-[#8E8A97] hover:text-[#D93A55] hover:bg-[#D93A55]/10 rounded-xl transition-colors cursor-pointer shrink-0"
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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-3 lg:bottom-3 lg:left-3 lg:rounded-[26px] liquid-sidebar z-40 overflow-hidden">
        <SidebarNavContent
          menuItems={menuItems}
          activeHash={activeHash}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          user={user}
          logout={logout}
        />
      </aside>

      <header className="lg:hidden sticky top-0 z-40 liquid-sidebar px-4 h-14 flex items-center justify-between">
        <a href={isAdmin ? '#/admin/courses' : '#/today'} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[#16151B] text-[#F4F2EE] flex items-center justify-center font-hanzi-serif font-bold text-base">
            汉
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight text-[#16151B]">
            Hanzi<span className="text-[#D93A55]">4U</span>
          </span>
        </a>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu"
          className="p-2 rounded-xl text-[#16151B] hover:bg-white/80 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="relative w-72 max-w-[82vw] bg-[#F4F2EE]/95 backdrop-blur-2xl h-full shadow-2xl border-r border-white flex flex-col z-10"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
                className="absolute top-4 right-4 p-2 rounded-xl text-[#57535F] hover:bg-black/5 cursor-pointer z-20"
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
