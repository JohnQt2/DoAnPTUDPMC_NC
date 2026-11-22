import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  routeKey: string;
  children: React.ReactNode;
}

/**
 * Soft, silky page transition:
 * - Whisper-thin pastel top shimmer sweep on navigation
 * - Gentle 8px vertical glide + opacity ease (pure GPU transform, zero layout shift)
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ routeKey, children }) => {
  return (
    <>
      <motion.div
        key={`bar-${routeKey}`}
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 0.9 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '0% 50%' }}
        className="pointer-events-none fixed top-0 left-0 right-0 z-[90] h-[2.5px] bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#C41E3A]"
      />
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
};
