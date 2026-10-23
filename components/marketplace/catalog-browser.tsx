"use client";

import { FunnelIcon } from "@phosphor-icons/react/dist/csr/Funnel";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useMemo, useState } from "react";
import { inputClass, secondaryButtonClass } from "@/components/studio/form";
import { FORMATIONS } from "@/lib/arranger/catalog";
import type { Listing } from "@/lib/marketplace/types";
import { ProductCard } from "./product-card";

type DurationFilter = "todas" | "curta" | "media" | "longa";
type SortOption = "destaque" | "preco-asc" | "preco-desc" | "titulo" | "nivel";

const SECTION_LIMIT = 6;

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesDuration(seconds: number, duration: DurationFilter) {
  if (duration === "curta") return seconds <= 240;
  if (duration === "media") return seconds > 240 && seconds <= 360;
  if (duration === "longa") return seconds > 360;
  return true;
}

function sortListings(list: Listing[], sort: SortOption) {
  const next = [...list];
  if (sort === "preco-asc") next.sort((a, b) => a.priceCents - b.priceCents);
  else if (sort === "preco-desc") next.sort((a, b) => b.priceCents - a.priceCents);
  else if (sort === "titulo") next.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  else if (sort === "nivel") next.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title, "pt-BR"));
  return next;
}

function groupByFormation(list: Listing[]) {
  const buckets = new Map<string, Listing[]>();
  for (const work of list) {
    const bucket = buckets.get(work.formation) ?? [];
    bucket.push(work);
    buckets.set(work.formation, bucket);
  }

  const knownOrder = new Set<string>(FORMATIONS);
  const sections = FORMATIONS.filter((formation) => buckets.has(formation)).map((formation) => ({
    formation,
    works: buckets.get(formation)!,
  }));

  const extras = [...buckets.keys()]
    .filter((formation) => !knownOrder.has(formation))
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((formation) => ({
      formation,
      works: buckets.get(formation)!,
    }));

  return [...sections, ...extras];
}

type ActivePill = { key: string; label: string; clear: () => void };

