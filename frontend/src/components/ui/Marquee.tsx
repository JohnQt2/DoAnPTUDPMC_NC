import React from 'react';
import { cn } from '../../lib/cn';

interface MarqueeProps {
  children: React.ReactNode;
  reverse?: boolean;
  className?: string;
  fadeColor?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  children,
  reverse = false,
  className,
  fadeColor = '#14080c',
}) => {
  return (
    <div className={cn('group relative flex overflow-hidden select-none', className)}>
      {/* Edge fade masks */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 z-10"
        style={{ background: `linear-gradient(to right, ${fadeColor}, transparent)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 z-10"
        style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }}
      />

      <div
        className={cn(
          'flex shrink-0 items-center gap-4 w-max',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee'
        )}
      >
        <div className="flex shrink-0 items-center gap-4">{children}</div>
        <div className="flex shrink-0 items-center gap-4" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
};
