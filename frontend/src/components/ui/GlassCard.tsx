import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/cn';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'light' | 'dark';
  hoverable?: boolean;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'light',
  hoverable = false,
  className,
  children,
  ...props
}) => {
  return (
    <motion.div
      className={cn(
        'rounded-3xl',
        variant === 'dark' ? 'glass-dark' : 'glass-light',
        hoverable && (variant === 'dark' ? 'glass-dark-hover' : 'glass-light-hover'),
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
