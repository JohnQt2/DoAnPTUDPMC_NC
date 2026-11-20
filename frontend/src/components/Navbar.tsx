import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { HanziLogo } from './HanziLogo';
import { smoothScrollToY, requestLandingSection } from '../lib/scrollNavigation';

type NavSectionId = 'hero' | 'khong-gian-3d' | 'thu-vien-anh' | 'bat-dau';

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
    basePath === '#khong-gian-3d' ||
    basePath === '#thu-vien-anh' ||
    basePath === '#bat-dau';

  const [activeSection, setActiveSection] = useState<NavSectionId>('hero');

  useEffect(() => {
    if (!isLanding) return;
    let rafId = 0;

    const updateSpy = () => {
      rafId = 0;
      const stage3d = document.getElementById('khong-gian-3d');
      const gallery = document.getElementById('thu-vien-anh');
      const cta = document.getElementById('bat-dau');

      if (cta && cta.getBoundingClientRect().top <= 360) {
        setActiveSection('bat-dau');
      } else if (gallery && gallery.getBoundingClientRect().top <= 280) {
        setActiveSection('thu-vien-anh');
      } else if (stage3d && stage3d.getBoundingClientRect().top <= 280) {
        setActiveSection('khong-gian-3d');
      } else {
        setActiveSection('hero');
      }
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(updateSpy);
    };

    updateSpy();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isLanding]);

  const handleNavClick = (section: NavSectionId) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLanding) {
      if (section !== 'hero') requestLandingSection(section, 76);
      window.location.hash = '#/';
      return;
    }

    setActiveSection(section);
    if (section === 'hero') {
      smoothScrollToY(0, 560);
    } else {
      requestLandingSection(section, 76);
    }
  };

  const navItems: Array<{ key: NavSectionId; label: string; href: string }> = [
    { key: 'hero', label: 'Tổng quan', href: '#/' },
    { key: 'khong-gian-3d', label: 'Phòng Học 3D', href: '#khong-gian-3d' },
    { key: 'thu-vien-anh', label: 'Phương Pháp', href: '#thu-vien-anh' },
    { key: 'bat-dau', label: 'Đăng Ký HSK', href: '#bat-dau' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F6]/95 backdrop-blur-xl border-b border-[#EAE3DE] shadow-[0_2px_18px_-8px_rgba(24,20,21,0.08)]">
      {/* Silky 120fps Crimson-to-Gold Scroll Progress Hairline */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX, transformOrigin: '0% 50%' }}
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#00A86B] z-50"
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Bespoke Hanzi4U Imperial Crimson Seal Logo */}
          <a
            href="#/"
            onClick={handleNavClick('hero')}
            className="group focus-visible:outline-none"
          >
            <HanziLogo variant="light" size="md" />
          </a>

          {/* Center Pill Navigation with Sliding Porcelain-Crimson Active Capsule */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/80 border border-[#EAE3DE]">
            {navItems.map((item) => {
              const active = isLanding && activeSection === item.key;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={handleNavClick(item.key)}
                  className={`relative px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                    active ? 'text-white' : 'text-[#5F5658] hover:text-[#181415]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[#181415] shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Auth Actions: Ink 'Đăng nhập' + Imperial Crimson '#C41E3A' CTA */}
          <div className="flex items-center gap-2.5">
            <a
              href="#/login"
              className="px-3.5 py-2 text-[13.5px] font-semibold text-[#181415] hover:text-[#C41E3A] transition-colors"
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
