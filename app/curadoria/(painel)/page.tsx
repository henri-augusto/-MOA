import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import { StatusBadge } from "@/components/studio/status-badge";
import { displayName, formatBRL, formatDuration, type Work } from "@/lib/arranger/catalog";
import { requireCurator } from "@/lib/arranger/session";
import { ReviewNotice } from "./review-notice";

export const metadata: Metadata = {
  title: "Fila — Curadoria — MOA",
};

const updatedFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type QueueRow = Pick<
  Work,
  "id" | "title" | "composer" | "formation" | "duration_seconds" | "price_cents" | "status" | "updated_at"
> & {
  arranger_id: string;
  profiles: { artist_name: string | null; full_name: string } | null;
};

async function ReviewQueue() {
  const { supabase } = await requireCurator();
  const { data } = await supabase
    .from("works")
    .select(
      "id, title, composer, formation, duration_seconds, price_cents, status, updated_at, arranger_id, profiles!arranger_id ( artist_name, full_name )",
    )
    .eq("status", "em_revisao")
    .order("updated_at", { ascending: true })
    .returns<QueueRow[]>();

  const works = data ?? [];

  if (works.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-staff bg-paper-soft px-6 py-16 text-center md:px-12">
        <p className="font-playfair text-2xl text-charcoal">Nenhuma obra aguardando revisão.</p>
        <p className="mx-auto mt-3 max-w-[46ch] leading-relaxed text-muted">
          Quando um arranjador enviar grade e partes, a obra aparece aqui para você conferir e publicar.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-staff overflow-hidden rounded-md border border-staff bg-white">
      {works.map((work) => (
        <li key={work.id}>
          <Link
            href={`/curadoria/obras/${work.id}`}
            className="group grid gap-4 px-6 py-6 transition-colors duration-300 hover:bg-paper-soft md:grid-cols-[1fr_auto] md:items-center md:px-8"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={work.status} />
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{work.formation}</p>
              </div>
              <p className="mt-3 truncate font-playfair text-xl text-charcoal md:text-2xl">{work.title}</p>
              <p className="mt-1 text-sm text-ink">{work.composer}</p>
              <p className="mt-2 text-sm text-muted">Arranjador: {displayName(work.profiles)}</p>
            </div>

            <div className="flex items-center justify-between gap-8 md:justify-end">
              <dl className="grid grid-cols-2 gap-6 text-sm md:gap-8">
                <div>
                  <dt className="text-xs text-muted">Duração</dt>
                  <dd className="mt-1 tabular-nums text-ink">{formatDuration(work.duration_seconds)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Preço</dt>
                  <dd className="mt-1 tabular-nums text-ink">{formatBRL(work.price_cents)}</dd>
                </div>
              </dl>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-muted">Enviada</p>
                <p className="mt-1 text-sm text-ink">{updatedFormat.format(new Date(work.updated_at))}</p>
              </div>
              <ArrowRightIcon
                size={20}
                weight="light"
                className="text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-charcoal"
                aria-hidden="true"
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CuratorHomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Fila"
        title="Obras em revisão."
        description="Confira grade, partes e metadados. Publique no acervo ou devolva com um recado para o arranjador."
      />
      <Suspense fallback={null}>
        <ReviewNotice />
      </Suspense>
      <div className="mt-10">
        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <ReviewQueue />
        </Suspense>
      </div>
    </>
  );
}
