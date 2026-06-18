import { type ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 mb-5">
      <div className="min-w-0">
        <div className="label-mono mb-1.5">{eyebrow}</div>
        <h2 className="font-display text-2xl font-bold text-ink-900 leading-tight">{title}</h2>
        <p className="text-sm text-ink-400 mt-1 max-w-2xl">{description}</p>
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}
