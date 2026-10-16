import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScoreSheet } from "@/components/landing/score-sheet";
import { EnsurePublicPreview } from "@/components/marketplace/ensure-public-preview";
import { LevelMeter } from "@/components/marketplace/level-meter";
import { YoutubeEmbed } from "@/components/marketplace/youtube-embed";
import { primaryButtonClass } from "@/components/studio/form";
import { formatBRL } from "@/lib/arranger/catalog";
import { getOwnedPreviewSources, getPublishedWork } from "@/lib/marketplace/catalog";
import { scoreSystems } from "@/lib/marketplace/score";
import { publicPreviewUrl } from "@/lib/supabase/env";

export async function generateMetadata({ params }: PageProps<"/acervo/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getPublishedWork(id);
  if (!listing) return { title: "Obra — Acervo — MOA" };
  return {
    title: `${listing.title} — Acervo — MOA`,
    description: listing.description,
  };
}

function WorkFallback() {
  return (
    <div className="grid gap-10 lg:grid-cols-12" aria-hidden="true">
      <div className="h-[36rem] rounded-md bg-staff/70 lg:col-span-7" />
      <div className="h-80 rounded-md bg-staff/70 lg:col-span-5" />
    </div>
  );
}

async function Work({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getPublishedWork(id);
  if (!listing) notFound();

  const price = formatBRL(listing.priceCents);
  const previewSrc = listing.hasPreview ? publicPreviewUrl(listing.id) : null;
  const sources = previewSrc ? null : await getOwnedPreviewSources(listing.id);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
      <header className="order-1 lg:col-span-7">
        <Link
          href="/acervo"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors duration-300 hover:text-charcoal"
        >
          <ArrowLeftIcon size={16} weight="light" aria-hidden="true" />
          Acervo
        </Link>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-muted">{listing.formation}</p>
        <h1 className="mt-4 max-w-[16ch] font-playfair text-4xl leading-[1.05] text-charcoal md:text-6xl">
          {listing.title}
        </h1>
        <p className="mt-4 text-base text-ink">{listing.composer}</p>
        <p className="text-sm text-muted">arr. {listing.arranger}</p>
      </header>

      <aside className="order-2 rounded-md border border-staff bg-white p-6 shadow-[0_18px_40px_-34px_rgba(45,45,45,0.4)] md:p-8 lg:sticky lg:top-28 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
        <p className="text-3xl font-semibold tabular-nums text-charcoal">{price}</p>
        <p className="mt-2 text-sm text-muted">Pagamento único</p>

        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-staff pt-5 text-sm">
          <div>
            <dt className="text-xs text-muted">Nível</dt>
            <dd className="mt-2">
              <LevelMeter level={listing.level} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Duração</dt>
            <dd className="mt-1 tabular-nums text-ink">{listing.durationLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Partes</dt>
            <dd className="mt-1 tabular-nums text-ink">{listing.parts}</dd>
          </div>
        </dl>

        <h2 className="mt-8 text-sm font-medium text-charcoal">O que acompanha</h2>
        <ul className="mt-3 divide-y divide-staff border-y border-staff text-sm text-ink">
          <li className="py-3">Grade completa em PDF</li>
          <li className="py-3">{listing.parts} partes cavadas em PDF</li>
          <li className="py-3">Áudio de referência</li>
          <li className="py-3">Download na conta, sempre que precisar</li>
        </ul>

        <Link href={`/acervo/${listing.id}/adquirir`} className={`mt-8 w-full ${primaryButtonClass}`}>
          Adquirir esta obra
        </Link>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          O pagamento com Stripe ainda não está ligado. A próxima tela é o ensaio da aquisição.
        </p>
      </aside>

      <div className="order-3 lg:col-span-7">
        {listing.previewVideoId ? (
          <div className="mb-10">
            <YoutubeEmbed videoId={listing.previewVideoId} title={listing.title} />
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted">
              Vídeo de referência do arranjo.
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-sm border border-staff bg-white shadow-[0_30px_80px_-40px_rgba(45,45,45,0.45)]">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={`Primeira página da grade de ${listing.title}, de ${listing.composer}, arranjo de ${listing.arranger}`}
              className="h-auto w-full"
            />
          ) : (
            <ScoreSheet
              className="h-auto w-full"
              title={listing.title}
              subtitle={listing.formation}
              composer={listing.composer}
              arranger={listing.arranger}
              systems={scoreSystems(listing.id)}
            />
          )}
        </div>
        <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted">
          Prévia da primeira página. A grade completa e as partes cavadas entram no PDF depois da aquisição.
        </p>
        {sources?.scoreUrl || sources?.previewUrl ? (
          <EnsurePublicPreview
            workId={listing.id}
            scoreUrl={sources.scoreUrl}
            previewUrl={sources.previewUrl}
            refresh
          />
        ) : null}

        <h2 className="mt-14 font-playfair text-2xl text-charcoal">Sobre o arranjo</h2>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink">{listing.description}</p>
      </div>
    </div>
  );
}

export default function WorkPage({ params }: PageProps<"/acervo/[id]">) {
  return (
    <Suspense fallback={<WorkFallback />}>
      <Work params={params} />
    </Suspense>
  );
}
