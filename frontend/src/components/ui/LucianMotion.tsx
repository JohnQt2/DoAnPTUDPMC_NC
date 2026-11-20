/* Lucian UX/UI Prompt (#001, #216, #372, #379) · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/ */
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Refined Lucian #001 — Subtle Pointer-Reactive Button (Minimalist SaaS 2026 edition).
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
  variant = 'ink',
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
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
    const my = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
    el.style.setProperty('--mx', `${mx.toFixed(1)}%`);
    el.style.setProperty('--my', `${my.toFixed(1)}%`);
  };

  const handlePointerLeave = () => {
    const el = elRef.current;
    if (!el) return;
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '0%');
  };

  const sizeCls = size === 'lg' ? 'px-5 h-11 text-sm' : 'px-4 h-9 text-xs sm:text-[13px]';
  const variantCls =
    variant === 'vermilion'
      ? 'bg-[#BE123C] hover:bg-[#9F1239] text-white border border-[#BE123C] shadow-[0_1px_2px_rgba(9,9,11,0.10),inset_0_1px_0_rgba(255,255,255,0.16)]'
      : variant === 'ink'
        ? 'bg-[#18181B] hover:bg-[#27272A] text-white border border-zinc-900 shadow-[0_1px_2px_rgba(9,9,11,0.12),inset_0_1px_0_rgba(255,255,255,0.14)]'
        : variant === 'glass-dark'
          ? 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
          : 'bg-white hover:bg-zinc-50 text-[#09090B] border border-zinc-200 shadow-[0_1px_2px_rgba(9,9,11,0.04)]';

  const baseCls = cn(
    'u001-liquid-btn relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[-0.01em] overflow-hidden select-none cursor-pointer disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
    sizeCls,
    variantCls,
    className
  );

  const inner = (
    <>
      <span aria-hidden="true" className="u001-specular pointer-events-none absolute inset-0 rounded-[inherit]" />
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
 * Port of Lucian #216 — Crisp Editorial Masked Headline Reveal.
 */
export const MaskedHeadline: React.FC<{
  lines: string[];
  accentLineIndex?: number;
  className?: string;
}> = ({ lines, accentLineIndex, className }) => {
  let wordCounter = 0;

  return (
    <h1 className={cn('font-display font-bold tracking-[-0.035em] leading-[1.08]', className)}>
      {lines.map((line, lIdx) => {
        const words = line.split(' ');
        const isAccent = lIdx === accentLineIndex;
        return (
          <span key={lIdx} className={cn('block', isAccent && 'text-zinc-400')}>
            {words.map((word, wIdx) => {
              const delay = 0.03 + wordCounter++ * 0.04;
              return (
                <span
                  key={`${lIdx}-${wIdx}`}
                  className="inline-block overflow-hidden align-bottom mr-[0.23em] last:mr-0 pb-[0.06em]"
                >
                  <motion.span
                    className="inline-block"
                    initial={{ y: '105%', opacity: 0.01 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{ duration: 0.48, delay, ease: [0.2, 0.8, 0.2, 1] }}
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
 * Minimalist Precision Progress Bar (Lucian #372 adapted for 2026 SaaS).
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
        <span className="font-medium text-zinc-500">{label}</span>
        <span className="font-mono font-semibold text-zinc-900 tabular-nums">
          {current}/{safeTarget} bài · {pct}%
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, pct)}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="h-full rounded-full bg-[#18181B]"
        />
      </div>
    </div>
  );
};

/**
 * Crisp Minimalist Streak Metric Pill.
 */
export const LucianStreakFlame: React.FC<{
  count: number;
  unit?: string;
  subtitle?: string;
}> = ({ count, unit = 'bài', subtitle = 'Đã hoàn thành' }) => {
  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(9,9,11,0.04)]">
      <span className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-[#BE123C] flex items-center justify-center shrink-0">
        <Flame className="w-3.5 h-3.5 fill-[#BE123C]/90" />
      </span>
      <div className="leading-tight">
        <p className="text-[13px] font-bold text-zinc-900 tabular-nums">
          {count} {unit}
        </p>
        <p className="text-[11px] text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
};
