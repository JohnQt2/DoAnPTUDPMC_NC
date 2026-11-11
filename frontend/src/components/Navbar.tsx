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
} from 'lucide-react';

export const Navbar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const guestLinks = [
    { label: 'Giới Thiệu', hash: '#/', icon: BookOpen },
    { label: 'Tính Năng Nổi Bật', hash: '#features', icon: Sparkles },
    { label: 'Khóa Học HSK', hash: '#/courses', icon: GraduationCap },
    { label: 'Ngữ Âm Pinyin', hash: '#/pinyin', icon: Volume2 },
  ];

  const studentLinks = [
    { label: 'Khóa Học', hash: '#/courses', icon: BookOpen },
    { label: 'Ngữ Âm Pinyin', hash: '#/pinyin', icon: Volume2 },
    { label: 'Luyện Viết Chữ Hán', hash: '#/characters', icon: Sparkles },
    { label: 'Ôn Tập SRS', hash: '#/srs', icon: Brain },
  ];

  const navLinks = user ? studentLinks : guestLinks;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CONTENT_EDITOR';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href={user ? '#/courses' : '#/'}
            className="flex items-center gap-2.5 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center font-chinese font-black text-xl shadow-md shadow-primary-500/20 group-hover:scale-105 motion-reduce:transform-none transition-transform"
            >
              中
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-primary-600 transition-colors">
                China<span className="text-primary-600">Easy</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase -mt-1">
                Tiếng Trung Sơ Cấp
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}
                  />
                  {link.label}
                </a>
              );
            })}

            {isAdmin && (
              <a
                href="#/admin/courses"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
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
                <a
                  href="#/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 transition-all text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  <div
                    aria-hidden="true"
                    className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs uppercase"
                  >
                    {user.displayName.charAt(0)}
                  </div>
                  <span className="max-w-[120px] truncate">{user.displayName}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {user.role}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={logout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất tài khoản"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <LogOut aria-hidden="true" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="#/login"
                  className="min-h-[40px] inline-flex items-center px-3.5 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-semibold text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                >
                  Đăng Nhập
                </a>
                <a
                  href="#/login?tab=register"
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md shadow-primary-600/20 transition-all hover:shadow-lg active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <User aria-hidden="true" className="w-4 h-4" />
                  <span>Đăng Ký Miễn Phí</span>
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
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
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
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-1">
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
                className={`min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon aria-hidden="true" className="w-5 h-5 text-gray-400" />
                {link.label}
              </a>
            );
          })}

          {isAdmin && (
            <a
              href="#/admin/courses"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-amber-700 bg-amber-50"
            >
              <Shield aria-hidden="true" className="w-5 h-5" />
              Quản Trị CMS
            </a>
          )}

          <div className="pt-3 border-t border-gray-100">
            {user ? (
              <div className="space-y-2">
                <a
                  href="#/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  <User aria-hidden="true" className="w-5 h-5 text-gray-400" />
                  Hồ sơ cá nhân ({user.displayName})
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
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
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 font-semibold text-sm"
                >
                  <User aria-hidden="true" className="w-4 h-4" />
                  Đăng Nhập
                </a>
                <a
                  href="#/login?tab=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-600/20"
                >
                  <Sparkles aria-hidden="true" className="w-4 h-4" />
                  Đăng Ký Miễn Phí
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
