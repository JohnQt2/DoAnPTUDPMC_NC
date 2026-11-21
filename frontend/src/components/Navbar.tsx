import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { HanziLogo } from './HanziLogo';

export const Navbar: React.FC<{ currentPath?: string; theme?: 'dark' | 'light' }> = ({
  currentPath = '#/',
}) => {
  const basePath = currentPath.split('?')[0] || '#/';
  const isLoginRoute = basePath === '#/login';
  const isRegisterTab = currentPath.includes('tab=register');

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F6]/95 backdrop-blur-md border-b border-[#EAE3DE]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Bespoke Hanzi4U Imperial Crimson Seal Logo */}
          <a href="#/" className="group focus-visible:outline-none">
            <HanziLogo variant="light" size="md" subtitle="HỌC TIẾNG TRUNG HSK" />
          </a>

          {/* Right Auth & Quick Return Actions (Center menu removed for instant 0ms response) */}
          <div className="flex items-center gap-2.5">
            {isLoginRoute && (
              <a
                href="#/"
                className="px-3.5 py-2 text-[13px] font-semibold text-[#5F5658] hover:text-[#181415] inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trang chủ</span>
              </a>
            )}
            <a
              href="#/login"
              className={`px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                isLoginRoute && !isRegisterTab
                  ? 'text-[#C41E3A]'
                  : 'text-[#181415] hover:text-[#C41E3A]'
              }`}
            >
              Đăng nhập
            </a>
            <a
              href="#/login?tab=register"
              className="h-9 px-4 rounded-xl bg-[#C41E3A] hover:bg-[#A51730] text-white text-[13px] font-semibold inline-flex items-center justify-center transition-colors shadow-[0_6px_16px_-6px_rgba(196,30,58,0.55)]"
            >
              Bắt đầu miễn phí
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
