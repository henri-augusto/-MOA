import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { primaryButtonClass } from "@/components/studio/form";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import { StatusBadge } from "@/components/studio/status-badge";
import { formatBRL, formatDuration, type Work } from "@/lib/arranger/catalog";
import { requireArranger } from "@/lib/arranger/session";
import { SavedNotice } from "./saved-notice";

export const metadata: Metadata = {
  title: "Obras — Estúdio do arranjador — MOA",
};

const updatedFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

type WorkRow = Pick<
  Work,
  | "id"
  | "title"
  | "composer"
  | "formation"
  | "level"
  | "duration_seconds"
  | "parts_count"
  | "price_cents"
  | "status"
  | "score_path"
  | "parts_path"
  | "audio_path"
  | "updated_at"
>;

function missingFiles(work: WorkRow) {
  const missing: string[] = [];
  if (!work.score_path) missing.push("grade");
  if (!work.parts_path) missing.push("partes");
  return missing;
}

async function WorksList() {
  const { supabase, userId } = await requireArranger();
  const { data } = await supabase
    .from("works")
    .select(
      "id, title, composer, formation, level, duration_seconds, parts_count, price_cents, status, score_path, parts_path, audio_path, updated_at",
    )
    .eq("arranger_id", userId)
    .order("updated_at", { ascending: false })
    .returns<WorkRow[]>();

  const works = data ?? [];

  if (works.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-staff bg-paper-soft px-6 py-16 text-center md:px-12">
        <p className="font-playfair text-2xl text-charcoal">Seu catálogo começa aqui.</p>
        <p className="mx-auto mt-3 max-w-[46ch] leading-relaxed text-muted">
          Cadastre o primeiro arranjo com grade, partes e, se tiver, o áudio de referência. Você pode salvar como
          rascunho e terminar depois.
        </p>
        <Link href="/arranjador/obras/nova" className={`mt-8 ${primaryButtonClass}`}>
          <PlusIcon size={18} weight="bold" aria-hidden="true" />
          Cadastrar primeira obra
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-staff overflow-hidden rounded-md border border-staff bg-white">
      {works.map((work) => {
        const missing = missingFiles(work);
        return (
          <li key={work.id}>
            <Link
              href={`/arranjador/obras/${work.id}`}
              className="group grid gap-4 px-6 py-6 transition-colors duration-300 hover:bg-paper-soft md:grid-cols-[1fr_auto] md:items-center md:px-8"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={work.status} />
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{work.formation}</p>
                </div>
                <p className="mt-3 truncate font-playfair text-xl text-charcoal md:text-2xl">{work.title}</p>
                <p className="mt-1 text-sm text-ink">{work.composer}</p>
                {missing.length > 0 && work.status === "rascunho" ? (
                  <p className="mt-2 text-sm text-copper-deep">Falta enviar: {missing.join(" e ")}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-8 md:justify-end">
                <dl className="grid grid-cols-3 gap-6 text-sm md:gap-8">
                  <div>
                    <dt className="text-xs text-muted">Duração</dt>
                    <dd className="mt-1 tabular-nums text-ink">{formatDuration(work.duration_seconds)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Partes</dt>
                    <dd className="mt-1 tabular-nums text-ink">{work.parts_count}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Preço</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-charcoal">{formatBRL(work.price_cents)}</dd>
                  </div>
                </dl>
                <div className="hidden text-right lg:block">
                  <p className="text-xs text-muted">Atualizada</p>
                  <p className="mt-1 text-sm tabular-nums text-ink">{updatedFormat.format(new Date(work.updated_at))}</p>
                </div>
                <ArrowRightIcon
                  size={18}
                  weight="light"
                  aria-hidden="true"
                  className="shrink-0 text-muted transition-transform duration-300 ease-gallery group-hover:translate-x-1 group-hover:text-charcoal"
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function WorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Suas obras."
        description="Rascunhos ficam só com você. Ao enviar para revisão, a curadoria confere o material antes de publicar no acervo."
        actions={
          <Link href="/arranjador/obras/nova" className={primaryButtonClass}>
            <PlusIcon size={18} weight="bold" aria-hidden="true" />
            Nova obra
          </Link>
        }
      />
      <Suspense fallback={null}>
        <SavedNotice />
      </Suspense>
      <div className="mt-10">
        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <WorksList />
        </Suspense>
      </div>
    </>
  );
}
