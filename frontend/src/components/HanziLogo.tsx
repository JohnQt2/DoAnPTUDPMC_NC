import React from 'react';
import { cn } from '../lib/cn';

interface HanziLogoProps {
  /** 'dark' for deep obsidian lacquer surfaces; 'light' for crisp porcelain surfaces */
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}

/**
 * Hanzi4U Signature Imperial Crimson Seal Mark (印章):
 * Original architectural Chinese scholar stamp in Imperial Crimson (#C41E3A)
 * framed with an inlaid gold lacquer hairline (#D4A017), geometric corner notch,
 * and sculptural serif Hanzi '汉'.
 */
export const HanziLogoMark: React.FC<{
  variant?: 'dark' | 'light';
  className?: string;
}> = ({ variant = 'light', className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('shrink-0', className)}
    aria-hidden="true"
  >
    {/* Deep Imperial Crimson Seal Body */}
    <rect
      x="3"
      y="3"
      width="58"
      height="58"
      rx="14"
      fill="#C41E3A"
      stroke={variant === 'dark' ? 'rgba(212,160,23,0.65)' : 'rgba(158,22,46,0.35)'}
      strokeWidth="1.5"
    />
    {/* Subtle top specular edge */}
    <path
      d="M16 5.5H48"
      stroke="rgba(255,255,255,0.38)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    {/* Inlaid Gold Lacquer Inner Seal Frame */}
    <rect
      x="8.5"
      y="8.5"
      width="47"
      height="47"
      rx="9.5"
      stroke="#E6BE4C"
      strokeOpacity="0.62"
      strokeWidth="1.3"
    />
    {/* Tiny Gold Corner Accents (traditional Chinese lacquer joinery) */}
    <circle cx="14" cy="14" r="1.4" fill="#F2D16B" />
    <circle cx="50" cy="50" r="1.4" fill="#F2D16B" />
    {/* Sculptural Calligraphic '汉' */}
    <text
      x="32"
      y="41.5"
      textAnchor="middle"
      fill="#FFFFFF"
      fontSize="30"
      fontWeight="700"
      style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
    >
      汉
    </text>
  </svg>
);

export const HanziLogo: React.FC<HanziLogoProps> = ({
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  subtitle = 'HỌC TIẾNG TRUNG HSK',
  className = '',
}) => {
  const isDark = variant === 'dark';
  const markSize = { sm: 'w-8 h-8', md: 'w-9 h-9', lg: 'w-11 h-11' }[size];
  const titleSize = { sm: 'text-[15px]', md: 'text-[18px]', lg: 'text-[22px]' }[size];
  const subSize = { sm: 'text-[8.5px]', md: 'text-[9.5px]', lg: 'text-[10.5px]' }[size];

  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <HanziLogoMark variant={variant} className={markSize} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display font-extrabold tracking-[-0.03em]',
            titleSize,
            isDark ? 'text-white' : 'text-[#181415]'
          )}
        >
          Hanzi
          <span className={isDark ? 'text-[#E6BE4C]' : 'text-[#C41E3A]'}>4U</span>
        </span>
        {showSubtitle && (
          <span
            className={cn(
              'font-mono font-semibold uppercase tracking-[0.18em] mt-1',
              subSize,
              isDark ? 'text-white/55' : 'text-[#5F5658]'
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
};
