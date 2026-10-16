import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import Link from "next/link";
import { LevelMeter } from "@/components/marketplace/level-meter";
import { formatBRL } from "@/lib/arranger/catalog";
import { listPublishedWorks, type Listing } from "@/lib/marketplace/catalog";

const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4"] as const;

function WorkCard({ work, span }: { work: Listing; span: string }) {
  return (
    <article
      className={`reveal group flex flex-col justify-between rounded-md border border-staff bg-white p-7 shadow-[0_18px_40px_-34px_rgba(45,45,45,0.4)] transition duration-500 ease-gallery hover:-translate-y-1 hover:shadow-[0_28px_60px_-36px_rgba(45,45,45,0.45)] md:p-8 ${span}`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{work.formation}</p>
        <h3 className="mt-6 font-playfair text-2xl leading-snug text-charcoal md:text-[1.7rem]">{work.title}</h3>
        <p className="mt-2 text-sm text-ink">{work.composer}</p>
        <p className="text-sm text-muted">arr. {work.arranger}</p>
      </div>

      <div className="mt-10">
        <dl className="grid grid-cols-3 gap-4 border-t border-staff pt-5 text-sm">
          <div>
            <dt className="text-xs text-muted">Nível</dt>
            <dd className="mt-2">
              <LevelMeter level={work.level} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Duração</dt>
            <dd className="mt-1 tabular-nums text-ink">{work.durationLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Partes</dt>
            <dd className="mt-1 tabular-nums text-ink">{work.parts}</dd>
          </div>
        </dl>
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="font-semibold tabular-nums text-charcoal">{formatBRL(work.priceCents)}</p>
          <Link
            href={`/acervo/${work.id}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-charcoal underline decoration-staff underline-offset-[6px] transition-colors duration-300 hover:decoration-copper"
            aria-label={`Adquirir obra: ${work.title}`}
          >
            Adquirir obra
            <ArrowRightIcon
              size={16}
              weight="light"
              aria-hidden="true"
              className="transition-transform duration-300 ease-gallery group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export async function Catalog() {
  let listings: Listing[];
  try {
    listings = await listPublishedWorks();
  } catch {
    return (
      <section id="acervo" className="border-t border-staff bg-paper-soft">
        <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
          <p role="alert" className="rounded-md border border-[#A3412F]/40 bg-[#A3412F]/5 px-4 py-3 text-sm text-[#7E2F21]">
            Não foi possível carregar a prévia do acervo. Confira se o SQL do catálogo publicado foi aplicado no
            Supabase.
          </p>
        </div>
      </section>
    );
  }

  const preview = listings.slice(0, 5);

  return (
    <section id="acervo" className="border-t border-staff bg-paper-soft">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        <div className="reveal flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">Prévia do acervo</p>
            <h2 className="mt-5 max-w-[18ch] font-playfair text-3xl leading-tight text-charcoal md:text-5xl">
              Obras revisadas, prontas para o ensaio.
            </h2>
          </div>
          <div className="max-w-[42ch]">
            <p className="text-base leading-relaxed text-muted">
              Cada arranjo chega com grade, partes cavadas e nível técnico indicado, depois da revisão da
              curadoria.
            </p>
            <Link
              href="/acervo"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-charcoal underline decoration-staff underline-offset-[6px] transition-colors duration-300 hover:decoration-copper"
            >
              Abrir o acervo
              <ArrowRightIcon size={16} weight="light" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {preview.length === 0 ? (
          <div className="reveal mt-16 rounded-md border border-dashed border-staff bg-white px-6 py-14 text-center md:px-12">
            <p className="font-playfair text-2xl text-charcoal">O acervo ainda não tem publicação.</p>
            <p className="mx-auto mt-3 max-w-[46ch] leading-relaxed text-muted">
              Quando a curadoria publicar o primeiro arranjo, ele aparece aqui e na página do acervo.
            </p>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {preview.map((work, index) => (
              <WorkCard key={work.id} work={work} span={SPANS[index] ?? "lg:col-span-4"} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
