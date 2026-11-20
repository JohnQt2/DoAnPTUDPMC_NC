import React from 'react';
import { cn } from '../../lib/cn';

interface MeshBackgroundProps {
  variant?: 'dark' | 'light';
  showHanzi?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  variant = 'light',
  className,
  children,
}) => {
  if (variant === 'dark') {
    return (
      <div className={cn('relative min-h-screen bg-[#0B0B0E] text-zinc-100 overflow-x-clip', className)}>
        <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn('relative min-h-screen bg-[#FAFAF9] text-zinc-950 overflow-x-clip', className)}>
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
};
