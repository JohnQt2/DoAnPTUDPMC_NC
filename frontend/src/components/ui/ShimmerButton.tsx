import React from 'react';
import { cn } from '../../lib/cn';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: 'primary' | 'glass-dark' | 'glass-light';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Refined 2026 Executive SaaS Button (Linear / Vercel / Stripe precision):
 * - Clean deep charcoal ink (#18181B) primary CTA with crisp 1px top inset sheen
 * - Clean porcelain white (#FFFFFF) + zinc-200 border secondary button
 * - Zero neon gradients, zero infinite animated shimmer bars
 */
export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-[background-color,border-color,box-shadow,opacity] duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 whitespace-nowrap select-none',
    size === 'sm' && 'px-3.5 py-2 text-xs h-9',
    size === 'md' && 'px-4 py-2.5 text-sm h-10',
    size === 'lg' && 'px-6 py-3 text-sm h-11',
    variant === 'primary' &&
      'bg-[#18181B] hover:bg-[#27272A] text-white border border-zinc-900 shadow-[0_1px_2px_rgba(9,9,11,0.12),inset_0_1px_0_rgba(255,255,255,0.14)]',
    variant === 'glass-dark' &&
      'bg-white/10 hover:bg-white/15 text-white border border-white/15',
    variant === 'glass-light' &&
      'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-[0_1px_2px_rgba(9,9,11,0.04)]',
    className
  );

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      {children}
    </button>
  );
};
