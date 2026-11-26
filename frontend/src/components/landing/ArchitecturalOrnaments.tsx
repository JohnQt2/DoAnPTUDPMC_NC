import React from 'react';
import { cn } from '../../lib/cn';
import { HanziLogoMark } from '../HanziLogo';

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
 * HoYoverse /vi/home Inspired Afternoon Sunbeams & Floating Golden Dust Motes (斜阳丁达尔光束 & 浮尘).
 * Controlled at 120fps via refs (`beamRef` & `dustRef`) for zero-React-rerender 2.5D mouse parallax!
 */
const DUST_MOTES = [
  { left: '18%', top: '22%', size: 3.5, delay: '0s', duration: '5.5s', opacity: 0.65 },
  { left: '29%', top: '38%', size: 2.5, delay: '1.1s', duration: '4.8s', opacity: 0.5 },
  { left: '42%', top: '16%', size: 4.0, delay: '0.6s', duration: '6.2s', opacity: 0.7 },
  { left: '54%', top: '32%', size: 3.0, delay: '1.8s', duration: '5.1s', opacity: 0.6 },
  { left: '64%', top: '24%', size: 4.5, delay: '0.3s', duration: '6.8s', opacity: 0.75 },
  { left: '73%', top: '46%', size: 2.8, delay: '2.1s', duration: '5.4s', opacity: 0.55 },
  { left: '82%', top: '19%', size: 3.6, delay: '0.9s', duration: '5.9s', opacity: 0.68 },
  { left: '48%', top: '58%', size: 3.2, delay: '1.5s', duration: '6.4s', opacity: 0.52 },
  { left: '68%', top: '66%', size: 3.8, delay: '0.4s', duration: '5.7s', opacity: 0.62 },
  { left: '86%', top: '54%', size: 2.6, delay: '2.4s', duration: '4.9s', opacity: 0.48 },
  { left: '35%', top: '72%', size: 3.0, delay: '1.2s', duration: '6.0s', opacity: 0.45 },
  { left: '59%', top: '44%', size: 4.2, delay: '0.7s', duration: '5.3s', opacity: 0.72 },
];

export const SunbeamDustOverlay: React.FC<{
  beamRef?: React.RefObject<HTMLDivElement>;
  dustRef?: React.RefObject<HTMLDivElement>;
}> = ({ beamRef, dustRef }) => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
    {/* Layer 2: Diagonal Afternoon Window Sunbeams (Tyndall Effect) */}
    <div
      ref={beamRef}
      className="absolute -inset-24 will-change-transform"
      style={{
        background:
          'linear-gradient(122deg, rgba(255,244,214,0) 14%, rgba(255,241,202,0.34) 26%, rgba(255,248,225,0.06) 36%, rgba(255,239,196,0.42) 48%, rgba(255,246,218,0.12) 58%, rgba(255,241,200,0.3) 68%, rgba(255,244,214,0) 82%)',
        mixBlendMode: 'soft-light',
      }}
    />

    {/* Subtle warm sunlight vignette from upper-right window */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 68% 54% at 78% 12%, rgba(255, 236, 189, 0.36) 0%, rgba(255, 236, 189, 0.08) 48%, transparent 78%)',
      }}
    />

    {/* Layer 3: Floating Golden Sunlit Dust Motes */}
    <div ref={dustRef} className="absolute -inset-12 will-change-transform">
      {DUST_MOTES.map((m, idx) => (
        <span
          key={idx}
          className="absolute rounded-full animate-pulse"
          style={{
            left: m.left,
            top: m.top,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            animationDelay: m.delay,
            animationDuration: m.duration,
            background:
              'radial-gradient(circle, rgba(255,252,235,0.98) 0%, rgba(235,192,94,0.65) 55%, rgba(235,192,94,0) 100%)',
            boxShadow: '0 0 10px 2px rgba(242, 201, 76, 0.45)',
          }}
        />
      ))}
    </div>
  </div>
);

/**
 * Refined HoYoverse-Caliber Loading Screen with Imperial Crimson Seal,
 * Golden Astrolabe Ring, and Classical Study Motto.
 */
