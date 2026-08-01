import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  /** Optional supporting copy or metadata under the title. */
  description?: ReactNode;
  /** Optional right-aligned action, e.g. a primary button. */
  action?: ReactNode;
  /** Optional leading icon tile (e.g. a lucide icon element). */
  icon?: ReactNode;
}

/**
 * Consistent header block for a page's content — an optional icon tile, title,
 * optional description, and an optional right-aligned action. Replaces ad-hoc
 * <h1> blocks so every page's masthead lines up.
 */
export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-5">
      <div className="flex items-start gap-3.5">
        {icon && (
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue [&_svg]:size-5">
            {icon}
          </span>
        )}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
