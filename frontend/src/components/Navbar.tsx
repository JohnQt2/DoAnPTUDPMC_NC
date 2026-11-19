import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ShimmerButton } from './ui';

export const Navbar: React.FC<{ currentPath?: string; theme?: 'dark' | 'light' }> = ({
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={
        isDark
          ? 'sticky top-0 z-50 border-b border-white/[0.08] bg-[#14080c]/65 backdrop-blur-2xl'
          : 'sticky top-0 z-50 border-b border-white/80 bg-white/75 backdrop-blur-2xl shadow-sm shadow-gray-900/[0.03]'
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <a href="#/" className="flex items-center gap-2.5 group">
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-secondary-500 text-white flex items-center justify-center font-chinese font-black text-xl shadow-lg shadow-primary-600/25 group-hover:scale-105 transition-transform"
            >
              汉
            </span>
            <span
              className={`font-extrabold text-xl tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Hanzi
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                4U
              </span>
            </span>
          </a>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#/"
              className={
                isDark
                  ? 'text-white/70 hover:text-white transition-colors'
                  : 'text-gray-600 hover:text-primary-600 transition-colors'
              }
            >
              Trang chủ
            </a>
            <a
              href="#/login?tab=register"
              className={
                isDark
                  ? 'text-white/70 hover:text-white transition-colors'
                  : 'text-gray-600 hover:text-primary-600 transition-colors'
              }
            >
              Lộ trình HSK 1–6
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-2.5">
            <a
              href="#/login"
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                isDark
                  ? 'text-white/85 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              Đăng nhập
            </a>
            <ShimmerButton href="#/login?tab=register" size="sm" className="rounded-xl">
              <span>Đăng ký miễn phí</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </ShimmerButton>
          </div>
        </div>
      </div>
    </header>
  );
};
