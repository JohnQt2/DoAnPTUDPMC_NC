import React from 'react';
import { cn } from '../lib/cn';

interface HanziLogoProps {
  /** 'dark' = light ivory + gold logo on dark #1F3A2E header/footer; 'light' = forest jade + cinnabar on warm #F3ECDC paper */
  variant?: 'dark' | 'light';
  showSubtitle?: boolean;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Bespoke Hanzi4U Architectural Scholar Crest:
 * Combines a geometric Suzhou diamond lattice frame, open study book contour,
 * and traditional Hanzi seal calligraphy mark ('汉').
 */
export const HanziLogoMark: React.FC<{
  variant?: 'dark' | 'light';
  className?: string;
}> = ({ variant = 'dark', className = 'w-9 h-9' }) => {
  const isDark = variant === 'dark';
  const strokeMain = isDark ? '#FBF7EC' : '#1F3A2E';
  const strokeAccent = isDark ? '#D4B26A' : '#B08D3C';
  const sealBg = isDark ? '#7A2E2B' : '#7A2E2B';
  const fillInner = isDark ? 'rgba(251, 247, 236, 0.08)' : 'rgba(31, 58, 46, 0.05)';

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      {/* Outer Scholar Diamond Crest */}
      <path
        d="M24 3L45 24L24 45L3 24L24 3Z"
        fill={fillInner}
        stroke={strokeAccent}
        strokeWidth="1.4"
      />
      {/* Inner Octagonal Hairline */}
      <path
        d="M24 7.2L40.8 24L24 40.8L7.2 24L24 7.2Z"
        stroke={strokeMain}
        strokeWidth="0.9"
        strokeOpacity="0.45"
      />
      {/* Open Scholar Book Pages Base */}
      <path
        d="M14.5 29.5C17.8 27.9 21.2 27.9 24 29.8C26.8 27.9 30.2 27.9 33.5 29.5"
        stroke={strokeAccent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 29.8V35.2"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Cinnabar Scholar Seal Dot at Crown */}
      <circle cx="24" cy="11.2" r="2.1" fill={sealBg} stroke={strokeAccent} strokeWidth="0.8" />
      {/* Calligraphic '汉' Glyph */}
      <text
        x="24"
        y="25.5"
        textAnchor="middle"
        fill={strokeMain}
        fontFamily='"Noto Serif SC", "Songti SC", serif'
        fontWeight="700"
        fontSize="14.5"
      >
        汉
      </text>
    </svg>
  );
};

export const HanziLogo: React.FC<HanziLogoProps> = ({
  variant = 'dark',
  showSubtitle = true,
  subtitle = 'HỌC VIỆN HÁN NGỮ',
  size = 'md',
  className,
}) => {
  const isDark = variant === 'dark';

  const markSize = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  const titleSize = {
    sm: 'text-[16px]',
    md: 'text-[18px]',
    lg: 'text-[21px]',
  }[size];

  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <HanziLogoMark variant={variant} className={markSize} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-editorial font-bold tracking-[0.06em] uppercase',
            titleSize,
            isDark ? 'text-[#FBF7EC]' : 'text-[#1F3A2E]'
          )}
        >
          HANZI<span className={isDark ? 'text-[#D4B26A]' : 'text-[#7A2E2B]'}>4U</span>
        </span>
        {showSubtitle && (
          <span
            className={cn(
              'text-[9px] font-sans font-semibold tracking-[0.22em] uppercase mt-1',
              isDark ? 'text-[#B08D3C]' : 'text-[#6B5B4B]'
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
};
