import React, { useEffect, useRef } from 'react';

function getSubtlePageTint(hash: string): string {
  const path = (hash || '#/').split('?')[0];

  // Landing & Login — delicate sunlit parchment highlight
  if (path === '#/' || path === '' || path === '#/landing' || path === '#/login') {
    return 'radial-gradient(circle, rgba(255, 252, 245, 0.24) 0%, rgba(212, 160, 23, 0.05) 48%, transparent 72%)';
  }

  // Vocab / SRS / Writing — whisper-soft jade pearl
  if (path.startsWith('#/vocab') || path.startsWith('#/srs') || path.startsWith('#/characters')) {
    return 'radial-gradient(circle, rgba(255, 252, 245, 0.34) 0%, rgba(21, 122, 87, 0.055) 46%, transparent 72%)';
  }

  // Speaking / Pinyin — whisper-soft champagne gold pearl
  if (path.startsWith('#/speak') || path.startsWith('#/pinyin')) {
    return 'radial-gradient(circle, rgba(255, 252, 245, 0.34) 0%, rgba(212, 160, 23, 0.065) 46%, transparent 72%)';
  }

  // Default (Today, Courses, Lessons, Exams, Profile) — whisper-soft imperial crimson pearl
  return 'radial-gradient(circle, rgba(255, 252, 245, 0.34) 0%, rgba(196, 30, 58, 0.05) 46%, transparent 72%)';
}

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], .glass-light, .glass-card-grid, .liquid-sidebar, .liquid-modal, [data-glass-hover]';

/**
 * Refined Interactive-Only Frosted Light Sheen (NO circle ring, NOT always on):
 * - Appears softly ONLY when hovering buttons, links, or Liquid Glass cards.
 * - Fades cleanly to 0 on empty canvas / plain text to keep the interface calm and uncluttered.
 * - Pure requestAnimationFrame, 0 React re-renders.
 */
export const CustomCursor: React.FC = () => {
  const sheenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isCoarse || reduced) return;

    let mouseX = -300;
    let mouseY = -300;
    let curX = -300;
    let curY = -300;
    let isActiveTarget = false;
    let rafId = 0;

    const applyTint = () => {
      if (sheenRef.current) {
        sheenRef.current.style.background = getSubtlePageTint(window.location.hash);
      }
    };
    applyTint();

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const target = e.target as HTMLElement | null;
      isActiveTarget = Boolean(target && target.closest(INTERACTIVE_SELECTOR));
    };

    const onLeave = () => {
      isActiveTarget = false;
    };

    const tick = () => {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;

      if (sheenRef.current) {
        sheenRef.current.style.opacity = isActiveTarget ? '1' : '0';
        sheenRef.current.style.transform = `translate3d(${curX - 75}px, ${curY - 75}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('hashchange', applyTint);
    document.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('hashchange', applyTint);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={sheenRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[45] w-[150px] h-[150px] rounded-full opacity-0 transition-opacity duration-300 hidden md:block"
      style={{ filter: 'blur(20px)' }}
    />
  );
};
