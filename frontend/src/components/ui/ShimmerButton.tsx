import React from 'react';
import { cn } from '../../lib/cn';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass-light' | 'glass-dark' | 'gold' | 'cinnabar';
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
    'group relative inline-flex items-center justify-center gap-2 font-semibold rounded-[6px] transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D3C] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]';

  const sizes = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-11 px-6 text-sm',
  }[size];

  const variants = {
    primary: 'bg-[#1F3A2E] hover:bg-[#172D23] text-[#FBF7EC] shadow-xs',
    cinnabar: 'bg-[#7A2E2B] hover:bg-[#642422] text-[#FBF7EC] shadow-xs',
    gold: 'bg-[#B08D3C] hover:bg-[#9C7B30] text-[#1E1610] shadow-xs',
    secondary: 'bg-[#FBF7EC] hover:bg-[#F3ECDC] text-[#2A2118] border border-[#DECFAA] hover:border-[#B08D3C]',
    'glass-light': 'bg-[#FBF7EC] hover:bg-[#F3ECDC] text-[#2A2118] border border-[#DECFAA] hover:border-[#B08D3C]',
    'glass-dark': 'bg-[#1E1610] hover:bg-[#2A2118] text-[#FBF7EC] border border-[#DECFAA]/25',
    ghost: 'bg-transparent hover:bg-[#EADFC5]/60 text-[#6B5B4B] hover:text-[#2A2118]',
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
