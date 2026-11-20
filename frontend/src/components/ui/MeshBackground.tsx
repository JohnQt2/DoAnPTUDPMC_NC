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
      <div className={cn('relative min-h-screen bg-[#141112] text-white overflow-x-clip', className)}>
        <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn('relative min-h-screen bg-[#FAF8F6] text-[#181415] overflow-x-clip', className)}>
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
};
