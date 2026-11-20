import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const LUCIAN_EASE = [0.22, 1, 0.36, 1] as const;

interface LucianLiquidButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'ink' | 'vermilion' | 'glass-light' | 'porcelain';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

/**
 * Magnetic tactile CTA button (Lucian UX #001 inspired):
 * Pure GPU transform micro-pull on pointer move + razor-sharp minimalist surface.
 */
export const LucianLiquidButton: React.FC<LucianLiquidButtonProps> = ({
  href,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'ink',
  size = 'md',
  className = '',
  children,
}) => {
  const elRef = useRef<HTMLElement | null>(null);

  const handleMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = elRef.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 3;
    el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
  }, [disabled]);

  const handleLeave = useCallback(() => {
    const el = elRef.current;
    if (el) el.style.transform = 'translate3d(0, 0, 0)';
  }, []);

  const sizeCls = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-6 text-[14.5px]',
  }[size];

  const variantCls = {
    ink: 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-[0_2px_10px_-3px_rgba(9,9,11,0.35)]',
    vermilion: 'bg-[#BE123C] hover:bg-[#9F1239] text-white shadow-[0_2px_12px_-3px_rgba(190,18,60,0.4)]',
    'glass-light':
      'bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-300 shadow-[0_1px_3px_rgba(9,9,11,0.04)]',
    porcelain:
      'bg-[#FAFAF9] hover:bg-white text-zinc-950 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.45)]',
  }[variant];

  const sharedCls = cn(
    'group inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed will-change-transform',
    sizeCls,
    variantCls,
    className
  );

  if (href) {
    return (
      <a
        ref={(node) => {
          elRef.current = node;
        }}
        href={href}
        onClick={onClick}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={sharedCls}
      >
        {children}
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
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={sharedCls}
    >
      {children}
    </button>
  );
};

interface SmoothRevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/**
 * 120fps GPU-only scroll reveal: animates exclusively transform + opacity, triggers cleanly once.
 */
export const SmoothReveal: React.FC<SmoothRevealProps> = ({
  children,
  delay = 0,
  y = 18,
  className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.18 }}
    transition={{ duration: 0.55, delay, ease: LUCIAN_EASE }}
    className={cn('will-change-[transform,opacity]', className)}
  >
    {children}
  </motion.div>
);

export const LucianXpBar: React.FC<{
  current: number;
  target: number;
  label?: string;
  className?: string;
}> = ({ current, target, label = 'Tiến độ học tập', className = '' }) => {
  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
        <span>{label}</span>
        <span className="font-mono font-semibold text-zinc-950 tabular-nums">
          {current} / {target} bài ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 0.5, ease: LUCIAN_EASE }}
          className="h-full rounded-full bg-zinc-950"
        />
      </div>
    </div>
  );
};

export const LucianStreakFlame: React.FC<{
  count: number;
  unit?: string;
  subtitle?: string;
}> = ({ count, unit = 'bài', subtitle = 'Đã hoàn thành' }) => (
  <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(9,9,11,0.03)]">
    <span className="w-2.5 h-2.5 rounded-full bg-[#BE123C] shrink-0" />
    <div className="leading-tight">
      <p className="text-sm font-display font-bold text-zinc-950 tabular-nums">
        {count} {unit}
      </p>
      <p className="text-[11px] text-zinc-500">{subtitle}</p>
    </div>
  </div>
);
