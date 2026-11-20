import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ShimmerButton } from './ui';

export const Navbar: React.FC<{ currentPath?: string; theme?: 'dark' | 'light' }> = ({
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={
        isDark
          ? 'sticky top-0 z-50 border-b border-white/[0.08] bg-[#09090B]/85 backdrop-blur-md'
          : 'sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md'
      }
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo — Monochrome Editorial Precision */}
          <a href="#/" className="flex items-center gap-2.5 group">
            <span
              aria-hidden="true"
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-hanzi-serif font-bold text-base transition-colors ${
                isDark ? 'bg-white text-zinc-950' : 'bg-[#09090B] text-white'
              }`}
            >
              汉
            </span>
            <span
              className={`font-display font-bold text-lg tracking-tight ${
                isDark ? 'text-white' : 'text-[#09090B]'
              }`}
            >
              Hanzi<span className="text-[#BE123C]">4U</span>
            </span>
          </a>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium">
            <a
              href="#/"
              className={
                isDark
                  ? 'text-zinc-400 hover:text-white transition-colors'
                  : 'text-zinc-600 hover:text-zinc-950 transition-colors'
              }
            >
              Trang chủ
            </a>
            <a
              href="#/login?tab=register"
              className={
                isDark
                  ? 'text-zinc-400 hover:text-white transition-colors'
                  : 'text-zinc-600 hover:text-zinc-950 transition-colors'
              }
            >
              Lộ trình HSK 1–6
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-2">
            <a
              href="#/login"
              className={`px-3.5 h-9 inline-flex items-center rounded-xl font-medium text-[13px] transition-colors ${
                isDark
                  ? 'text-zinc-300 hover:text-white hover:bg-white/10'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              Đăng nhập
            </a>
            <ShimmerButton href="#/login?tab=register" size="sm">
              <span>Bắt đầu</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </ShimmerButton>
          </div>
        </div>
      </div>
    </header>
  );
};
