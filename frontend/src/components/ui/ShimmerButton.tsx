import React from 'react';
import { cn } from '../../lib/cn';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: 'primary' | 'glass-dark' | 'glass-light';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = cn(
    'relative inline-flex items-center justify-center gap-2 overflow-hidden font-bold rounded-2xl transition-[background,box-shadow,border-color,opacity] duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 whitespace-nowrap',
    size === 'sm' && 'px-4 py-2 text-xs min-h-[38px]',
    size === 'md' && 'px-5 py-3 text-sm min-h-[46px]',
    size === 'lg' && 'px-7 py-4 text-base min-h-[52px]',
    variant === 'primary' &&
      'bg-[#C41E3A] hover:bg-[#A51730] text-white shadow-md shadow-[#C41E3A]/25 hover:shadow-lg hover:shadow-[#C41E3A]/35',
    variant === 'glass-dark' &&
      'bg-white/10 hover:bg-white/16 text-white border border-white/25 backdrop-blur-md shadow-lg shadow-black/20',
    variant === 'glass-light' &&
      'bg-white/85 hover:bg-white text-gray-800 border border-white/90 backdrop-blur-md shadow-sm hover:shadow-md',
    className
  );

  const sheen = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/25 to-transparent"
    />
  );

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {variant === 'primary' && sheen}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </a>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      {variant === 'primary' && sheen}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
};
