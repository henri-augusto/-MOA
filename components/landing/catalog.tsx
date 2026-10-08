import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";

type Work = {
  title: string;
  composer: string;
  arranger: string;
  formation: string;
  level: number;
  duration: string;
  parts: number;
  price: string;
  premium?: boolean;
  span: string;
};

const works: Work[] = [
  {
    title: "Odeon",
    composer: "Ernesto Nazareth",
    arranger: "Helena Vasconcellos Prado",
    formation: "Orquestra de cordas",
    level: 4,
    duration: "4'10\"",
    parts: 5,
    price: "R$ 212,40",
    premium: true,
    span: "lg:col-span-7",
  },
  {
    title: "Corta-jaca",
    composer: "Chiquinha Gonzaga",
    arranger: "Tomás Albuquerque Reis",
    formation: "Banda sinfônica",
    level: 3,
    duration: "3'25\"",
    parts: 31,
    price: "R$ 147,80",
    span: "lg:col-span-5",
  },
  {
    title: "Ave verum corpus",
    composer: "W. A. Mozart",
    arranger: "Lívia Sant'Anna Godoy",
    formation: "Coro SATB e órgão",
    level: 2,
    duration: "3'05\"",
    parts: 5,
    price: "R$ 68,30",
    span: "lg:col-span-4",
  },
  {
    title: "Jupiter, de Os Planetas",
    composer: "Gustav Holst",
    arranger: "Caio Medeiros Fontana",
    formation: "Banda sinfônica",
    level: 5,
    duration: "7'40\"",
    parts: 38,
    price: "R$ 236,70",
    premium: true,
    span: "lg:col-span-4",
  },
  {
    title: "Tico-tico no fubá",
    composer: "Zequinha de Abreu",
    arranger: "Beatriz Okamoto Lins",
    formation: "Big band",
    level: 4,
    duration: "2'50\"",
    parts: 17,
    price: "R$ 179,50",
    span: "lg:col-span-4",
  },
];

function LevelMeter({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Nível técnico ${level} de 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`h-3 w-px ${step <= level ? "bg-charcoal" : "bg-staff"}`}
        />
      ))}
    </span>
  );
}

function WorkCard({ work }: { work: Work }) {
  return (
    <article
      className={`reveal group flex flex-col justify-between rounded-md border border-staff bg-white p-7 shadow-[0_18px_40px_-34px_rgba(45,45,45,0.4)] transition duration-500 ease-gallery hover:-translate-y-1 hover:shadow-[0_28px_60px_-36px_rgba(45,45,45,0.45)] md:p-8 ${work.span}`}
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{work.formation}</p>
          {work.premium ? (
            <span className="shrink-0 rounded-md border border-copper px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-copper-deep">
              Premium
            </span>
          ) : null}
        </div>
        <h3 className="mt-6 font-playfair text-2xl leading-snug text-charcoal md:text-[1.7rem]">
          {work.title}
        </h3>
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
            <dd className="mt-1 tabular-nums text-ink">{work.duration}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Partes</dt>
            <dd className="mt-1 tabular-nums text-ink">{work.parts}</dd>
          </div>
        </dl>
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="font-semibold tabular-nums text-charcoal">{work.price}</p>
          <a
            href="#interesse"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-charcoal underline decoration-staff underline-offset-[6px] transition-colors duration-300 hover:decoration-copper"
            aria-label={`Adquirir obra: ${work.title}`}
          >
            Adquirir obra
            <ArrowUpRightIcon
              size={16}
              weight="light"
              aria-hidden="true"
              className="transition-transform duration-300 ease-gallery group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </article>
  );
}

export function Catalog() {
  return (
    <section id="acervo" className="border-t border-staff bg-paper-soft">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        <div className="reveal flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">
              Prévia do acervo
            </p>
            <h2 className="mt-5 max-w-[18ch] font-playfair text-3xl leading-tight text-charcoal md:text-5xl">
              Obras revisadas, prontas para o ensaio.
            </h2>
          </div>
          <p className="max-w-[42ch] text-base leading-relaxed text-muted">
            Cada arranjo chega com grade, partes cavadas e nível técnico indicado. Uma amostra do
            que estará disponível na abertura.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {works.map((work) => (
            <WorkCard key={work.title} work={work} />
          ))}
        </div>
      </div>
    </section>
  );
}
