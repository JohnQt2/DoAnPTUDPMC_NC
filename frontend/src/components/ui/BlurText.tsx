import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const BlurText: React.FC<BlurTextProps> = ({ text, className, delay = 0 }) => {
  const words = text.split(' ');

  return (
    <span className={cn('inline-flex flex-wrap gap-x-[0.28em] gap-y-1', className)}>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{
            duration: 0.45,
            delay: delay + idx * 0.055,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};
