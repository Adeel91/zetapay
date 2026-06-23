'use client';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
}

export function PageHeader({ title, description, action, backLink }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {backLink && (
        <a
          href={backLink.href}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600"
        >
          ← {backLink.label}
        </a>
      )}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
