import React from 'react';
import { cn } from '../../lib/cn';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass-light' | 'glass-dark';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  children: React.ReactNode;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  ...props
}) => {
  const base =
    'group relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]';

  const sizes = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-11 px-6 text-sm',
  }[size];

  const variants = {
    primary: 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-[0_1px_2px_rgba(9,9,11,0.16)]',
    secondary: 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 hover:border-zinc-300 shadow-[0_1px_2px_rgba(9,9,11,0.04)]',
    'glass-light': 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 hover:border-zinc-300 shadow-[0_1px_2px_rgba(9,9,11,0.04)]',
    'glass-dark': 'bg-zinc-900 hover:bg-zinc-800 text-white border border-white/15',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950',
  }[variant];

  const classes = cn(base, sizes, variants, className);

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