export function CatalogBrowser({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState("");
  const [formation, setFormation] = useState("todas");
  const [level, setLevel] = useState("todos");
  const [duration, setDuration] = useState<DurationFilter>("todas");
  const [sort, setSort] = useState<SortOption>("destaque");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const formations = useMemo(
    () => Array.from(new Set(listings.map((work) => work.formation))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [listings],
  );

  const needle = fold(query.trim());
  const filtered = listings.filter((work) => {
    if (formation !== "todas" && work.formation !== formation) return false;
    if (level !== "todos" && work.level > Number(level)) return false;
    if (!matchesDuration(work.durationSeconds, duration)) return false;
    if (!needle) return true;
    const haystack = fold(`${work.title} ${work.composer} ${work.arranger} ${work.formation}`);
    return haystack.includes(needle);
  });
  const results = sortListings(filtered, sort);
  const sections = useMemo(() => groupByFormation(results), [results]);

  const pills: ActivePill[] = [];
  if (needle) pills.push({ key: "q", label: `Busca: ${query.trim()}`, clear: () => setQuery("") });
  if (formation !== "todas") {
    pills.push({ key: "f", label: formation, clear: () => setFormation("todas") });
  }
  if (level !== "todos") {
    pills.push({ key: "l", label: `Nível até ${level}`, clear: () => setLevel("todos") });
  }
  if (duration !== "todas") {
    const labels = { curta: "Até 4 min", media: "4 a 6 min", longa: "Acima de 6 min" } as const;
    pills.push({ key: "d", label: labels[duration], clear: () => setDuration("todas") });
  }

  const filtering = pills.length > 0;
  const drawerFilterCount = pills.filter((pill) => pill.key !== "q").length;

  function clearFilters() {
    setQuery("");
    setFormation("todas");
    setLevel("todos");
    setDuration("todas");
  }

  function toggleExpanded(name: string) {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const filterFields = (
    <>
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
    </>
  );

  return (
    <div>
      <div className="sticky top-[4.75rem] z-20 -mx-4 border-y border-staff bg-paper/95 px-4 py-4 backdrop-blur-md md:-mx-8 md:px-8">
        <form role="search" className="relative" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="acervo-busca" className="sr-only">
            Buscar no acervo
          </label>
          <MagnifyingGlassIcon
            size={20}
            weight="light"
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          />
          <input
            id="acervo-busca"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, compositor ou arranjador"
            className={`${inputClass} border-staff pl-12 pr-12 text-base shadow-[0_12px_28px_-24px_rgba(45,45,45,0.45)]`}
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-charcoal"
              aria-label="Limpar busca"
            >
              <XIcon size={18} weight="light" />
            </button>
          ) : null}
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-charcoal px-4 text-sm font-medium text-charcoal lg:hidden"
          >
            <FunnelIcon size={16} weight="light" aria-hidden="true" />
            Filtros
            {drawerFilterCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-copper px-1.5 text-xs font-semibold text-charcoal">
                {drawerFilterCount}
              </span>
            ) : null}
          </button>

          <p aria-live="polite" className="text-sm text-muted">
            {results.length === 0
              ? "Nenhuma obra"
              : results.length === 1
                ? "1 obra"
                : `${results.length} obras`}
          </p>

          <label className="flex min-h-11 items-center gap-2 text-sm text-charcoal">
            <span className="text-muted">Ordenar</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="min-h-11 rounded-md border border-staff bg-white px-3 text-sm text-charcoal focus:border-charcoal focus:outline-none"
            >
              <option value="destaque">Destaque</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
              <option value="titulo">Título A–Z</option>
              <option value="nivel">Nível</option>
            </select>
          </label>
        </div>
      </div>

      <form
        className="mt-6 hidden gap-4 lg:grid lg:grid-cols-3"
        onSubmit={(event) => event.preventDefault()}
      >
        {filterFields}
      </form>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros do acervo">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/40"
            aria-label="Fechar filtros"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col bg-paper-soft shadow-[-12px_0_40px_-20px_rgba(45,45,45,0.35)]">
            <div className="flex items-center justify-between border-b border-staff px-5 py-4">
              <p className="font-medium text-charcoal">Filtros</p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-md text-charcoal"
                aria-label="Fechar"
              >
                <XIcon size={20} weight="light" />
              </button>
            </div>
            <form
              className="grid flex-1 content-start gap-4 overflow-y-auto px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                setFiltersOpen(false);
              }}
            >
              {filterFields}
            </form>
            <div className="grid gap-2 border-t border-staff p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {filtering ? (
                <button type="button" onClick={clearFilters} className={secondaryButtonClass}>
                  Limpar filtros
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-copper px-6 text-sm font-semibold text-charcoal"
              >
                Ver {results.length === 1 ? "1 obra" : `${results.length} obras`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pills.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {pills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={pill.clear}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-staff bg-white px-3 text-sm text-charcoal transition-colors hover:border-charcoal"
            >
              {pill.label}
              <XIcon size={12} weight="bold" aria-hidden="true" />
              <span className="sr-only">Remover filtro</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-9 px-2 text-sm font-medium text-muted underline decoration-staff underline-offset-4 hover:text-charcoal hover:decoration-copper"
          >
            Limpar tudo
          </button>
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div className="mt-10 space-y-14">
          {sections.map((section, sectionIndex) => {
            const isOpen = Boolean(expanded[section.formation]);
            const visible = isOpen ? section.works : section.works.slice(0, SECTION_LIMIT);
            const hasMore = section.works.length > SECTION_LIMIT;
            const remaining = section.works.length - SECTION_LIMIT;

            return (
              <section key={section.formation} aria-labelledby={`formacao-${sectionIndex}`}>
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-staff pb-3">
                  <h2
                    id={`formacao-${sectionIndex}`}
                    className="font-playfair text-2xl leading-tight text-charcoal md:text-3xl"
                  >
                    {section.formation}
                  </h2>
                  <p className="text-sm text-muted">
                    {section.works.length === 1 ? "1 obra" : `${section.works.length} obras`}
                  </p>
                </div>

                <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
                  {visible.map((work, index) => (
                    <li key={work.id} className="min-w-0">
                      <ProductCard work={work} priority={sectionIndex === 0 && index < 4} />
                    </li>
                  ))}
                </ul>

                {hasMore ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(section.formation)}
                      className={secondaryButtonClass}
                      aria-expanded={isOpen}
                    >
                      {isOpen
                        ? "Mostrar menos"
                        : remaining === 1
                          ? "Ver mais 1 obra"
                          : `Ver mais ${remaining} obras`}
                    </button>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-dashed border-staff bg-paper-soft px-6 py-16 text-center">
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
