import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CelebrationPayload } from '../../lib/celebration';

/**
 * Editorial Magic UI / 21st.dev-inspired Reward Pill:
 * - Animated SVG Path-Draw Checkmark (pathLength 0 -> 1)
 * - Soft Expanding Glass Ripple Ring
 * - Smooth spring enter/exit with zero layout disruption
 */
export const CelebrationOverlay: React.FC = () => {
  const [active, setActive] = useState<CelebrationPayload | null>(null);

  useEffect(() => {
    let timer: any;
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<CelebrationPayload>).detail;
      if (!payload) return;
      setActive(payload);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setActive(null), payload.style === 'fireworks' ? 3200 : 2200);
    };
    window.addEventListener('hanzi-celebrate', handler);
    return () => {
      window.removeEventListener('hanzi-celebrate', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-5 inset-x-0 z-[100] flex justify-center px-4">
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: -18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="liquid-toast relative px-5 py-3 rounded-full flex items-center gap-3.5"
          >
            {/* Animated Emblem + Soft Expanding Radial Ripple */}
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <motion.span
                initial={{ scale: 0.8, opacity: 0.7 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-full border-2 border-rose-400/60"
              />
              <span className="relative z-10 w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 via-rose-500 to-amber-400 text-white flex items-center justify-center shadow-md">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.36, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
              </span>
            </div>

            <div className="pr-1.5">
              <p className="text-sm font-display font-extrabold text-gray-900 leading-tight">
                {active.message}
              </p>
              {active.subtext && (
                <p className="text-[11px] font-medium text-gray-600 mt-0.5">{active.subtext}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
