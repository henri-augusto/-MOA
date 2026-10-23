import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import Link from "next/link";
import { Suspense } from "react";
import { HeroScore, HeroScoreSkeleton } from "./hero-score";
import { Baton } from "./logo";

const formations = ["Orquestras", "Bandas sinfônicas", "Coros", "Grupos de câmara"];

export function Hero() {
  return (
    <section
      id="inicio"
      className="mx-auto grid min-h-[calc(100dvh-5.5rem)] max-w-7xl grid-cols-1 items-center gap-16 px-4 pb-24 pt-16 md:px-8 lg:grid-cols-12 lg:gap-10 lg:pt-10"
    >
      <div className="lg:col-span-6 xl:col-span-5">
        <p
          className="animate-rise text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep"
          style={{ animationDelay: "60ms" }}
        >
          Master of Arrangement
        </p>
        <h1
          className="animate-rise mt-6 font-playfair text-[2.6rem] leading-[1.05] tracking-tight text-charcoal md:text-6xl"
          style={{ animationDelay: "140ms" }}
        >
          Arranjos à altura <em className="font-normal italic text-ink">do seu conjunto.</em>
        </h1>
        <p
          className="animate-rise mt-7 max-w-[52ch] text-lg leading-relaxed text-muted"
          style={{ animationDelay: "220ms" }}
        >
          Um acervo curado de partituras para orquestras, bandas e coros. Regentes adquirem
          arranjos prontos para a estante; arranjadores publicam suas obras e recebem a cada
          venda.
        </p>

        <div
          className="animate-rise mt-10 flex flex-col gap-3 sm:flex-row"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/acervo"
            className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-copper px-6 text-sm font-semibold text-charcoal transition duration-300 hover:bg-[#B8924B] active:scale-[0.98]"
          >
            Explorar o acervo
            <ArrowRightIcon
              size={18}
              weight="light"
              className="transition-transform duration-300 ease-gallery group-hover:translate-x-1"
            />
          </Link>
          <a
            href="/arranjador/cadastro"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-charcoal px-6 text-sm font-medium text-charcoal transition duration-300 hover:bg-charcoal hover:text-paper-soft active:scale-[0.98]"
          >
            Sou arranjador
          </a>
        </div>

        <Baton className="animate-rise mt-14 h-4 w-64 opacity-90" />

        <ul
          className="animate-rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
          style={{ animationDelay: "380ms" }}
          aria-label="Formações atendidas"
        >
          {formations.map((formation) => (
            <li key={formation} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-1 rounded-full bg-copper" />
              {formation}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto w-full max-w-md lg:col-span-6 lg:col-start-7 xl:col-span-6 xl:col-start-7 xl:max-w-lg">
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden translate-x-6 translate-y-5 rotate-[3deg] rounded-sm border border-staff bg-paper-soft md:block"
        />
        <Suspense fallback={<HeroScoreSkeleton />}>
          <HeroScore />
        </Suspense>
      </div>
    </section>
  );
}
