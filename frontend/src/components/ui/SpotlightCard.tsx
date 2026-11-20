import React from 'react';
import { cn } from '../../lib/cn';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  spotlightColor?: string;
  children: React.ReactNode;
}

/**
 * Minimalist 2026 Architectural Card (replaces neon mouse-tracking glow with quiet hairline precision)
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  variant = 'light',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        variant === 'dark' ? 'glass-dark glass-dark-hover' : 'glass-light glass-light-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
