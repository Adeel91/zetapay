'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white ${hover ? 'transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5' : ''} ${className} `}
    >
      {children}
    </div>
  );
}
