import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import type { CelebrationPayload } from '../../lib/celebration';

/**
 * Executive Minimalist Toast Notification (Linear / Vercel / Stripe style):
 * Deep charcoal pill, crisp jade check indicator, zero gaudy ripple/firework clutter.
 */
export const CelebrationOverlay: React.FC = () => {
  const [active, setActive] = useState<CelebrationPayload | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<CelebrationPayload>).detail;
      if (!payload) return;
      setActive(payload);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setActive(null), 2400);
    };
    window.addEventListener('hanzi-celebrate', handler);
    return () => {
      window.removeEventListener('hanzi-celebrate', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex justify-end px-4">
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="liquid-toast px-4 py-3 rounded-xl flex items-center gap-3 max-w-sm"
          >
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white leading-snug">{active.message}</p>
              {active.subtext && (
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{active.subtext}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
