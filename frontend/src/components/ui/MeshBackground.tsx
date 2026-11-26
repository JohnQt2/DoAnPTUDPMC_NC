import React from 'react';
import { cn } from '../../lib/cn';

interface MeshBackgroundProps {
  variant?: 'dark' | 'light';
  showHanzi?: boolean;
  className?: string;
  children: React.ReactNode;
}

const DECORATIVE_HANZI = [
  { ch: '学', style: { top: '6%', left: '4%', fontSize: '7.5rem', opacity: 0.065 } },
  { ch: '汉', style: { top: '14%', right: '5%', fontSize: '9.5rem', opacity: 0.055 } },
  { ch: '语', style: { top: '55%', left: '2%', fontSize: '8.5rem', opacity: 0.055 } },
  { ch: '字', style: { bottom: '7%', right: '4%', fontSize: '10rem', opacity: 0.05 } },
  { ch: '中', style: { bottom: '28%', left: '8%', fontSize: '6.5rem', opacity: 0.065 } },
  { ch: '文', style: { top: '70%', right: '11%', fontSize: '7rem', opacity: 0.055 } },
];

export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  variant = 'dark',
  showHanzi = true,
  className,
  children,
}) => {
  if (variant === 'light') {
    return (
      <div className={cn('relative h-full min-h-0 overflow-hidden workspace-mesh-bg', className)}>
        <div className="relative z-10 flex h-full min-h-0 w-full overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Dark variant – keep same height‑chain logic as light.
  return (
    <div className={cn('relative h-full min-h-0 overflow-hidden bg-[#120714] text-white', className)}>
      {/* Vibrant Static Multi‑Hue Asian Aurora Backdrop (120fps smooth behind Liquid Glass!) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: '#120714',
          backgroundImage:
            'radial-gradient(ellipse 55% 48% at 10% 8%, rgba(244, 63, 94, 0.36) 0%, transparent 62%), radial-gradient(ellipse 50% 45% at 92% 18%, rgba(168, 85, 247, 0.30) 0%, transparent 60%), radial-gradient(ellipse 52% 48% at 50% 94%, rgba(245, 158, 11, 0.25) 0%, transparent 62%), radial-gradient(ellipse 46% 42% at 86% 84%, rgba(6, 182, 212, 0.24) 0%, transparent 60%)',
        }}
      />

      {/* Subtle Luminous Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.45) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating Decorative Chinese Characters */}
      {showHanzi && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none overflow-hidden"
        >
          {DECORATIVE_HANZI.map(({ ch, style }) => (
            <span
              key={ch}
              className="absolute font-hanzi-serif font-black bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent leading-none"
              style={style}
            >
              {ch}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 flex h-full min-h-0 w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};
