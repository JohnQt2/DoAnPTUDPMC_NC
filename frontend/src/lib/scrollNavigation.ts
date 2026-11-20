/**
 * Silky 120fps cancelable smooth-scroll utilities for Hanzi4U Landing Page.
 * Directly drives document.scrollingElement via requestAnimationFrame so it never
 * conflicts with sticky horizontal scroll tracks, Framer Motion useScroll springs,
 * or browser CSS scroll-behavior quirks.
 */

let activeRafId: number | null = null;
let cleanupInterrupt: (() => void) | null = null;

type PendingLandingTarget =
  | { type: 'bay'; bayIdx: number }
  | { type: 'section'; id: string; offsetPx: number }
  | null;

let pendingTarget: PendingLandingTarget = null;

export function cancelSmoothScroll(): void {
  if (activeRafId !== null) {
    cancelAnimationFrame(activeRafId);
    activeRafId = null;
  }
  if (cleanupInterrupt) {
    cleanupInterrupt();
    cleanupInterrupt = null;
  }
}

export function getScrollTop(): number {
  const scroller = document.scrollingElement || document.documentElement;
  return scroller.scrollTop || window.scrollY || 0;
}

export function smoothScrollToY(targetY: number, durationMs = 580): void {
  if (typeof window === 'undefined') return;
  cancelSmoothScroll();

  const scroller = document.scrollingElement || document.documentElement;
  const maxScroll = Math.max(0, scroller.scrollHeight - window.innerHeight);
  const clampedTarget = Math.max(0, Math.min(Math.round(targetY), maxScroll));
  const startY = getScrollTop();
  const delta = clampedTarget - startY;

  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || Math.abs(delta) < 2 || durationMs <= 0) {
    scroller.scrollTop = clampedTarget;
    window.scrollTo(0, clampedTarget);
    return;
  }

  const onUserInterrupt = () => cancelSmoothScroll();
  const onKeyInterrupt = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space', 'Home', 'End'].includes(e.code)) {
      cancelSmoothScroll();
    }
  };

  window.addEventListener('wheel', onUserInterrupt, { passive: true });
  window.addEventListener('touchstart', onUserInterrupt, { passive: true });
  window.addEventListener('keydown', onKeyInterrupt, { passive: true });

  cleanupInterrupt = () => {
    window.removeEventListener('wheel', onUserInterrupt);
    window.removeEventListener('touchstart', onUserInterrupt);
    window.removeEventListener('keydown', onKeyInterrupt);
  };

  const startTime = performance.now();
  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    // Cubic ease-out matching LUCIAN_EASE feel
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextY = startY + delta * eased;

    scroller.scrollTop = nextY;
    window.scrollTo(0, nextY);

    if (progress < 1) {
      activeRafId = requestAnimationFrame(step);
    } else {
      scroller.scrollTop = clampedTarget;
      window.scrollTo(0, clampedTarget);
      cancelSmoothScroll();
    }
  };

  activeRafId = requestAnimationFrame(step);
}

export function scrollToElementById(id: string, offsetPx = 64, durationMs = 560): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  const top = target.getBoundingClientRect().top + getScrollTop() - offsetPx;
  smoothScrollToY(top, durationMs);
  return true;
}

export function requestLandingBay(bayIdx: number): void {
  pendingTarget = { type: 'bay', bayIdx };
  window.dispatchEvent(new CustomEvent('hanzi:goto-bay', { detail: { bayIdx } }));
}

export function requestLandingSection(id: string, offsetPx = 64): void {
  pendingTarget = { type: 'section', id, offsetPx };
  if (scrollToElementById(id, offsetPx)) {
    pendingTarget = null;
  }
}

export function consumePendingLandingTarget(): PendingLandingTarget {
  const next = pendingTarget;
  pendingTarget = null;
  return next;
}
