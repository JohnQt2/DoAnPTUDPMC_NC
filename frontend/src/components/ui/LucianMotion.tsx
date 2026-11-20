import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const LUCIAN_EASE = [0.22, 1, 0.36, 1] as const;

interface LucianLiquidButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'ink' | 'crimson' | 'jade' | 'gold' | 'glass-light' | 'porcelain';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const LucianLiquidButton: React.FC<LucianLiquidButtonProps> = ({
  href,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'crimson',
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
    ink: 'bg-[#181415] hover:bg-[#2B2426] text-white shadow-[0_8px_22px_-8px_rgba(24,20,21,0.45)]',
    crimson:
      'bg-[#C41E3A] hover:bg-[#A51730] text-white shadow-[0_8px_24px_-6px_rgba(196,30,58,0.48)]',
    jade: 'bg-[#00A86B] hover:bg-[#059652] text-white shadow-[0_8px_22px_-6px_rgba(0,168,107,0.42)]',
    gold: 'bg-[#D4A017] hover:bg-[#B8860B] text-[#141112] shadow-[0_8px_22px_-6px_rgba(212,160,23,0.45)]',
    'glass-light':
      'bg-white hover:bg-[#FAF8F6] text-[#181415] border border-[#EAE3DE] hover:border-[#C41E3A]/40 shadow-xs',
    porcelain:
      'bg-white hover:bg-[#FAF8F6] text-[#141112] border border-[#EAE3DE] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.28)]',
  }[variant];

  const sharedCls = cn(
    'group inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed will-change-transform',
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
    viewport={{ once: true, amount: 0.16 }}
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
      <div className="flex items-center justify-between text-xs font-medium text-[#5F5658]">
        <span>{label}</span>
        <span className="font-mono font-semibold text-[#181415] tabular-nums">
          {current} / {target} bài ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#EFEAE6] overflow-hidden">
        <motion.div
          initial={false}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 0.5, ease: LUCIAN_EASE }}
          className="h-full rounded-full bg-[#C41E3A]"
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
  <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-[#EAE3DE] shadow-xs">
    <span className="w-2.5 h-2.5 rounded-full bg-[#C41E3A] shrink-0" />
    <div className="leading-tight">
      <p className="text-sm font-display font-bold text-[#181415] tabular-nums">
        {count} {unit}
      </p>
      <p className="text-[11px] text-[#5F5658]">{subtitle}</p>
    </div>
  </div>
);
