import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
} from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
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
  collapsed?: boolean;
  onSelect?: () => void;
}

/**
 * Scroll-immune Liquid Glass Bubble sidebar nav:
 * Anchored to local el.offsetTop inside <nav> (100% immune to window scroll jumps).
 * Uses Framer Motion spring physics + real-time velocity-driven squash & stretch so the pill
 * stretches vertically and narrows slightly like a silky liquid soap bubble while gliding,
 * then settles seamlessly with a soft translucent glass specular highlight.
 */
const SidebarNavContent: React.FC<NavContentProps> = ({
  menuItems,
  activeHash,
  isAdmin,
  isSuperAdmin,
  user,
  logout,
  collapsed = false,
  onSelect,
}) => {
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const hasMountedActiveRef = useRef(false);
  const hasVisibleHoverRef = useRef(false);

  const [hoveredHash, setHoveredHash] = useState<string | null>(null);
  const [activeVisible, setActiveVisible] = useState(false);
  const [activeHeight, setActiveHeight] = useState(44);
  const [hoverVisible, setHoverVisible] = useState(false);
  const [hoverHeight, setHoverHeight] = useState(44);

  // Active Liquid Bubble physics (velvety spring + volume-conserving droplet stretch)
  const activeTargetY = useMotionValue(0);
  const activeY = useSpring(activeTargetY, { stiffness: 280, damping: 24, mass: 0.72 });
  const activeVelocity = useVelocity(activeY);
  const activeStretchY = useTransform(activeVelocity, [-1600, -450, 0, 450, 1600], [1.22, 1.09, 1, 1.09, 1.22]);
  const activeSqueezeX = useTransform(activeVelocity, [-1600, -450, 0, 450, 1600], [0.935, 0.972, 1, 0.972, 0.935]);
  const activeScaleY = useSpring(activeStretchY, { stiffness: 420, damping: 32 });
  const activeScaleX = useSpring(activeSqueezeX, { stiffness: 420, damping: 32 });

  // Hover Dewdrop Bubble physics (light mist droplet trailing the cursor)
  const hoverTargetY = useMotionValue(0);
  const hoverY = useSpring(hoverTargetY, { stiffness: 360, damping: 29, mass: 0.62 });
  const hoverVelocity = useVelocity(hoverY);
  const hoverScaleY = useSpring(
    useTransform(hoverVelocity, [-1400, 0, 1400], [1.14, 1, 1.14]),
    { stiffness: 450, damping: 34 }
  );
  const hoverScaleX = useSpring(
    useTransform(hoverVelocity, [-1400, 0, 1400], [0.96, 1, 0.96]),
    { stiffness: 450, damping: 34 }
  );

  useLayoutEffect(() => {
    const el = itemRefs.current[activeHash];
    if (!el) {
      setActiveVisible(false);
      hasMountedActiveRef.current = false;
      return;
    }

    setActiveHeight(el.offsetHeight);
    if (!hasMountedActiveRef.current) {
      // First paint: place bubble immediately with zero slide-from-top jump
      activeTargetY.jump(el.offsetTop);
      activeY.jump(el.offsetTop);
      hasMountedActiveRef.current = true;
    } else {
      activeTargetY.set(el.offsetTop);
    }
    setActiveVisible(true);
  }, [activeHash, menuItems.length, activeTargetY, activeY]);

  useLayoutEffect(() => {
    if (!hoveredHash || hoveredHash === activeHash) {
      setHoverVisible(false);
      hasVisibleHoverRef.current = false;
      return;
    }
    const el = itemRefs.current[hoveredHash];
    if (!el) {
      setHoverVisible(false);
      hasVisibleHoverRef.current = false;
      return;
    }

    setHoverHeight(el.offsetHeight);
    if (!hasVisibleHoverRef.current) {
      // Entering nav: bloom droplet directly under cursor, then glide smoothly between items
      hoverTargetY.jump(el.offsetTop);
      hoverY.jump(el.offsetTop);
      hasVisibleHoverRef.current = true;
    } else {
      hoverTargetY.set(el.offsetTop);
    }
    setHoverVisible(true);
  }, [hoveredHash, activeHash, hoverTargetY, hoverY]);

  return (
    <div className="flex flex-col h-full">
      {/* Brand Logo */}
      <div className={collapsed ? 'px-3 py-6 flex justify-center' : 'px-5 py-6'}>
        <a
          href={isAdmin ? '#/admin/courses' : '#/today'}
          onClick={onSelect}
          title="Hanzi4U"
          className="flex items-center gap-3 group"
        >
          <span
            aria-hidden="true"
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-300 text-white flex items-center justify-center font-hanzi-serif font-black text-xl shadow-md shadow-rose-300/35 shrink-0"
          >
            汉
          </span>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-extrabold text-2xl tracking-tight text-slate-800 leading-none truncate">
                Hanzi<span className="text-rose-500">4U</span>
              </span>
              {isAdmin && (
                <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mt-1 truncate">
                  {isSuperAdmin ? 'Trang quản trị' : 'Biên tập nội dung'}
                </span>
              )}
            </div>
          )}
        </a>
      </div>

      {/* Menu Items with Scroll-Immune Liquid Glass Bubble */}
      <nav
        className="relative flex-1 px-3 flex flex-col gap-1 overflow-y-auto no-scrollbar"
        aria-label={isAdmin ? 'Menu quản trị' : 'Menu học tập'}
        onMouseLeave={() => setHoveredHash(null)}
      >
        {/* Soft Dewdrop Hover Bubble */}
        <motion.span
          aria-hidden="true"
          style={{
            y: hoverY,
            scaleY: hoverScaleY,
            scaleX: hoverScaleX,
            height: hoverHeight,
            originX: 0.5,
            originY: 0.5,
          }}
          animate={{
            opacity: hoverVisible ? 1 : 0,
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none absolute left-3 right-3 top-0 m-0 rounded-[20px] bg-white/68 backdrop-blur-md border border-white/95 shadow-[0_6px_18px_-6px_rgba(148,163,184,0.22),inset_0_1.5px_2px_rgba(255,255,255,0.98)] will-change-transform"
        />

        {/* Active Liquid Glass Bubble (stretches smoothly like a water droplet while gliding) */}
        <motion.div
          aria-hidden="true"
          style={{
            y: activeY,
            scaleY: activeScaleY,
            scaleX: activeScaleX,
            height: activeHeight,
            originX: 0.5,
            originY: 0.5,
          }}
          animate={{
            opacity: activeVisible ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-none absolute left-3 right-3 top-0 m-0 rounded-[22px] overflow-hidden bg-gradient-to-br from-rose-200/72 via-pink-100/62 to-amber-100/72 backdrop-blur-md border border-white/95 shadow-[0_10px_24px_-8px_rgba(244,114,182,0.28),0_2px_8px_-2px_rgba(255,255,255,0.65),inset_0_2px_3px_rgba(255,255,255,0.98),inset_0_-2px_6px_rgba(244,114,182,0.16)] will-change-transform"
        >
          {/* Curved Soap-Bubble Specular Sheen */}
          <span className="absolute inset-x-4 top-[3px] h-[5px] rounded-full bg-gradient-to-r from-white/20 via-white/90 to-white/20 blur-[0.5px]" />
          {/* Soft Iridescent Bottom Rim Glow */}
          <span className="absolute inset-x-8 bottom-[2px] h-[3px] rounded-full bg-gradient-to-r from-rose-300/0 via-amber-200/55 to-rose-300/0 blur-[1px]" />
        </motion.div>

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
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              onMouseEnter={() => setHoveredHash(item.hash)}
              className={`group/nav relative z-10 flex items-center ${
                collapsed ? 'justify-center px-0' : 'justify-between px-4'
              } h-11 rounded-[22px] text-[14.5px] leading-none transition-colors duration-200 ${
                active
                  ? 'text-rose-700 font-bold'
                  : 'text-slate-600 font-semibold hover:text-slate-900'
              }`}
            >
              <span className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3.5 min-w-0'}`}>
                <Icon
                  aria-hidden="true"
                  className={`w-[19px] h-[19px] shrink-0 transition-colors duration-200 ${
                    active ? 'text-rose-500' : 'text-slate-400 group-hover/nav:text-rose-400'
                  }`}
                  strokeWidth={active ? 2.25 : 1.9}
                />
                {!collapsed && <span className="leading-none truncate">{item.label}</span>}
              </span>
              {!collapsed && active && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-rose-400 to-amber-300 shadow-[0_0_8px_rgba(251,113,133,0.6)] shrink-0"
                />
              )}
            </a>
          );
        })}
      </nav>

      {/* Bottom User Profile & Logout */}
      {user && (
        <div className="p-3 border-t border-white/70">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <a
                href="#/profile"
                onClick={onSelect}
                title={user.displayName}
                className="rounded-full hover:ring-2 hover:ring-rose-300 transition-all"
              >
                <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} size="md" />
              </a>
              <button
                type="button"
                onClick={() => {
                  onSelect?.();
                  logout();
                }}
                title="Đăng xuất"
                aria-label="Đăng xuất"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<{
  currentPath: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}> = ({ currentPath, collapsed = false, onToggleCollapse }) => {
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
      {/* Desktop Floating Sculpted Liquid Glass Sidebar (Collapsible like Image 3) */}
      <aside
        className={`hidden lg:flex lg:flex-col ${
          collapsed ? 'lg:w-[78px]' : 'lg:w-64'
        } lg:fixed lg:top-3 lg:bottom-3 lg:left-3 lg:rounded-[28px] liquid-sidebar z-40 transition-[width] duration-300 ease-out`}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Mở rộng thanh công cụ' : 'Thu gọn thanh công cụ'}
            aria-label={collapsed ? 'Mở rộng thanh công cụ' : 'Thu gọn thanh công cụ'}
            className="absolute -right-3.5 top-7 z-50 w-7 h-7 rounded-full bg-white border border-rose-200/90 text-slate-600 hover:text-rose-600 hover:border-rose-300 shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
        <div className="flex flex-col h-full overflow-hidden rounded-[28px]">
          <SidebarNavContent
            menuItems={menuItems}
            activeHash={activeHash}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            user={user}
            logout={logout}
            collapsed={collapsed}
          />
        </div>
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
          className="p-2 rounded-xl text-slate-600 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 cursor-pointer"
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
