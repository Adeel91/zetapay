'use client';

import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, icon, className = '', ...props }, ref) => {
    const variants = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30',
      secondary:
        'bg-white text-slate-900 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600',
      outline:
        'border border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600',
      ghost: 'text-slate-600 hover:text-slate-900',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className} `}
        {...props}
      >
        {children}
        {icon && <span className="transition-transform group-hover:translate-x-0.5">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
