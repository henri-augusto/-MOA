import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessChart, type DailyAccess } from "@/components/studio/access-chart";
import { primaryButtonClass, secondaryButtonClass } from "@/components/studio/form";
import { SectionSkeleton } from "@/components/studio/page-header";
import { StatusBadge } from "@/components/studio/status-badge";
import {
  STATUS_LABELS,
  displayName,
  formatBRL,
  formatInteger,
  type Profile,
  type WorkStatus,
} from "@/lib/arranger/catalog";
import { requireArranger } from "@/lib/arranger/session";

export const metadata: Metadata = {
  title: "Estúdio do arranjador — MOA",
};

const PERIOD_DAYS = 30;

type DailyRow = { day: string; pagina: number; audio: number; partitura: number };

type WorkMetricsRow = {
  work_id: string;
  title: string;
  status: WorkStatus;
  page_views: number;
  audio_plays: number;
  score_previews: number;
  sales_count: number;
  gross_cents: number;
  share_cents: number;
};

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-staff bg-white p-6">
      <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{label}</dt>
      <dd className="mt-4 font-playfair text-3xl tabular-nums text-charcoal md:text-4xl">{value}</dd>
      <dd className="mt-2 text-sm text-muted">{detail}</dd>
    </div>
  );
}

function ProfileNudge({ profile }: { profile: Pick<Profile, "artist_name" | "bio" | "formations"> | null }) {
  const incomplete = !profile?.bio || !profile.formations?.length;
  if (!incomplete) return null;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-md border border-copper bg-white p-6 md:flex-row md:items-center">
      <div>
        <p className="font-medium text-charcoal">Complete seu perfil público.</p>
        <p className="mt-1 text-sm text-muted">
          Regentes escolhem também por quem assina. Conte sua trajetória e as formações para as quais escreve.
        </p>
      </div>
      <Link href="/arranjador/perfil" className={`${secondaryButtonClass} shrink-0`}>
        Completar perfil
      </Link>
    </div>
  );
}

function FirstSteps() {
  const steps = [
    { title: "Complete o perfil", text: "Nome artístico, cidade e as formações que você atende.", href: "/arranjador/perfil" },
    { title: "Cadastre uma obra", text: "Dados do arranjo, grade, partes e áudio de referência.", href: "/arranjador/obras/nova" },
    { title: "Envie para revisão", text: "A curadoria confere o material e publica no acervo.", href: "/arranjador/obras" },
  ];

  return (
    <section aria-labelledby="primeiros-passos" className="rounded-md bg-charcoal p-8 md:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Primeiros passos</p>
      <h2 id="primeiros-passos" className="mt-4 max-w-[24ch] font-playfair text-2xl text-paper-soft md:text-3xl">
        Três passos até o seu primeiro arranjo no acervo.
      </h2>
      <ol className="mt-10 grid gap-px overflow-hidden rounded-md bg-white/10 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="bg-charcoal">
            <Link
              href={step.href}
              className="group flex h-full flex-col gap-3 p-6 transition-colors duration-300 hover:bg-white/[0.04]"
            >
              <span className="font-playfair text-xl italic text-copper tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-medium text-paper-soft">{step.title}</span>
              <span className="text-sm leading-relaxed text-[#C9C3B6]">{step.text}</span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href="/arranjador/obras/nova" className={`mt-10 ${primaryButtonClass}`}>
        <PlusIcon size={18} weight="bold" aria-hidden="true" />
        Cadastrar primeira obra
      </Link>
    </section>
  );
}

