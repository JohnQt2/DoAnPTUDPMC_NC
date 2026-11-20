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
        'relative rounded-[10px] transition-all duration-200',
        variant === 'dark'
          ? 'bg-[#1E1610] border border-[#DECFAA]/20 hover:border-[#B08D3C]/50'
          : 'bg-[#FBF7EC] border border-[#DECFAA] hover:border-[#B08D3C] shadow-[0_2px_8px_rgba(42,33,24,0.04)] hover:shadow-[0_10px_28px_-12px_rgba(42,33,24,0.12)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
