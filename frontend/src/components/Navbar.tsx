import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

import {
  BookOpen,
  Brain,
  ClipboardList,
  GraduationCap,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  User,
  Volume2,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
}

interface NavigationLink {
  label: string;
  hash: string;
  icon: React.ComponentType<{
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
}) => {
  const { user, logout } = useAuth();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /**
   * Các liên kết dành cho khách chưa đăng nhập.
   */
  const guestLinks: NavigationLink[] = [
    {
      label: 'Giới Thiệu',
      hash: '#/',
      icon: BookOpen,
    },
    {
      label: 'Tính Năng Nổi Bật',
      hash: '#features',
      icon: Sparkles,
    },
    {
      label: 'Khóa Học HSK',
      hash: '#/courses',
      icon: GraduationCap,
    },
    {
      label: 'Ngữ Âm Pinyin',
      hash: '#/pinyin',
      icon: Volume2,
    },
  ];

  /**
   * Các liên kết dành cho học viên đã đăng nhập.
   *
   * Khảo sát học tập được đặt gần đầu menu vì đây là
   * dữ liệu đầu vào để cá nhân hóa lộ trình học.
   */
  const studentLinks: NavigationLink[] = [
    {
      label: 'Khóa Học',
      hash: '#/courses',
      icon: BookOpen,
    },
    {
      label: 'Khảo Sát Học Tập',
      hash: '#/learning-survey',
      icon: ClipboardList,
    },
    {
      label: 'Ngữ Âm Pinyin',
      hash: '#/pinyin',
      icon: Volume2,
    },
    {
      label: 'Luyện Viết Chữ Hán',
      hash: '#/characters',
      icon: Sparkles,
    },
    {
      label: 'Ôn Tập SRS',
      hash: '#/srs',
      icon: Brain,
    },
  ];

  const navLinks = user
    ? studentLinks
    : guestLinks;

  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'CONTENT_EDITOR';

  /**
   * Kiểm tra liên kết có đang được chọn không.
   */
  const isLinkActive = (
    hash: string
  ): boolean => {
    if (hash === '#/') {
      return (
        currentPath === '#/' ||
        currentPath === ''
      );
    }

    return currentPath.startsWith(hash);
  };

  /**
   * Đóng menu mobile sau khi điều hướng.
   */
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  /**
   * Đăng xuất và đóng menu mobile.
   */
  const handleMobileLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
  };

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
                China
                <span className="text-primary-600">
                  Easy
                </span>
              </span>

              <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase -mt-1">
                Tiếng Trung Sơ Cấp
              </span>
            </div>
          </a>

          {/* Menu desktop */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Điều hướng chính"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;

              const active =
                isLinkActive(link.hash);

              return (
                <a
                  key={link.hash}
                  href={link.hash}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${active
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 ${active
                        ? 'text-primary-600'
                        : 'text-gray-400'
                      }`}
                  />

                  {link.label}
                </a>
              );
            })}

            {/* CMS chỉ dành cho Admin và Content Editor */}
            {isAdmin && (
              <a
                href="#/admin/courses"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${currentPath.startsWith(
                  '#/admin'
                )
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/50'
                  }`}
              >
                <Shield
                  aria-hidden="true"
                  className="w-4 h-4 text-amber-600"
                />

                Quản Trị CMS
              </a>
            )}
          </nav>

          {/* Tài khoản desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <a
                  href="#/profile"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${currentPath.startsWith(
                    '#/profile'
                  )
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50/40'
                    }`}
                >
                  <div
                    aria-hidden="true"
                    className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs uppercase"
                  >
                    {user.displayName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span className="max-w-[120px] truncate">
                    {user.displayName}
                  </span>

                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {user.role}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    void logout();
                  }}
                  title="Đăng xuất"
                  aria-label="Đăng xuất tài khoản"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <LogOut
                    aria-hidden="true"
                    className="w-4 h-4"
                  />
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
                  <User
                    aria-hidden="true"
                    className="w-4 h-4"
                  />

                  <span>
                    Đăng Ký Miễn Phí
                  </span>
                </a>
              </div>
            )}
          </div>

          {/* Nút mở menu mobile */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (current) => !current
                )
              }
              aria-label={
                mobileMenuOpen
                  ? 'Đóng menu điều hướng'
                  : 'Mở menu điều hướng'
              }
              aria-expanded={
                mobileMenuOpen
              }
              aria-controls="mobile-navigation"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              {mobileMenuOpen ? (
                <X
                  aria-hidden="true"
                  className="w-6 h-6"
                />
              ) : (
                <Menu
                  aria-hidden="true"
                  className="w-6 h-6"
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-1"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;

            const active =
              isLinkActive(link.hash);

            return (
              <a
                key={link.hash}
                href={link.hash}
                onClick={closeMobileMenu}
                className={`min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${active
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`w-5 h-5 ${active
                      ? 'text-primary-600'
                      : 'text-gray-400'
                    }`}
                />

                {link.label}
              </a>
            );
          })}

          {isAdmin && (
            <a
              href="#/admin/courses"
              onClick={closeMobileMenu}
              className={`min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${currentPath.startsWith(
                '#/admin'
              )
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-gray-700 hover:bg-amber-50'
                }`}
            >
              <Shield
                aria-hidden="true"
                className="w-5 h-5 text-amber-600"
              />

              Quản Trị CMS
            </a>
          )}

          <div className="pt-3 border-t border-gray-100">
            {user ? (
              <div className="space-y-2">
                <a
                  href="#/profile"
                  onClick={closeMobileMenu}
                  className={`min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${currentPath.startsWith(
                    '#/profile'
                  )
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <User
                    aria-hidden="true"
                    className="w-5 h-5 text-gray-400"
                  />

                  <span className="truncate">
                    Hồ sơ cá nhân (
                    {user.displayName})
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    void handleMobileLogout();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <LogOut
                    aria-hidden="true"
                    className="w-5 h-5"
                  />

                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <a
                  href="#/login"
                  onClick={closeMobileMenu}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 font-semibold text-sm"
                >
                  <User
                    aria-hidden="true"
                    className="w-4 h-4"
                  />

                  Đăng Nhập
                </a>

                <a
                  href="#/login?tab=register"
                  onClick={closeMobileMenu}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-600/20"
                >
                  <Sparkles
                    aria-hidden="true"
                    className="w-4 h-4"
                  />

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