function SalesTable({ rows }: { rows: WorkMetricsRow[] }) {
  return (
    <section aria-labelledby="por-obra" className="rounded-md border border-staff bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-staff px-6 py-5 md:px-8">
        <h2 id="por-obra" className="text-sm font-medium text-charcoal">
          Obra por obra
        </h2>
        <Link
          href="/arranjador/obras"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-ink underline decoration-staff underline-offset-[6px] hover:decoration-copper"
        >
          Ver catálogo
          <ArrowRightIcon size={16} weight="light" aria-hidden="true" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th scope="col" className="px-6 py-3 font-medium md:px-8">Obra</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Acessos</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Audições</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Prévias</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Vendas</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Bruto</th>
              <th scope="col" className="px-6 py-3 text-right font-medium md:px-8">Repasse</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-staff border-t border-staff">
            {rows.map((row) => (
              <tr key={row.work_id} className="tabular-nums text-ink">
                <th scope="row" className="px-6 py-4 font-normal md:px-8">
                  <Link
                    href={`/arranjador/obras/${row.work_id}`}
                    className="flex items-center gap-3 font-medium text-charcoal hover:text-copper-deep"
                  >
                    <span className="max-w-[18rem] truncate">{row.title}</span>
                    <span className="sr-only">({STATUS_LABELS[row.status]})</span>
                    <span aria-hidden="true">
                      <StatusBadge status={row.status} />
                    </span>
                  </Link>
                </th>
                <td className="px-3 py-4 text-right">{formatInteger(row.page_views)}</td>
                <td className="px-3 py-4 text-right">{formatInteger(row.audio_plays)}</td>
                <td className="px-3 py-4 text-right">{formatInteger(row.score_previews)}</td>
                <td className="px-3 py-4 text-right">{formatInteger(row.sales_count)}</td>
                <td className="px-3 py-4 text-right">{formatBRL(row.gross_cents)}</td>
                <td className="px-6 py-4 text-right font-semibold text-charcoal md:px-8">{formatBRL(row.share_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function Greeting() {
  const { supabase, userId } = await requireArranger();
  const { data } = await supabase.from("profiles").select("artist_name, full_name").eq("id", userId).maybeSingle();
  return <>Olá, {displayName(data).split(" ")[0]}.</>;
}

async function Overview() {
  const { supabase, userId } = await requireArranger();

  const [profileResult, dailyResult, metricsResult] = await Promise.all([
    supabase.from("profiles").select("artist_name, bio, formations").eq("id", userId).maybeSingle(),
    supabase.rpc("arranger_daily_accesses", { p_days: PERIOD_DAYS }),
    supabase.rpc("arranger_work_metrics", { p_days: PERIOD_DAYS }),
  ]);

  if (dailyResult.error || metricsResult.error) {
    return (
      <p role="alert" className="rounded-md border border-[#A3412F]/40 bg-[#A3412F]/5 px-4 py-3 text-sm text-[#7E2F21]">
        Não foi possível carregar as métricas. Confira se o SQL do estúdio foi aplicado no Supabase.
      </p>
    );
  }

  const profile = profileResult.data as Pick<Profile, "artist_name" | "bio" | "formations"> | null;
  const works = ((metricsResult.data ?? []) as WorkMetricsRow[]).map((row) => ({
    ...row,
    page_views: Number(row.page_views),
    audio_plays: Number(row.audio_plays),
    score_previews: Number(row.score_previews),
    sales_count: Number(row.sales_count),
    gross_cents: Number(row.gross_cents),
    share_cents: Number(row.share_cents),
  }));

  if (works.length === 0) {
    return (
      <div className="grid gap-6">
        <ProfileNudge profile={profile} />
        <FirstSteps />
      </div>
    );
  }

  const series: DailyAccess[] = ((dailyResult.data ?? []) as DailyRow[]).map((row) => ({
    day: row.day,
    total: Number(row.pagina) + Number(row.audio) + Number(row.partitura),
  }));

  const totals = works.reduce(
    (sum, row) => ({
      pageViews: sum.pageViews + row.page_views,
      audioPlays: sum.audioPlays + row.audio_plays,
      sales: sum.sales + row.sales_count,
      share: sum.share + row.share_cents,
    }),
    { pageViews: 0, audioPlays: 0, sales: 0, share: 0 },
  );

  const byStatus = works.reduce<Record<WorkStatus, number>>(
    (count, row) => ({ ...count, [row.status]: count[row.status] + 1 }),
    { rascunho: 0, em_revisao: 0, publicado: 0 },
  );
  const published = byStatus.publicado;
  const noActivity = totals.pageViews + totals.audioPlays + totals.sales === 0;

  return (
    <div className="grid gap-6">
      <ProfileNudge profile={profile} />

      {noActivity ? (
        <p className="rounded-md border border-staff bg-paper-soft px-5 py-4 text-sm leading-relaxed text-muted">
          {published > 0
            ? "Ainda sem acessos ou vendas neste período. Os números entram assim que regentes abrirem suas obras no acervo."
            : "Os números começam quando a primeira obra for publicada e o acervo registrar acessos e vendas."}
        </p>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Acessos" value={formatInteger(totals.pageViews)} detail="Visitas às páginas das obras" />
        <Stat label="Audições" value={formatInteger(totals.audioPlays)} detail="Reproduções do áudio de referência" />
        <Stat label="Obras vendidas" value={formatInteger(totals.sales)} detail="Compras concluídas" />
        <Stat label="Repasse" value={formatBRL(totals.share)} detail="Sua parte nas vendas do período" />
      </dl>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <AccessChart series={series} />
        </div>
        <section aria-labelledby="catalogo-resumo" className="rounded-md border border-staff bg-white p-6 md:p-8 xl:col-span-4">
          <h2 id="catalogo-resumo" className="text-sm font-medium text-charcoal">
            Catálogo
          </h2>
          <ul className="mt-6 divide-y divide-staff">
            {(Object.keys(STATUS_LABELS) as WorkStatus[]).map((status) => (
              <li key={status} className="flex items-center justify-between py-3">
                <StatusBadge status={status} />
                <span className="font-playfair text-2xl tabular-nums text-charcoal">{byStatus[status]}</span>
              </li>
            ))}
          </ul>
          <Link href="/arranjador/obras/nova" className={`mt-6 w-full ${secondaryButtonClass}`}>
            <PlusIcon size={18} weight="bold" aria-hidden="true" />
            Nova obra
          </Link>
        </section>
      </div>

      <SalesTable rows={works} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <header className="flex flex-col justify-between gap-6 border-b border-staff pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">
            Últimos {PERIOD_DAYS} dias
          </p>
          <h1 className="mt-4 min-h-[1.2em] font-playfair text-3xl leading-tight text-charcoal md:text-4xl">
            <Suspense fallback="Seu estúdio.">
              <Greeting />
            </Suspense>
          </h1>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
            Acessos e vendas das suas obras, atualizados a cada visita ao painel.
          </p>
        </div>
      </header>
      <div className="mt-10">
        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <Overview />
        </Suspense>
      </div>
    </>
  );
}