export const HanziLoadingScreen: React.FC<{
  visible?: boolean;
  progress?: number;
  subtitle?: string;
}> = ({
  visible = true,
  progress = 100,
  subtitle = '千里之行，始于足下 · Hành trình vạn dặm bắt đầu từ nét chữ đầu tiên',
}) => (
  <div
    aria-hidden={!visible}
    className={`fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#F5F2EC] dark:bg-[#0c111b] text-[#1C1917] dark:text-slate-100 select-none transition-all duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
      visible
        ? 'opacity-100 scale-100 pointer-events-auto'
        : 'opacity-0 scale-[1.045] pointer-events-none'
    }`}
  >
    {/* Warm afternoon radial glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 dark:opacity-45"
      style={{
        background:
          'radial-gradient(circle at 50% 44%, rgba(212, 160, 23, 0.14) 0%, rgba(196, 30, 58, 0.05) 36%, rgba(245, 242, 236, 0) 70%)',
      }}
    />
    <ArchitecturalBlueprintGrid className="opacity-70 dark:opacity-20" />

    <div className="relative z-10 flex flex-col items-center px-5 text-center">
      {/* Animated Golden-Crimson Astrolabe & Seal Ring */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4 sm:mb-5">
        <svg
          viewBox="0 0 120 120"
          className="pointer-events-none absolute inset-0 w-full h-full animate-[spin_14s_linear_infinite]"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.14"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="#C41E3A"
            strokeOpacity="0.5"
            strokeWidth="1.4"
            strokeDasharray="72 24"
            strokeLinecap="round"
          />
          <circle cx="60" cy="6" r="2.2" fill="#C41E3A" />
          <circle cx="60" cy="114" r="2.2" fill="#D4A017" />
        </svg>

        <div className="relative p-2 sm:p-2.5 rounded-2xl bg-white/85 dark:bg-[#141c2b]/90 border border-[#1C1917]/12 dark:border-white/12 shadow-[0_16px_36px_-12px_rgba(196,30,58,0.28)]">
          <HanziLogoMark variant="light" className="w-12 h-12 sm:w-14 sm:h-14" />
        </div>
      </div>

      {/* Brand Title & Academic Kicker */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="font-display font-extrabold text-xl sm:text-[26px] tracking-[-0.03em] text-[#1C1917] dark:text-white">
          Hanzi<span className="text-[#C41E3A] dark:text-rose-400">4U</span>
        </div>
        <p className="font-mono text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#C41E3A] dark:text-rose-400">
          HỌC TIẾNG TRUNG CHUẨN HSK 1 — 6
        </p>
      </div>

      {/* Delicate Diamond-Tipped Progress Line with Live Shimmer */}
      <div className="mt-5 mb-2.5 sm:mt-6 sm:mb-3 flex items-center gap-2.5 w-48 sm:w-60">
        <span className="text-[8px] text-[#C41E3A]">◆</span>
        <div className="relative flex-1 h-[2.5px] bg-[#1C1917]/12 dark:bg-white/12 overflow-hidden rounded-full">
          <div
            className="relative h-full bg-gradient-to-r from-[#C41E3A] via-[#D4A017] to-[#C41E3A] transition-all duration-300 ease-out overflow-hidden"
            style={{ width: `${Math.min(100, Math.max(25, progress))}%` }}
          >
            <span className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </div>
        </div>
        <span className="text-[8px] text-[#D4A017]">◆</span>
      </div>

      <p className="text-[10.5px] sm:text-xs font-hanzi-serif text-[#57534E] dark:text-slate-400 tracking-wide max-w-[280px] sm:max-w-sm leading-relaxed">
        {subtitle}
      </p>
    </div>
  </div>
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
    {/* Subtle 8px architectural L-brackets in Imperial Crimson (!mt-0 protects against parent space-y-*) */}
    <span aria-hidden="true" className="pointer-events-none !mt-0 absolute -top-px -left-px w-2.5 h-2.5 border-t-2 border-l-2 border-[#C41E3A]" />
    <span aria-hidden="true" className="pointer-events-none !mt-0 absolute -top-px -right-px w-2.5 h-2.5 border-t-2 border-r-2 border-[#C41E3A]" />
    <span aria-hidden="true" className="pointer-events-none !mt-0 absolute -bottom-px -left-px w-2.5 h-2.5 border-b-2 border-l-2 border-[#C41E3A]" />
    <span aria-hidden="true" className="pointer-events-none !mt-0 absolute -bottom-px -right-px w-2.5 h-2.5 border-b-2 border-r-2 border-[#C41E3A]" />
    <div className="relative z-10 !mt-0">{children}</div>
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
    <div className="flex flex-wrap items-baseline justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3 px-0.5">
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3">
        <span className="font-mono text-[9.5px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C41E3A]">
          {chapterLabel}
        </span>
        <h2 className="font-display font-bold text-[17px] leading-snug sm:text-2xl tracking-tight text-[#1C1917]">
          {title}
        </h2>
      </div>
      <span className="hidden sm:block h-px flex-1 max-w-[180px] bg-[#1C1917]/15 ml-4" />
    </div>

    {/* Clean 1px Exhibition Matting */}
    <div className="relative p-1.5 sm:p-2 bg-[#FCFBF8] border border-[#1C1917]/15 shadow-[0_24px_60px_-28px_rgba(28,25,23,0.22)]">
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
    className="group relative w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border bg-white shadow-xs transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
    style={{ borderColor: active ? accentColor : 'rgba(28, 25, 23, 0.2)' }}
  >
    <span
      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors"
      style={{
        backgroundColor: active ? accentColor : `${accentColor}14`,
        color: active ? '#FFFFFF' : accentColor,
      }}
    >
      <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-3.5 sm:h-3.5 translate-x-[1px] fill-current">
        <path d="M6 4l14 8-14 8V4z" />
      </svg>
    </span>
  </button>
);

/**
 * Minimal 3-Bar Audio Indicator for top-right BGM toggle button.
 * Gently animates bar heights when chill ambient music is playing.
 */
export const EqualizerBars: React.FC<{ active: boolean }> = ({ active }) => (
  <span className="relative inline-flex items-end gap-[2.5px] h-3.5" aria-hidden="true">
    <span
      className={`w-[2px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-3.5 animate-[pulse_1.1s_ease-in-out_infinite]' : 'h-1.5 opacity-40'
      }`}
    />
    <span
      className={`w-[2px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-2.5 animate-[pulse_0.85s_ease-in-out_0.25s_infinite]' : 'h-2 opacity-40'
      }`}
    />
    <span
      className={`w-[2px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-3 animate-[pulse_1.25s_ease-in-out_0.45s_infinite]' : 'h-1.5 opacity-40'
      }`}
    />
    {!active && (
      <span className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[1.5px] -rotate-45 bg-[#C41E3A] rounded-full" />
    )}
  </span>
);
