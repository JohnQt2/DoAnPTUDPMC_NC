import React from 'react';
import { cn } from '../../lib/cn';

interface MeshBackgroundProps {
  variant?: 'dark' | 'light';
  showHanzi?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * 2026 Minimalist Executive SaaS Canvas:
 * - Zero distracting floating blobs, zero heavy background WebGL/blur overhead.
 * - Pure alabaster (#FAFAFA) in light mode and crisp obsidian (#09090B) when dark is requested.
 */
export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  variant = 'light',
  className,
  children,
}) => {
  if (variant === 'dark') {
    return (
      <div className={cn('relative min-h-screen bg-[#09090B] text-[#FAFAFA] overflow-x-clip', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('relative min-h-screen bg-[#FAFAFA] text-[#09090B] overflow-x-clip', className)}>
      {children}
    </div>
  );
};
