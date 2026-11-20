import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Subtle Architectural Editorial Folio Lines:
 * Whisper-thin 1px drafting curves and registration ticks etched onto warm Xuan rice paper.
 * Gives full-viewport pages the tactile calm of a printed Chinese typography monograph.
 */
export const ArchitecturalBlueprintGrid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    aria-hidden="true"
    className={cn('pointer-events-none absolute inset-0 w-full h-full select-none', className)}
  >
    <g stroke="#1C1917" strokeOpacity="0.075" strokeWidth="1">
      <path d="M 0 320 Q 330 430 410 900" />
      <line x1="84" y1="0" x2="84" y2="900" />
      <line x1="84" y1="742" x2="1440" y2="742" strokeOpacity="0.06" />
      <path d="M 520 900 V 610 Q 520 568 562 568 H 1040 Q 1082 568 1082 526 V 340" />
    </g>
    <g fill="#1C1917" fillOpacity="0.16">
      <circle cx="84" cy="148" r="1.5" />
      <circle cx="84" cy="742" r="1.5" />
      <circle cx="520" cy="610" r="1.5" />
    </g>
  </svg>
);

/**
 * Clean Architectural Hairline Frame (zero game diamonds, zero generic SaaS rounded-2xl cards).
 * Uses razor-thin 1px stone borders with crisp 8px architectural corner L-brackets.
 */
export const EditorialPaperFrame: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={cn(
      'relative border border-[#1C1917]/15 bg-[#FCFBF8]/90 backdrop-blur-md',
      className
    )}
  >
    {/* Subtle 8px architectural L-brackets in Imperial Crimson */}
    <span aria-hidden="true" className="pointer-events-none absolute -top-px -left-px w-2.5 h-2.5 border-t-2 border-l-2 border-[#C41E3A]" />
    <span aria-hidden="true" className="pointer-events-none absolute -top-px -right-px w-2.5 h-2.5 border-t-2 border-r-2 border-[#C41E3A]" />
    <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -left-px w-2.5 h-2.5 border-b-2 border-l-2 border-[#C41E3A]" />
    <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -right-px w-2.5 h-2.5 border-b-2 border-r-2 border-[#C41E3A]" />
    <div className="relative z-10">{children}</div>
  </div>
);

/**
 * Museum Exhibition Gallery Frame (replaces game filigree stars & chains).
 * Clean 1px architectural matting with calm top editorial label breaking the top rule.
 */
export const MuseumExhibitionFrame: React.FC<{
  chapterLabel: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ chapterLabel, title, children, className = '' }) => (
  <div className={cn('relative', className)}>
    {/* Calm Editorial Top Header Bar straddling the gallery frame */}
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3 px-0.5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C41E3A]">
          {chapterLabel}
        </span>
        <h2 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-[#1C1917]">
          {title}
        </h2>
      </div>
      <span className="hidden sm:block h-px flex-1 max-w-[180px] bg-[#1C1917]/15 ml-4" />
    </div>

    {/* Clean 1px Exhibition Matting */}
    <div className="relative p-2 bg-[#FCFBF8] border border-[#1C1917]/15 shadow-[0_24px_60px_-28px_rgba(28,25,23,0.22)]">
      <span aria-hidden="true" className="pointer-events-none absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-[#C41E3A]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-[#C41E3A]" />
      <div className="relative overflow-hidden">{children}</div>
    </div>
  </div>
);

/**
 * Tactile Minimalist Pronunciation Play Button (ceramic ring + crisp play triangle).
 */
export const PronunciationPlayButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  accentColor?: string;
  label?: string;
}> = ({ onClick, active = false, accentColor = '#C41E3A', label = 'Nghe phát âm' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="group relative w-11 h-11 rounded-full flex items-center justify-center border bg-white shadow-xs transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
    style={{ borderColor: active ? accentColor : 'rgba(28, 25, 23, 0.2)' }}
  >
    <span
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      style={{
        backgroundColor: active ? accentColor : `${accentColor}14`,
        color: active ? '#FFFFFF' : accentColor,
      }}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 translate-x-[1px] fill-current">
        <path d="M6 4l14 8-14 8V4z" />
      </svg>
    </span>
  </button>
);

/**
 * Minimal 3-Bar Audio Indicator for top-right utility cluster.
 */
export const EqualizerBars: React.FC<{ active: boolean }> = ({ active }) => (
  <span className="inline-flex items-end gap-[2.5px] h-3.5" aria-hidden="true">
    <span
      className={`w-[2px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-3.5' : 'h-1.5 opacity-45'
      }`}
    />
    <span
      className={`w-[2px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-2' : 'h-2.5 opacity-45'
      }`}
    />
    <span
      className={`w-[2px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-3' : 'h-1.5 opacity-45'
      }`}
    />
  </span>
);
