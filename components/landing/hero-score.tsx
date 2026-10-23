import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr/SealCheck";
import Link from "next/link";
import { listPublishedWorks, type Listing } from "@/lib/marketplace/catalog";
import { ScoreSheet } from "./score-sheet";

function HeroScoreFallback() {
  return (
    <>
      <div
        className="animate-rise relative overflow-hidden rounded-sm border border-staff bg-white shadow-[0_30px_80px_-40px_rgba(45,45,45,0.45)] md:-rotate-[1.5deg]"
        style={{ animationDelay: "200ms" }}
      >
        <ScoreSheet className="h-auto w-full" />
      </div>

      <div
        className="animate-rise absolute -bottom-8 left-4 flex items-center gap-3 rounded-md border border-staff bg-white px-4 py-3 shadow-[0_16px_40px_-24px_rgba(45,45,45,0.5)] md:-left-10"
        style={{ animationDelay: "480ms" }}
      >
        <SealCheckIcon size={26} weight="light" className="text-copper" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-charcoal">Obra adquirida</p>
          <p className="text-xs text-muted">Grade + 5 partes · PDF</p>
        </div>
      </div>

      <span className="absolute -top-3 right-5 rounded-md bg-charcoal px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-copper">
        Premium
      </span>
    </>
  );
}

function HeroScoreCard({ work }: { work: Listing }) {
  return (
    <>
      <Link
        href={`/acervo/${work.id}`}
        className="animate-rise relative block overflow-hidden rounded-sm border border-staff bg-white shadow-[0_30px_80px_-40px_rgba(45,45,45,0.45)] outline-none transition duration-300 hover:shadow-[0_36px_90px_-40px_rgba(45,45,45,0.55)] focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 md:-rotate-[1.5deg]"
        style={{ animationDelay: "200ms" }}
        aria-label={`Ver ${work.title} no acervo`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/acervo/${work.id}/previa`}
          alt={`Primeira página da grade de ${work.title}, de ${work.composer}, arranjo de ${work.arranger}`}
          width={400}
          height={520}
          className="aspect-[400/520] h-auto w-full object-cover object-top"
          decoding="async"
          fetchPriority="high"
        />
      </Link>

      <div
        className="animate-rise absolute -bottom-8 left-4 flex max-w-[min(100%,18rem)] items-center gap-3 rounded-md border border-staff bg-white px-4 py-3 shadow-[0_16px_40px_-24px_rgba(45,45,45,0.5)] md:-left-10"
        style={{ animationDelay: "480ms" }}
      >
        <SealCheckIcon size={26} weight="light" className="shrink-0 text-copper" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-charcoal">{work.title}</p>
          <p className="text-xs text-muted">
            Grade + {work.parts} partes · PDF
          </p>
        </div>
      </div>

      <span className="absolute -top-3 right-5 max-w-[12rem] truncate rounded-md bg-charcoal px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-copper">
        {work.formation}
      </span>
    </>
  );
}

export async function HeroScore() {
  let work: Listing | undefined;
  try {
    const listings = await listPublishedWorks();
    work = listings.find((listing) => listing.hasPreview);
  } catch {
    return <HeroScoreFallback />;
  }

  if (!work) return <HeroScoreFallback />;
  return <HeroScoreCard work={work} />;
}

export function HeroScoreSkeleton() {
  return (
    <>
      <div
        className="relative aspect-[400/520] overflow-hidden rounded-sm border border-staff bg-paper-soft shadow-[0_30px_80px_-40px_rgba(45,45,45,0.45)] md:-rotate-[1.5deg]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 left-4 h-[3.75rem] w-48 rounded-md border border-staff bg-white md:-left-10"
        aria-hidden="true"
      />
    </>
  );
}
