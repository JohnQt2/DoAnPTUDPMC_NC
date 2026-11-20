import React from 'react';
import { cn } from '../../lib/cn';

interface ShimmerButtonProps {
  variant?: 'primary' | 'secondary' | 'emerald' | 'dark' | 'outline' | 'glass-light';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  title?: string;
}

const variantClasses = {
  primary:
    'bg-[#C41E3A] hover:bg-[#A51730] text-white border border-transparent shadow-[0_6px_18px_-6px_rgba(196,30,58,0.5)]',
  secondary:
    'bg-[#D4A017] hover:bg-[#B8860B] text-[#141112] border border-transparent shadow-[0_6px_18px_-6px_rgba(212,160,23,0.45)]',
  emerald:
    'bg-[#00A86B] hover:bg-[#059652] text-white border border-transparent shadow-[0_6px_18px_-6px_rgba(0,168,107,0.4)]',
  dark:
    'bg-[#181415] hover:bg-[#2A2325] text-white border border-transparent shadow-[0_6px_18px_-6px_rgba(24,20,21,0.35)]',
  outline:
    'bg-white hover:bg-[#FAF8F6] text-[#181415] border border-[#EAE3DE] hover:border-[#C41E3A]/40 shadow-xs',
  'glass-light':
    'bg-white hover:bg-[#FAF8F6] text-[#181415] border border-[#EAE3DE] hover:border-[#C41E3A]/40 shadow-xs',
};

const sizeClasses = {
  sm: 'h-9 px-3.5 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-6 text-sm rounded-xl gap-2',
};

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  onClick,
  type = 'button',
  disabled,
  title,
}) => {
  const baseClass = cn(
    'relative inline-flex items-center justify-center font-semibold tracking-tight transition-[background-color,border-color,box-shadow,transform] duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] focus-visible:ring-offset-2 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} title={title} className={baseClass}>
        <span className="inline-flex items-center gap-2">{children}</span>
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={baseClass}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
};
