import React from 'react';
import { cn } from '../../lib/cn';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  variant?: 'light' | 'dark';
  children: React.ReactNode;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  variant = 'light',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative rounded-2xl transition-all duration-200',
        variant === 'dark'
          ? 'bg-[#111114] border border-white/10 hover:border-white/20'
          : 'bg-white border border-zinc-200 hover:border-zinc-300 shadow-[0_1px_2px_rgba(9,9,11,0.03)] hover:shadow-[0_10px_28px_-12px_rgba(9,9,11,0.08)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
