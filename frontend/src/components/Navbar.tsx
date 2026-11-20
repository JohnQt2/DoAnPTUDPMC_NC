import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LucianLiquidButton } from './ui';

export const Navbar: React.FC<{ currentPath?: string; theme?: 'dark' | 'light' }> = ({
  currentPath = '#/',
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  const isLanding =
    currentPath === '#/' ||
    currentPath === '' ||
    currentPath === '#/landing' ||
    currentPath.startsWith('#/?');

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    if (!isLanding) return;
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-[#FAFAF9]/85 backdrop-blur-md">
      {/* 120fps GPU Scroll Progress Hairline */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX, transformOrigin: '0% 50%' }}
        className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-[#BE123C] z-50"
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-15 py-2.5">
          {/* Brand */}
          <a href="#/" className="flex items-center gap-2.5 group">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-hanzi-serif font-bold text-base transition-transform duration-200 group-hover:scale-105"
            >
              汉
            </span>
            <span className="font-display font-bold text-[17px] tracking-tight text-zinc-950">
              Hanzi<span className="text-[#BE123C]">4U</span>
            </span>
          </a>

          {/* Editorial Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-zinc-600">
            <a
              href="#trai-nghiem"
              onClick={scrollToSection('trai-nghiem')}
              className="hover:text-zinc-950 transition-colors"
            >
              Trải nghiệm thử
            </a>
            <a
              href="#phuong-phap"
              onClick={scrollToSection('phuong-phap')}
              className="hover:text-zinc-950 transition-colors"
            >
              Phương pháp
            </a>
            <a
              href="#lo-trinh"
              onClick={scrollToSection('lo-trinh')}
              className="hover:text-zinc-950 transition-colors"
            >
              Lộ trình HSK 1–6
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a
              href="#/login"
              className="h-9 px-3.5 rounded-lg inline-flex items-center text-[13px] font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200/60 transition-colors"
            >
              Đăng nhập
            </a>
            <LucianLiquidButton href="#/login?tab=register" variant="ink" size="sm" className="rounded-lg">
              <span>Đăng ký miễn phí</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </LucianLiquidButton>
          </div>
        </div>
      </div>
    </header>
  );
};
