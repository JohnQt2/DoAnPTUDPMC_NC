import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import type { CelebrationPayload } from '../../lib/celebration';

export const CelebrationOverlay: React.FC = () => {
  const [active, setActive] = useState<CelebrationPayload | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<CelebrationPayload>).detail;
      setActive(payload);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setActive(null), 2600);
    };

    window.addEventListener('hanzi-celebrate', handler);
    return () => {
      window.removeEventListener('hanzi-celebrate', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col items-end"
    >
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="liquid-toast rounded-xl px-4 py-3 flex items-center gap-3 max-w-sm"
          >
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" strokeWidth={2.75} />
            </span>
            <div className="min-w-0 leading-snug">
              <p className="text-[13px] font-semibold text-white">{active.message}</p>
              {active.subtext && (
                <p className="text-[11.5px] text-zinc-400 mt-0.5 truncate">{active.subtext}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
