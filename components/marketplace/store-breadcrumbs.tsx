import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

export function StoreBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 ? <CaretRightIcon size={12} weight="bold" aria-hidden="true" className="opacity-50" /> : null}
              {item.href && !last ? (
                <Link href={item.href} className="min-h-11 inline-flex items-center transition-colors hover:text-charcoal">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "min-h-11 inline-flex items-center font-medium text-charcoal" : "min-h-11 inline-flex items-center"}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
