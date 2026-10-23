"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import Link from "next/link";
import { formatBRL } from "@/lib/arranger/catalog";
import type { Listing } from "@/lib/marketplace/types";
import { LevelMeter } from "./level-meter";

function ProductThumb({ work, priority = false }: { work: Listing; priority?: boolean }) {
  if (work.hasPreview) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/acervo/${work.id}/previa`}
        alt=""
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover object-top transition duration-500 ease-gallery group-hover:scale-[1.03]"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="relative flex h-full w-full flex-col justify-end overflow-hidden bg-paper-soft px-5 pb-5 pt-8"
    >
      <div className="absolute inset-x-5 top-6 space-y-3 opacity-70">
        {[0, 1, 2, 3, 4].map((line) => (
          <span key={line} className="block h-px bg-staff" />
        ))}
      </div>
      <p className="relative font-playfair text-xl leading-tight text-charcoal">{work.title}</p>
      <p className="relative mt-1 text-xs text-muted">{work.formation}</p>
    </div>
  );
}

export function ProductCard({ work, priority = false }: { work: Listing; priority?: boolean }) {
  const price = formatBRL(work.priceCents);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-staff bg-white shadow-[0_18px_40px_-34px_rgba(45,45,45,0.4)] transition duration-500 ease-gallery hover:-translate-y-1 hover:shadow-[0_28px_60px_-36px_rgba(45,45,45,0.45)]">
      <Link href={`/acervo/${work.id}`} className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-staff bg-paper-soft">
          <ProductThumb work={work} priority={priority} />
          <span className="absolute top-3 left-3 rounded-sm bg-paper-soft/95 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.16em] text-muted uppercase backdrop-blur-sm">
            {work.formation}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4 md:p-5">
          <h3 className="line-clamp-2 font-playfair text-xl leading-snug text-charcoal md:text-2xl">
            {work.title}
          </h3>
          <p className="mt-2 truncate text-sm text-ink">{work.composer}</p>
          <p className="truncate text-sm text-muted">arr. {work.arranger}</p>

          <div className="mt-4 flex items-center gap-3 text-xs text-muted">
            <LevelMeter level={work.level} />
            <span className="tabular-nums">{work.durationLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{work.parts} partes</span>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <p className="text-base font-semibold tabular-nums text-charcoal sm:text-lg">{price}</p>
            <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-charcoal underline decoration-staff underline-offset-[6px] group-hover:decoration-copper">
              Ver obra
              <ArrowRightIcon
                size={16}
                weight="light"
                aria-hidden="true"
                className="transition-transform duration-300 ease-gallery group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
