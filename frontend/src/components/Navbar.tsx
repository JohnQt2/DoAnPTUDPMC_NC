import React from 'react';
import { User } from 'lucide-react';

export const Navbar: React.FC<{ currentPath?: string }> = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Clean Logo - No HSK 3.0 badge */}
          <a href="#/" className="flex items-center gap-2.5 group">
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center font-chinese font-black text-xl shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform"
            >
              汉
            </span>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              Hanzi<span className="text-primary-500">4u</span>
            </span>
          </a>

          {/* Simple Auth Actions */}
          <div className="flex items-center gap-2.5">
            <a
              href="#/login"
              className="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50 font-semibold text-sm transition-colors"
            >
              Đăng nhập
            </a>
            <a
              href="#/login?tab=register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-sm shadow-primary-500/20 transition-all"
            >
              <User aria-hidden="true" className="w-4 h-4" />
              <span>Bắt đầu miễn phí</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
