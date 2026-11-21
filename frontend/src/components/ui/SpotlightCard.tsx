import React, { useRef } from 'react';
import { cn } from '../../lib/cn';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark';
  spotlightColor?: string;
  children: React.ReactNode;
}

/**
 * Zero-re-render GPU-accelerated Liquid Glass Spotlight Card (uses CSS vars via ref -> 60fps silky smooth!)
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  variant = 'light',
  spotlightColor,
  className,
  children,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const defaultGlow =
    variant === 'dark' ? 'rgba(244, 63, 94, 0.24)' : 'rgba(244, 63, 94, 0.14)';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        'group/spot relative overflow-hidden rounded-[26px]',
        variant === 'dark' ? 'glass-dark glass-dark-hover' : 'glass-light glass-light-hover',
        className
      )}
      {...props}
    >
      {/* Subtle Top Liquid Refraction Rim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent"
      />
      {/* Pure CSS-var mouse spotlight (0 React re-renders!) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover/spot:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), ${
            spotlightColor || defaultGlow
          }, transparent 68%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
