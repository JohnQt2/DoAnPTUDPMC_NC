import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Shared Architectural Stone-Parchment Blueprint Overlay:
 * Razor-thin 1px drafting-compass arcs, quadrant grids, micro-registration crosshairs,
 * and bottom-left margin calibration ticks (giving inner chapters a tactile museum-folio ground
 * rather than flat SaaS containers).
 */
export const ArchitecturalBlueprintGrid: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    aria-hidden="true"
    className={cn('pointer-events-none absolute inset-0 w-full h-full select-none', className)}
  >
    <g stroke="#181415" strokeOpacity="0.11" strokeWidth="1">
      {/* Sweeping left drafting-compass quadrant arc */}
      <path d="M 0 310 Q 340 420 420 900" />
      <path d="M 0 650 Q 95 660 115 900" />

      {/* Left vertical margin structural axis */}
      <line x1="88" y1="0" x2="88" y2="900" />
      <line x1="126" y1="0" x2="88" y2="165" strokeOpacity="0.14" />

      {/* Inner architectural rounded folio rectangle */}
      <path d="M 488 900 V 592 Q 488 548 532 548 H 1045 Q 1085 548 1085 508 V 320" />
      <path d="M 88 730 H 1060 Q 1096 730 1096 766 V 900" />
      <line x1="88" y1="818" x2="1440" y2="818" strokeOpacity="0.09" />

      {/* Upper subtle horizontal calibration line */}
      <line x1="126" y1="112" x2="540" y2="112" strokeOpacity="0.08" />
    </g>

    {/* Micro Registration Crosshairs & Calibration Dots */}
    <g fill="#181415" fillOpacity="0.24">
      <circle cx="88" cy="165" r="2" />
      <circle cx="104" cy="756" r="1.5" />
      <circle cx="104" cy="788" r="1.5" />
      <circle cx="488" cy="592" r="1.5" />
      <rect x="64" y="844" width="10" height="1.5" />
      <rect x="64" y="850" width="10" height="1.5" />
      <rect x="64" y="856" width="10" height="1.5" />
      <rect x="64" y="862" width="10" height="1.5" />
    </g>
  </svg>
);

/**
 * 4-Corner Diamond Crosshair Frame (zero SaaS rounded-2xl border!).
 * Uses razor-thin 1px borders anchored by engraved diamond corner joints.
 */
