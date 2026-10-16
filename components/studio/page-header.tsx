import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-6 border-b border-staff pb-8 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">{eyebrow}</p>
        <h1 className="mt-4 font-playfair text-3xl leading-tight text-charcoal md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando" className="grid gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-md border border-staff bg-paper-soft" />
      ))}
    </div>
  );
}
