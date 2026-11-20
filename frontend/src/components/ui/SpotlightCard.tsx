import React from 'react';
import { cn } from '../../lib/cn';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
  spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  variant = 'light',
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
      variant === 'dark'
        ? 'bg-[#141112] border border-white/10 text-white hover:border-[#C41E3A]/45 shadow-[0_18px_46px_-18px_rgba(0,0,0,0.55)]'
        : 'bg-white border border-[#EAE3DE] text-[#181415] hover:border-[#C41E3A]/35 shadow-[0_2px_8px_rgba(24,20,21,0.03)] hover:shadow-[0_14px_32px_-16px_rgba(196,30,58,0.14)]',
      className
    )}
  >
    <div className="relative z-10 h-full">{children}</div>
  </div>
);
