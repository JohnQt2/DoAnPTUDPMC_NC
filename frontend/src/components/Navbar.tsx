import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { HanziLogo } from './HanziLogo';
import {
  smoothScrollToY,
  requestLandingBay,
  requestLandingSection,
} from '../lib/scrollNavigation';

type LandingSectionKey = 'home' | 'intro' | 'shelf' | 'register';

export const Navbar: React.FC<{ currentPath?: string; theme?: 'dark' | 'light' }> = ({
  currentPath = '#/',
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 34,
    restDelta: 0.001,
  });

  const basePath = currentPath.split('?')[0] || '#/';
  const isLanding =
    basePath === '#/' ||
    basePath === '' ||
    basePath === '#/landing' ||
    basePath === '#gioi-thieu' ||
    basePath === '#thu-phong' ||
    basePath === '#ghi-danh';

  const [activeSection, setActiveSection] = useState<LandingSectionKey>('home');

  // Lightweight rAF-throttled scroll spy so active gold underline smoothly tracks current section
  useEffect(() => {
    if (!isLanding) return;
    let rafId = 0;

    const updateActive = () => {
      rafId = 0;
      const introEl = document.getElementById('gioi-thieu');
      const shelfEl = document.getElementById('thu-phong');

      if (!introEl || !shelfEl) {
        setActiveSection('home');
        return;
      }

      const introRect = introEl.getBoundingClientRect();
      const shelfRect = shelfEl.getBoundingClientRect();

      if (introRect.top > 120) {
        setActiveSection('home');
        return;
      }

      if (shelfRect.top > 120) {
        setActiveSection('intro');
        return;
      }

      // Inside or past the 5-bay horizontal shelf: highlight 'Ghi danh' on Bay 5 (progress >= 0.86)
      const scrollable = Math.max(1, shelfEl.offsetHeight - (window.innerHeight - 64));
      const shelfProgress = Math.max(0, Math.min(1, (64 - shelfRect.top) / scrollable));
      if (shelfProgress >= 0.86 || shelfRect.bottom <= window.innerHeight + 24) {
        setActiveSection('register');
      } else {
        setActiveSection('shelf');
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateActive);
      }
    };

    updateActive();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isLanding]);

  const handleNavClick = (section: LandingSectionKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLanding) {
      if (section === 'intro') requestLandingSection('gioi-thieu', 64);
      else if (section === 'shelf') requestLandingBay(0);
      else if (section === 'register') requestLandingBay(4);
      window.location.hash = '#/';
      return;
    }

    setActiveSection(section);
    if (section === 'home') {
      smoothScrollToY(0, 560);
    } else if (section === 'intro') {
      requestLandingSection('gioi-thieu', 64);
    } else if (section === 'shelf') {
      requestLandingBay(0);
    } else if (section === 'register') {
      requestLandingBay(4);
    }
  };

  const navItems: Array<{ key: LandingSectionKey; label: string; href: string }> = [
    { key: 'home', label: 'Trang chủ', href: '#/' },
    { key: 'intro', label: 'Giới thiệu', href: '#gioi-thieu' },
    { key: 'shelf', label: 'Thư phòng HSK', href: '#thu-phong' },
    { key: 'register', label: 'Ghi danh', href: '#ghi-danh' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#1F3A2E] border-b border-[#B08D3C]/25 shadow-[0_4px_20px_rgba(18,28,22,0.22)]">
      {/* Silky 120fps GPU Gold Scroll Progress Hairline */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX, transformOrigin: '0% 50%' }}
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[2px] bg-[#B08D3C] z-50"
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Bespoke Hanzi4U Architectural Scholar Crest */}
          <a
            href="#/"
            onClick={handleNavClick('home')}
            className="group focus-visible:outline-none"
          >
            <HanziLogo variant="dark" size="md" />
          </a>

          {/* Center Editorial Nav Links with Silky GPU Sliding Gold Underline */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium">
            {navItems.map((item) => {
              const active = isLanding && activeSection === item.key;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={handleNavClick(item.key)}
                  className={`relative py-1.5 transition-colors cursor-pointer ${
                    active ? 'text-[#FBF7EC]' : 'text-[#FBF7EC]/75 hover:text-[#FBF7EC]'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="navbar-active-underline"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-[#B08D3C]"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Auth Actions: Gold 'Đăng nhập' + Cinnabar '#7A2E2B' 'Đăng ký miễn phí' */}
          <div className="flex items-center gap-3">
            <a
              href="#/login"
              className="px-3 py-2 text-[13.5px] font-medium text-[#D4B26A] hover:text-[#FBF7EC] transition-colors"
            >
              Đăng nhập
            </a>
            <a
              href="#/login?tab=register"
              className="h-9 px-4 rounded-[6px] bg-[#7A2E2B] hover:bg-[#642422] text-[#FBF7EC] text-[13px] font-semibold inline-flex items-center justify-center transition-colors shadow-xs border border-[#B08D3C]/25"
            >
              Đăng ký miễn phí
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