export const DiamondCrosshairFrame: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={cn(
      'relative border border-[#181415]/20 bg-[#F7F4EF]/80 backdrop-blur-md',
      className
    )}
  >
    {/* Subtle inner hairline inset */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-[5px] border border-[#C41E3A]/15"
    />

    {/* 4 Engraved Corner Crosshair Diamonds */}
    {[
      '-top-[4px] -left-[4px]',
      '-top-[4px] -right-[4px]',
      '-bottom-[4px] -left-[4px]',
      '-bottom-[4px] -right-[4px]',
    ].map((pos, i) => (
      <span
        key={i}
        aria-hidden="true"
        className={`pointer-events-none absolute ${pos} w-2 h-2 rotate-45 bg-[#C41E3A] border border-[#F7F4EF] shadow-xs`}
      />
    ))}

    <div className="relative z-10">{children}</div>
  </div>
);

/**
 * Ornate Gold & Crimson Filigree Cinema Frame with Boundary-Breaking Top Title.
 * Echoes high-craft AAA microsite framing where display typography deliberately breaks
 * through the top frame hairline and delicate diamond garlands anchor all 4 corners.
 */
export const FiligreeCinemaFrame: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = '' }) => (
  <div className={cn('relative pt-7', className)}>
    {/* Boundary-Breaking Engraved Title straddling top frame hairline */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none select-none">
      <div className="flex items-center gap-3 px-6">
        <span className="w-2 h-2 rotate-45 bg-[#D4A017]" />
        <h2
          className="font-display font-extrabold text-2xl sm:text-3xl lg:text-[34px] uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F7ECE6] to-[#D9B8B0] drop-shadow-[0_3px_14px_rgba(20,14,16,0.55)] whitespace-nowrap"
        >
          {title}
        </h2>
        <span className="w-2 h-2 rotate-45 bg-[#D4A017]" />
      </div>
      {subtitle && (
        <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/85 drop-shadow mt-0.5">
          {subtitle}
        </span>
      )}
    </div>

    {/* Main Architectural Frame */}
    <div className="relative border border-[#D4A017]/55 bg-[#141112] shadow-[0_28px_80px_-24px_rgba(20,14,16,0.65)]">
      {/* Secondary outer silver-gold filigree hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[5px] border border-[#C41E3A]/35"
      />

      {/* 4 Ornate Corner Filigree Star Flourishes */}
      {[
        { pos: '-top-[9px] -left-[9px]', rot: '0' },
        { pos: '-top-[9px] -right-[9px]', rot: '90' },
        { pos: '-bottom-[9px] -right-[9px]', rot: '180' },
        { pos: '-bottom-[9px] -left-[9px]', rot: '270' },
      ].map((c, idx) => (
        <svg
          key={idx}
          viewBox="0 0 28 28"
          aria-hidden="true"
          className={`pointer-events-none absolute ${c.pos} w-7 h-7 z-20`}
          style={{ transform: `rotate(${c.rot}deg)` }}
        >
          <path d="M2 24 V6 Q2 2 6 2 H24" stroke="#E6BE4C" strokeWidth="1.6" fill="none" />
          <path d="M6 6 L10 2 L14 6 L10 10 Z" fill="#C41E3A" stroke="#F7E4A3" strokeWidth="1" />
          <circle cx="2" cy="18" r="1.4" fill="#E6BE4C" />
          <circle cx="18" cy="2" r="1.4" fill="#E6BE4C" />
        </svg>
      ))}

      {/* Subtle hanging crystal-gold light dots on upper corners */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-5 w-[1px] h-14 bg-gradient-to-b from-[#E6BE4C]/70 to-transparent z-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-5 w-[1px] h-14 bg-gradient-to-b from-[#E6BE4C]/70 to-transparent z-20"
      />

      <div className="relative z-10 overflow-hidden">{children}</div>
    </div>
  </div>
);

/**
 * Bespoke 4-Petal Lotus / Seal Audio Emblem (replaces generic SaaS speaker icons).
 */
export const LotusVoiceButton: React.FC<{
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
    className="group relative w-12 h-12 flex items-center justify-center cursor-pointer focus-visible:outline-none shrink-0"
  >
    <svg viewBox="0 0 56 56" className="w-12 h-12 transition-transform duration-300 group-hover:scale-105">
      {/* Outer 4-petal sacred Chinese lattice */}
      <g
        stroke={accentColor}
        strokeWidth="1.6"
        fill={active ? `${accentColor}24` : 'rgba(255,255,255,0.45)'}
      >
        <circle cx="28" cy="16" r="9.5" />
        <circle cx="28" cy="40" r="9.5" />
        <circle cx="16" cy="28" r="9.5" />
        <circle cx="40" cy="28" r="9.5" />
      </g>
      <circle cx="28" cy="28" r="10" fill="#FFFFFF" stroke={accentColor} strokeWidth="1.4" />
      {/* Play triangle */}
      <path d="M25.5 23.5 L33 28 L25.5 32.5 Z" fill={accentColor} />
    </svg>
    {active && (
      <span
        className="pointer-events-none absolute inset-0 rounded-full animate-ping opacity-35"
        style={{ border: `1.5px solid ${accentColor}` }}
      />
    )}
  </button>
);

/**
 * Compact 3-Bar Animated Audio Equalizer Icon for the floating Top-Right HUD.
 */
export const EqualizerBars: React.FC<{ active: boolean }> = ({ active }) => (
  <span className="inline-flex items-end gap-[2.5px] h-3.5" aria-hidden="true">
    <span
      className={`w-[2.5px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-3.5 animate-pulse' : 'h-1.5 opacity-60'
      }`}
    />
    <span
      className={`w-[2.5px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-2.5 animate-pulse' : 'h-2.5 opacity-60'
      }`}
      style={{ animationDelay: '120ms' }}
    />
    <span
      className={`w-[2.5px] rounded-full bg-current transition-all duration-300 ${
        active ? 'h-3 animate-pulse' : 'h-1.5 opacity-60'
      }`}
      style={{ animationDelay: '240ms' }}
    />
  </span>
);
