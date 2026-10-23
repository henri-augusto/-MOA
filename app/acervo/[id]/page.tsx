import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { LockIcon } from "@phosphor-icons/react/dist/ssr/Lock";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScoreSheet } from "@/components/landing/score-sheet";
import { LevelMeter } from "@/components/marketplace/level-meter";
import { StoreBreadcrumbs } from "@/components/marketplace/store-breadcrumbs";
import { YoutubeEmbed } from "@/components/marketplace/youtube-embed";
import { primaryButtonClass } from "@/components/studio/form";
import { formatBRL } from "@/lib/arranger/catalog";
import { getPublishedWork } from "@/lib/marketplace/catalog";
import { scoreSystems } from "@/lib/marketplace/score";
import { isPaymentsReady } from "@/lib/payments/env";
import { authSiteOrigin } from "@/lib/request-origin";

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

function ProductJsonLd({
  listing,
  origin,
}: {
  listing: NonNullable<Awaited<ReturnType<typeof getPublishedWork>>>;
  origin: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    brand: { "@type": "Brand", name: "MOA" },
    category: listing.formation,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (listing.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${origin}/acervo/${listing.id}`,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Compositor", value: listing.composer },
      { "@type": "PropertyValue", name: "Arranjador", value: listing.arranger },
      { "@type": "PropertyValue", name: "Nível", value: String(listing.level) },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

async function Work({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getPublishedWork(id);
  if (!listing) notFound();

  const price = formatBRL(listing.priceCents);
  const previewSrc = listing.hasPreview ? `/acervo/${listing.id}/previa` : null;
  const included = [
    "Grade completa em PDF",
    `${listing.parts} partes cavadas em PDF`,
    ...(listing.hasAudio ? ["Áudio de referência"] : []),
    "Download na conta, sempre que precisar",
  ];
  const acquireHref = `/acervo/${listing.id}/adquirir`;
  const paymentsReady = isPaymentsReady();
  // Sem Stripe: mantém o ensaio da aquisição. Com Stripe: só vende se o arranjador recebe.
  const canAcquire = !paymentsReady || listing.canPurchase;
  const origin = await authSiteOrigin();

  return (
    <div className="pb-28 lg:pb-0">
      <ProductJsonLd listing={listing} origin={origin} />

      <StoreBreadcrumbs
        items={[
          { label: "Início", href: "/" },
          { label: "Acervo", href: "/acervo" },
          { label: listing.formation, href: "/acervo" },
          { label: listing.title },
        ]}
      />

      <div className="mt-6 grid items-start gap-10 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
        <div className="lg:col-span-7">
          {listing.previewVideoId ? (
            <div className="mb-8">
              <YoutubeEmbed videoId={listing.previewVideoId} title={listing.title} />
              <p className="mt-3 text-sm text-muted">Vídeo de referência do arranjo.</p>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-md border border-staff bg-white shadow-[0_30px_80px_-40px_rgba(45,45,45,0.45)]">
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
        </div>

        <aside className="rounded-md border border-staff bg-white p-6 shadow-[0_18px_40px_-34px_rgba(45,45,45,0.4)] md:p-8 lg:sticky lg:top-28 lg:col-span-5">
          <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">{listing.formation}</p>
          <h1 className="mt-3 font-playfair text-3xl leading-[1.1] text-charcoal md:text-4xl">{listing.title}</h1>
          <p className="mt-3 text-base text-ink">{listing.composer}</p>
          <p className="text-sm text-muted">arr. {listing.arranger}</p>

          <p className="mt-6 text-3xl font-semibold tabular-nums text-charcoal md:text-4xl">{price}</p>
          <p className="mt-1 text-sm text-muted">Pagamento único · download imediato após a compra</p>

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
          <ul className="mt-3 space-y-2.5 text-sm text-ink">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-copper" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {canAcquire ? (
            <Link href={acquireHref} className={`mt-8 w-full max-lg:hidden ${primaryButtonClass}`}>
              Adquirir esta obra
            </Link>
          ) : (
            <button type="button" disabled className={`mt-8 w-full max-lg:hidden ${primaryButtonClass}`}>
              Indisponível para compra
            </button>
          )}

          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <LockIcon size={16} weight="light" aria-hidden="true" />
              Compra segura · pagamento com Stripe
            </li>
            <li className="flex items-center gap-2">
              <CheckCircleIcon size={16} weight="light" aria-hidden="true" />
              Licença para o conjunto informado
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {!paymentsReady
              ? "O pagamento com Stripe ainda não está ligado neste ambiente."
              : listing.canPurchase
                ? "Pagamento único. O download libera assim que o Stripe confirma a compra."
                : "O arranjador ainda não concluiu o cadastro de recebimento."}
          </p>
        </aside>

        <section className="lg:col-span-7">
          <h2 className="font-playfair text-2xl text-charcoal">Sobre o arranjo</h2>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink">{listing.description}</p>

          <div className="mt-10 divide-y divide-staff border-y border-staff">
            <details className="group py-4" open>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
                Especificações
                <span className="text-muted transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Formação</dt>
                  <dd className="mt-1 text-ink">{listing.formation}</dd>
                </div>
                <div>
                  <dt className="text-muted">Nível técnico</dt>
                  <dd className="mt-1 text-ink">{listing.level} de 5</dd>
                </div>
                <div>
                  <dt className="text-muted">Duração</dt>
                  <dd className="mt-1 tabular-nums text-ink">{listing.durationLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted">Partes</dt>
                  <dd className="mt-1 tabular-nums text-ink">{listing.parts}</dd>
                </div>
              </dl>
            </details>
            <details className="group py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
                Entrega e licença
                <span className="text-muted transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-ink">
                Após o pagamento, a grade e as partes ficam disponíveis para download. A aquisição é para o
                conjunto informado, para ensaio e apresentação.
              </p>
            </details>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-staff bg-paper-soft/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted">{listing.title}</p>
            <p className="font-semibold tabular-nums text-charcoal">{price}</p>
          </div>
          {canAcquire ? (
            <Link href={acquireHref} className={`ml-auto shrink-0 ${primaryButtonClass}`}>
              Adquirir
            </Link>
          ) : (
            <button type="button" disabled className={`ml-auto shrink-0 ${primaryButtonClass}`}>
              Indisponível
            </button>
          )}
        </div>
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
