import React from 'react';
import { cn } from '../../lib/cn';

interface BorderBeamProps {
  className?: string;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

/**
 * Magic UI-inspired animated luminous gradient border beam (pure GPU CSS, zero lag)
 */
export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  duration = 6,
  colorFrom = '#f43f5e',
  colorTo = '#f59e0b',
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] p-[1.5px] overflow-hidden',
        className
      )}
      style={{
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    >
      <div
        className="absolute inset-[-100%] animate-spin"
        style={{
          animationDuration: `${duration}s`,
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 220deg, ${colorFrom} 280deg, #d946ef 315deg, ${colorTo} 345deg, transparent 360deg)`,
        }}
      />
    </div>
  );
};
