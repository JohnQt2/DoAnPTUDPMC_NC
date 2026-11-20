import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const LUCIAN_EASE = [0.22, 1, 0.36, 1] as const;

interface LucianLiquidButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'ink' | 'jade' | 'cinnabar' | 'gold' | 'glass-light' | 'porcelain';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const LucianLiquidButton: React.FC<LucianLiquidButtonProps> = ({
  href,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'jade',
  size = 'md',
  className = '',
  children,
}) => {
  const elRef = useRef<HTMLElement | null>(null);

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const el = elRef.current;
      if (!el || disabled) return;
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
      const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2.5;
      el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    },
    [disabled]
  );

  const handleLeave = useCallback(() => {
    const el = elRef.current;
    if (el) el.style.transform = 'translate3d(0, 0, 0)';
  }, []);

  const sizeCls = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-6 text-[14.5px]',
  }[size];

  const variantCls = {
    ink: 'bg-[#1F3A2E] hover:bg-[#172D23] text-[#FBF7EC] shadow-[0_4px_14px_-4px_rgba(31,58,46,0.4)]',
    jade: 'bg-[#1F3A2E] hover:bg-[#172D23] text-[#FBF7EC] shadow-[0_4px_14px_-4px_rgba(31,58,46,0.4)]',
    cinnabar: 'bg-[#7A2E2B] hover:bg-[#642422] text-[#FBF7EC] shadow-[0_4px_14px_-4px_rgba(122,46,43,0.42)]',
    gold: 'bg-[#B08D3C] hover:bg-[#9C7B30] text-[#1E1610] shadow-[0_6px_18px_-4px_rgba(176,141,60,0.45)]',
    'glass-light':
      'bg-[#FBF7EC] hover:bg-white text-[#2A2118] border border-[#DECFAA] hover:border-[#B08D3C] shadow-xs',
    porcelain:
      'bg-[#FBF7EC] hover:bg-white text-[#1E1610] border border-[#DECFAA] shadow-[0_6px_20px_-6px_rgba(0,0,0,0.35)]',
  }[variant];

  const sharedCls = cn(
    'group inline-flex items-center justify-center gap-2 rounded-[6px] font-semibold tracking-tight transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D3C] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed will-change-transform',
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

export const SmoothReveal: React.FC<SmoothRevealProps> = ({
  children,
  delay = 0,
  y = 16,
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
      <div className="flex items-center justify-between text-xs font-medium text-[#6B5B4B]">
        <span>{label}</span>
        <span className="font-mono font-semibold text-[#2A2118] tabular-nums">
          {current} / {target} bài ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#EADFC5] overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 0.5, ease: LUCIAN_EASE }}
          className="h-full rounded-full bg-[#1F3A2E]"
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
  <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-[8px] bg-[#FBF7EC] border border-[#DECFAA] shadow-xs">
    <span className="w-2.5 h-2.5 rounded-full bg-[#7A2E2B] shrink-0" />
    <div className="leading-tight">
      <p className="text-sm font-editorial font-bold text-[#2A2118] tabular-nums">
        {count} {unit}
      </p>
      <p className="text-[11px] text-[#6B5B4B]">{subtitle}</p>
    </div>
  </div>
);
