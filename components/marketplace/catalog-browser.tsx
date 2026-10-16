"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ScoreSheet } from "@/components/landing/score-sheet";
import { inputClass, secondaryButtonClass } from "@/components/studio/form";
import { formatBRL } from "@/lib/arranger/catalog";
import type { Listing } from "@/lib/marketplace/types";
import { scoreSystems } from "@/lib/marketplace/score";
import { LevelMeter } from "./level-meter";

type DurationFilter = "todas" | "curta" | "media" | "longa";

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesDuration(seconds: number, duration: DurationFilter) {
  if (duration === "curta") return seconds <= 240;
  if (duration === "media") return seconds > 240 && seconds <= 360;
  if (duration === "longa") return seconds > 360;
  return true;
}

export function CatalogBrowser({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState("");
  const [formation, setFormation] = useState("todas");
  const [level, setLevel] = useState("todos");
  const [duration, setDuration] = useState<DurationFilter>("todas");

  const formations = useMemo(
    () => Array.from(new Set(listings.map((work) => work.formation))),
    [listings],
  );

  const needle = fold(query.trim());
  const results = listings.filter((work) => {
    if (formation !== "todas" && work.formation !== formation) return false;
    if (level !== "todos" && work.level > Number(level)) return false;
    if (!matchesDuration(work.durationSeconds, duration)) return false;
    if (!needle) return true;
    const haystack = fold(`${work.title} ${work.composer} ${work.arranger} ${work.formation}`);
    return haystack.includes(needle);
  });

  const filtering = Boolean(needle) || formation !== "todas" || level !== "todos" || duration !== "todas";
  const [featured, ...rest] = results;

  function clearFilters() {
    setQuery("");
    setFormation("todas");
    setLevel("todos");
    setDuration("todas");
  }

  return (
    <div>
      <form
        role="search"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_10rem_12rem]"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="grid gap-2 text-sm font-medium text-charcoal xl:col-span-1">
          Buscar
          <span className="relative">
            <MagnifyingGlassIcon
              size={18}
              weight="light"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Título, compositor, arranjador"
              className={`${inputClass} pl-10`}
              autoComplete="off"
            />
          </span>
        </label>

        <label className="grid gap-2 text-sm font-medium text-charcoal">
          Formação
          <select value={formation} onChange={(event) => setFormation(event.target.value)} className={inputClass}>
            <option value="todas">Todas</option>
            {formations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-charcoal">
          Nível até
          <select value={level} onChange={(event) => setLevel(event.target.value)} className={inputClass}>
            <option value="todos">Qualquer</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-charcoal">
          Duração
          <select
            value={duration}
            onChange={(event) => setDuration(event.target.value as DurationFilter)}
            className={inputClass}
          >
            <option value="todas">Qualquer</option>
            <option value="curta">Até 4 minutos</option>
            <option value="media">De 4 a 6 minutos</option>
            <option value="longa">Acima de 6 minutos</option>
          </select>
        </label>
      </form>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm text-muted">
          {results.length === 0 ? "Nenhuma obra" : results.length === 1 ? "1 obra" : `${results.length} obras`}
        </p>
        {filtering ? (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-11 text-sm font-medium text-charcoal underline decoration-staff underline-offset-[6px] hover:decoration-copper"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      {featured ? (
        <div className="mt-6 grid items-start gap-10 lg:grid-cols-12">
          <FeaturedWork work={featured} />
          {rest.length > 0 ? (
            <ul className="divide-y divide-staff border-y border-staff lg:col-span-5">
              {rest.map((work) => (
                <li key={work.id}>
                  <WorkRow work={work} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-staff bg-paper-soft px-6 py-16 text-center">
          <p className="font-playfair text-2xl text-charcoal">Nenhuma obra com esses filtros.</p>
          <p className="mx-auto mt-3 max-w-[42ch] leading-relaxed text-muted">
            Alargue o nível, a duração ou limpe a busca para voltar ao acervo.
          </p>
          <button type="button" onClick={clearFilters} className={`mt-8 ${secondaryButtonClass}`}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

function FeaturedWork({ work }: { work: Listing }) {
  return (
    <article className="lg:col-span-7">
      <Link
        href={`/acervo/${work.id}`}
        className="group block overflow-hidden rounded-md border border-staff bg-white shadow-[0_18px_40px_-34px_rgba(45,45,45,0.4)] transition duration-500 ease-gallery hover:-translate-y-1 hover:shadow-[0_28px_60px_-36px_rgba(45,45,45,0.45)]"
      >
        <div aria-hidden="true" className="h-64 overflow-hidden border-b border-staff bg-white sm:h-72">
          <ScoreSheet
            className="h-auto w-full"
            title={work.title}
            subtitle={work.formation}
            composer={work.composer}
            arranger={work.arranger}
            systems={scoreSystems(work.id)}
          />
        </div>
        <div className="p-7 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{work.formation}</p>
          <h2 className="mt-5 font-playfair text-3xl leading-tight text-charcoal">{work.title}</h2>
          <p className="mt-2 text-sm text-ink">{work.composer}</p>
          <p className="text-sm text-muted">arr. {work.arranger}</p>
          <WorkFacts work={work} />
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-lg font-semibold tabular-nums text-charcoal">{formatBRL(work.priceCents)}</p>
            <span className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-charcoal underline decoration-staff underline-offset-[6px] group-hover:decoration-copper">
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

function WorkRow({ work }: { work: Listing }) {
  return (
    <Link
      href={`/acervo/${work.id}`}
      className="group grid gap-4 py-6 transition-colors duration-300 hover:bg-paper-soft md:grid-cols-[1fr_auto] md:items-center md:px-2"
    >
      <span className="min-w-0">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{work.formation}</span>
        <span className="mt-2 block truncate font-playfair text-2xl text-charcoal">{work.title}</span>
        <span className="mt-1 block text-sm text-ink">
          {work.composer}
          <span className="text-muted"> · arr. {work.arranger}</span>
        </span>
        <span className="mt-2 block text-sm tabular-nums text-muted">
          Nível {work.level} · {work.durationLabel} · {work.parts} partes
        </span>
      </span>
      <span className="flex items-center justify-between gap-6 md:justify-end">
        <span className="font-semibold tabular-nums text-charcoal">{formatBRL(work.priceCents)}</span>
        <ArrowRightIcon
          size={18}
          weight="light"
          aria-hidden="true"
          className="shrink-0 text-muted transition-transform duration-300 ease-gallery group-hover:translate-x-1 group-hover:text-charcoal"
        />
      </span>
    </Link>
  );
}

function WorkFacts({ work }: { work: Listing }) {
  return (
    <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-staff pt-5 text-sm">
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
  );
}
