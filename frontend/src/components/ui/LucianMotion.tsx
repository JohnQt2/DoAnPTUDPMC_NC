/* Lucian UX/UI Prompt (#001, #216, #372, #379) · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/ */
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Port of Lucian #001 — Pointer-Reactive Magnetic Liquid Glass Button.
 * - Tracks pointer coordinates into --mx / --my for live glass specular reflection
 * - Computes magnetic pull (max 0.16 * delta within 190px radius) respecting prefers-reduced-motion
 */
interface LucianLiquidButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: 'vermilion' | 'glass-dark' | 'glass-light' | 'ink';
  size?: 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export const LucianLiquidButton: React.FC<LucianLiquidButtonProps> = ({
  href,
  onClick,
  variant = 'vermilion',
  size = 'md',
  className,
  children,
  type = 'button',
  disabled = false,
}) => {
  const elRef = useRef<HTMLElement | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (disabled) return;
    const el = elRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
    const my = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
    el.style.setProperty('--mx', `${mx.toFixed(1)}%`);
    el.style.setProperty('--my', `${my.toFixed(1)}%`);

    if (!reduced) {
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const pull = Math.max(0, 1 - Math.hypot(dx, dy) / 190) * 0.16;
      el.style.transform = `translate3d(${(dx * pull).toFixed(2)}px, ${(dy * pull).toFixed(2)}px, 0)`;
    }
  };

  const handlePointerLeave = () => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = 'translate3d(0, 0, 0)';
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '0%');
  };

  const sizeCls = size === 'lg' ? 'px-6 py-3.5 text-sm' : 'px-5 py-2.5 text-xs sm:text-sm';
  const variantCls =
    variant === 'vermilion'
      ? 'bg-[#D93A55] text-white border border-white/25 shadow-[0_12px_28px_-8px_rgba(217,58,85,0.48),inset_0_1.5px_1px_rgba(255,255,255,0.45)]'
      : variant === 'ink'
        ? 'bg-[#16151B] text-[#F4F2EE] border border-white/15 shadow-[0_12px_28px_-10px_rgba(22,21,27,0.4),inset_0_1px_1px_rgba(255,255,255,0.22)]'
        : variant === 'glass-dark'
          ? 'bg-white/[0.08] text-white border border-white/20 backdrop-blur-xl shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45),inset_0_1.5px_1px_rgba(255,255,255,0.35)]'
          : 'bg-white/55 text-[#16151B] border border-white/90 backdrop-blur-xl shadow-[0_10px_26px_-10px_rgba(22,21,27,0.12),inset_0_1.5px_1px_rgba(255,255,255,1)]';

  const baseCls = cn(
    'u001-liquid-btn relative inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-tight overflow-hidden select-none cursor-pointer disabled:opacity-50',
    sizeCls,
    variantCls,
    className
  );

  const inner = (
    <>
      <span aria-hidden="true" className="u001-specular pointer-events-none absolute inset-0 rounded-full" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        ref={(node) => {
          elRef.current = node;
        }}
        href={href}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={baseCls}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={(node) => {
        elRef.current = node;
      }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={baseCls}
    >
      {inner}
    </button>
  );
};

/**
 * Port of Lucian #216 — Editorial Staggered Masked Headline Entrance.
 * Each word glides out from beneath an overflow-hidden baseline mask using --ux-ease (.2, .8, .2, 1).
 */
export const MaskedHeadline: React.FC<{
  lines: string[];
  accentLineIndex?: number;
  className?: string;
}> = ({ lines, accentLineIndex, className }) => {
  let wordCounter = 0;

  return (
    <h1 className={cn('font-display font-extrabold tracking-[-0.03em] leading-[1.08]', className)}>
      {lines.map((line, lIdx) => {
        const words = line.split(' ');
        const isAccent = lIdx === accentLineIndex;
        return (
          <span key={lIdx} className={cn('block', isAccent && 'text-[#D93A55]')}>
            {words.map((word, wIdx) => {
              const delay = 0.05 + wordCounter++ * 0.055;
              return (
                <span key={`${lIdx}-${wIdx}`} className="inline-block overflow-hidden align-bottom mr-[0.24em] last:mr-0 pb-[0.06em]">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '108%', opacity: 0.01 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{ duration: 0.62, delay, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    {word}
                  </motion.span>
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
};

/**
 * Port of Lucian #372 — Fill-to-Level-Up Liquid XP Progress Bar.
 */
export const LucianXpBar: React.FC<{
  current: number;
  target: number;
  label?: string;
  className?: string;
}> = ({ current, target, label = 'Tiến độ chặng hiện tại', className }) => {
  const safeTarget = Math.max(1, target);
  const pct = Math.min(100, Math.round((current / safeTarget) * 100));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#57535F]">{label}</span>
        <span className="font-mono font-bold text-[#16151B] tabular-nums">
          {current} / {safeTarget} bài · {pct}%
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-[#16151B]/[0.07] overflow-hidden border border-white/80">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, pct)}%` }}
          transition={{ duration: 0.85, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative h-full rounded-full bg-gradient-to-r from-[#D93A55] via-[#E85D75] to-[#119C72] overflow-hidden"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent -translate-x-full animate-[shimmer-slide_2.8s_infinite]"
          />
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Port of Lucian #379 — Growing Streak Flame Pill.
 */
export const LucianStreakFlame: React.FC<{
  count: number;
  unit?: string;
  subtitle?: string;
}> = ({ count, unit = 'bài', subtitle = 'Đã hoàn thành' }) => {
  return (
    <div className="ios-glass-pill inline-flex items-center gap-3 px-4 py-2.5 rounded-full">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-8 h-8 rounded-full bg-[#D93A55]/12 border border-[#D93A55]/25 text-[#D93A55] flex items-center justify-center shrink-0"
      >
        <Flame className="w-4 h-4 fill-[#D93A55]/85" />
      </motion.div>
      <div className="leading-tight pr-1">
        <p className="text-sm font-extrabold text-[#16151B] tabular-nums">
          {count} {unit}
        </p>
        <p className="text-[11px] font-medium text-[#57535F]">{subtitle}</p>
      </div>
    </div>
  );
};
