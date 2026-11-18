import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  GraduationCap,
  Brain,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Volume2,
  Sparkles,
  Compass,
  Flame,
} from 'lucide-react';

export const Navbar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const guestLinks = [
    { label: 'Giới Thiệu', hash: '#/', icon: BookOpen },
    { label: 'Công Cụ Học Tập', hash: '#features', icon: Sparkles },
    { label: 'Lộ Trình HSK 3.0', hash: '#/courses', icon: GraduationCap },
    { label: 'Bảng Pinyin', hash: '#/pinyin', icon: Volume2 },
  ];

  const studentLinks = [
    { label: 'Khóa Học HSK', hash: '#/courses', icon: BookOpen },
    { label: 'Lộ Trình Thích Ứng', hash: '#/onboarding', icon: Compass },
    { label: 'Bảng Pinyin', hash: '#/pinyin', icon: Volume2 },
    { label: 'Bảng Trắng Chữ Hán', hash: '#/characters', icon: Sparkles },
    { label: 'Ôn Tập SRS', hash: '#/srs', icon: Brain },
  ];

  const navLinks = user ? studentLinks : guestLinks;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CONTENT_EDITOR';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-primary-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Hanzi4u */}
          <a
            href={user ? '#/courses' : '#/'}
            className="flex items-center gap-2.5 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-primary-400 text-white flex items-center justify-center font-chinese font-black text-xl shadow-md shadow-primary-500/20 group-hover:scale-105 motion-reduce:transform-none transition-transform"
            >
              汉
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-primary-600 transition-colors">
                  Hanzi<span className="text-primary-500">4u</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-600 border border-primary-200/70 text-[10px] font-bold">
                  HSK 3.0
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase -mt-1">
                hanzi4u.id.vn
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.hash === '#/'
                  ? currentPath === '#/' || currentPath === ''
                  : currentPath.startsWith(link.hash);
              return (
                <a
                  key={link.hash}
                  href={link.hash}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 border border-primary-100'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 ${isActive ? 'text-primary-500' : 'text-gray-400'}`}
                  />
                  {link.label}
                </a>
              );
            })}

            {isAdmin && (
              <a
                href="#/admin/courses"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
                  currentPath.startsWith('#/admin')
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/50'
                }`}
              >
                <Shield aria-hidden="true" className="w-4 h-4 text-amber-600" />
                Quản Trị CMS
              </a>
            )}
          </nav>

          {/* User Profile / Auth Action */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-100 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-primary-500 fill-primary-500" />
                  15p/ngày
                </span>
                <a
                  href="#/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-100 bg-white hover:border-primary-300 hover:bg-primary-50/40 transition-all text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <div
                    aria-hidden="true"
                    className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs uppercase"
                  >
                    {user.displayName.charAt(0)}
                  </div>
                  <span className="max-w-[120px] truncate">{user.displayName}</span>
                  <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {user.role}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={logout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất tài khoản"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <LogOut aria-hidden="true" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="#/login"
                  className="min-h-[40px] inline-flex items-center px-3.5 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50/60 font-semibold text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  Đăng Nhập
                </a>
                <a
                  href="#/login?tab=register"
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-500/20 transition-all hover:shadow-lg active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <User aria-hidden="true" className="w-4 h-4" />
                  <span>Học Thử Miễn Phí</span>
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              aria-expanded={mobileMenuOpen}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" className="w-6 h-6" />
              ) : (
                <Menu aria-hidden="true" className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-100 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.hash === '#/'
                ? currentPath === '#/' || currentPath === ''
                : currentPath.startsWith(link.hash);
            return (
              <a
                key={link.hash}
                href={link.hash}
                onClick={() => setMobileMenuOpen(false)}
                className={`min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-primary-50/40'
                }`}
              >
                <Icon aria-hidden="true" className="w-5 h-5 text-primary-400" />
                {link.label}
              </a>
            );
          })}

          {isAdmin && (
            <a
              href="#/admin/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium text-amber-700 bg-amber-50"
            >
              <Shield aria-hidden="true" className="w-5 h-5" />
              Quản Trị CMS
            </a>
          )}

          <div className="pt-3 border-t border-primary-100">
            {user ? (
              <div className="space-y-2">
                <a
                  href="#/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  <User aria-hidden="true" className="w-5 h-5 text-primary-400" />
                  Hồ sơ cá nhân ({user.displayName})
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl cursor-pointer"
                >
                  <LogOut aria-hidden="true" className="w-5 h-5" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <a
                  href="#/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary-200 text-gray-800 font-semibold text-sm"
                >
                  <User aria-hidden="true" className="w-4 h-4" />
                  Đăng Nhập
                </a>
                <a
                  href="#/login?tab=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-semibold text-sm shadow-md shadow-primary-500/20"
                >
                  <Sparkles aria-hidden="true" className="w-4 h-4" />
                  Học Thử Miễn Phí
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
