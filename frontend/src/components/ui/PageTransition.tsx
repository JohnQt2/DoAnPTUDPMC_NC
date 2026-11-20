import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  routeKey: string;
  children: React.ReactNode;
}

/**
 * Crisp 135ms minimalist route fade — zero neon progress bar, zero layout jitter.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ routeKey, children }) => {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};
