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

const LIGHT_WALLPAPER_HANZI = [
  { ch: '汉', style: { top: '8%', left: '19%', fontSize: '13rem' }, color: 'text-rose-400/[0.11]' },
  { ch: '语', style: { top: '36%', right: '7%', fontSize: '14rem' }, color: 'text-violet-400/[0.10]' },
  { ch: '学', style: { bottom: '8%', left: '34%', fontSize: '13.5rem' }, color: 'text-sky-400/[0.11]' },
  { ch: '智', style: { top: '64%', left: '8%', fontSize: '11rem' }, color: 'text-amber-400/[0.11]' },
];

export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  variant = 'dark',
  showHanzi = true,
  className,
  children,
}) => {
  if (variant === 'light') {
    return (
      <div className={cn('relative min-h-screen overflow-x-clip', className)}>
        {/* Global SVG Optical Refraction Filter (iOS 26 / 21st.dev Liquid Glass Lens Distortion) */}
        <svg
          aria-hidden="true"
          className="pointer-events-none fixed w-0 h-0 overflow-hidden"
          style={{ position: 'fixed', width: 0, height: 0 }}
        >
          <defs>
            <filter id="ios-liquid-refraction" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.015"
                numOctaves="2"
                seed="7"
                result="lensNoise"
              />
              <feGaussianBlur in="lensNoise" stdDeviation="8" result="smoothLens" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="smoothLens"
                scale="14"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* iPhone iOS 26 Luminous Aurora Wallpaper Layer (sits behind transparent Liquid Glass UI) */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden workspace-mesh-bg"
        >
          {/* Orb 1: Sakura Coral-Rose (behind top-left Sidebar & Hero left) */}
          <div
            className="absolute -top-20 -left-12 w-[540px] h-[480px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(251, 113, 133, 0.46) 0%, rgba(244, 114, 182, 0.22) 45%, transparent 72%)',
            }}
          />
          {/* Orb 2: Warm Sunset Apricot-Gold (behind Hero right & top cards) */}
          <div
            className="absolute -top-16 right-[-4%] w-[560px] h-[500px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(251, 191, 36, 0.42) 0%, rgba(253, 186, 116, 0.24) 46%, transparent 72%)',
            }}
          />
          {/* Orb 3: Iridescent Lavender-Violet Ribbon (center-screen behind bento cards) */}
          <div
            className="absolute top-[26%] left-[24%] w-[680px] h-[560px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(167, 139, 250, 0.42) 0%, rgba(232, 121, 249, 0.20) 48%, transparent 74%)',
            }}
          />
          {/* Orb 4: Crystal Ice-Cyan (behind lower Sidebar & mid-left cards) */}
          <div
            className="absolute bottom-[-8%] left-[4%] w-[560px] h-[500px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(56, 189, 248, 0.40) 0%, rgba(125, 211, 252, 0.22) 48%, transparent 72%)',
            }}
          />
          {/* Orb 5: Fresh Mint-Jade (behind bottom-right cards) */}
          <div
            className="absolute bottom-[-6%] right-[4%] w-[540px] h-[480px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(52, 211, 153, 0.38) 0%, rgba(110, 231, 183, 0.20) 46%, transparent 72%)',
            }}
          />

          {/* Subtle Wallpaper Hanzi Shapes that visibly refract & blur through transparent glass cards */}
          <div className="absolute inset-0 select-none">
            {LIGHT_WALLPAPER_HANZI.map(({ ch, style, color }) => (
              <span
                key={ch}
                style={style}
                className={cn(
                  'absolute font-hanzi-serif font-black leading-none tracking-tighter',
                  color
                )}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-[#120714] text-white', className)}>
      {/* Vibrant Static Multi-Hue Asian Aurora Backdrop (120fps smooth behind Liquid Glass!) */}
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

      <div className="relative z-10">{children}</div>
    </div>
  );
};
