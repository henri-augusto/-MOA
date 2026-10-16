import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { YoutubeEmbed } from "@/components/marketplace/youtube-embed";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import { StatusBadge } from "@/components/studio/status-badge";
import {
  displayName,
  formatBRL,
  formatDuration,
  type Work,
} from "@/lib/arranger/catalog";
import { requireCurator } from "@/lib/arranger/session";
import { youtubeWatchUrl } from "@/lib/arranger/youtube";
import { ARRANGEMENTS_BUCKET } from "@/lib/supabase/env";
import { ReviewActions } from "./review-actions";

export const metadata: Metadata = {
  title: "Revisar obra — Curadoria — MOA",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_SECONDS = 60 * 60;

type ReviewWork = Work & {
  arranger_id: string;
  profiles: { artist_name: string | null; full_name: string; city: string | null } | null;
};

async function ReviewWorkDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const { supabase } = await requireCurator();
  const { data: work } = await supabase
    .from("works")
    .select("*, profiles!arranger_id ( artist_name, full_name, city )")
    .eq("id", id)
    .eq("status", "em_revisao")
    .maybeSingle<ReviewWork>();

  if (!work) notFound();

  const paths = [work.score_path, work.parts_path, work.audio_path, work.preview_path].filter(
    (path): path is string => Boolean(path),
  );
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage.from(ARRANGEMENTS_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    data?.forEach((entry) => {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    });
  }

  const scoreUrl = work.score_path ? signed.get(work.score_path) : undefined;
  const partsUrl = work.parts_path ? signed.get(work.parts_path) : undefined;
  const audioUrl = work.audio_path ? signed.get(work.audio_path) : undefined;
  const previewUrl = work.preview_path ? signed.get(work.preview_path) : undefined;

  const facts = [
    { label: "Compositor", value: work.composer },
    { label: "Formação", value: work.formation },
    { label: "Nível", value: String(work.level) },
    { label: "Duração", value: formatDuration(work.duration_seconds) },
    { label: "Partes", value: String(work.parts_count) },
    { label: "Preço", value: formatBRL(work.price_cents) },
    {
      label: "Arranjador",
      value: work.profiles
        ? `${displayName(work.profiles)}${work.profiles.city ? ` · ${work.profiles.city}` : ""}`
        : "—",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Revisar obra"
        title={work.title}
        description={`${work.composer} · ${work.formation}`}
        actions={<StatusBadge status={work.status} />}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="grid content-start gap-6 lg:col-span-7">
          <dl className="grid gap-4 rounded-md border border-staff bg-white p-6 sm:grid-cols-2 md:p-8">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted">{fact.label}</dt>
                <dd className="mt-2 text-sm text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {work.description ? (
            <div className="rounded-md border border-staff bg-white p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Descrição</p>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink">{work.description}</p>
            </div>
          ) : null}

          {work.preview_video_id ? (
            <div className="rounded-md border border-staff bg-white p-6 md:p-8">
              <p className="text-sm font-medium text-charcoal">Vídeo no YouTube</p>
              <p className="mt-1 text-sm text-muted">
                <a
                  href={youtubeWatchUrl(work.preview_video_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-charcoal underline decoration-staff underline-offset-4 hover:decoration-copper"
                >
                  Abrir no YouTube
                </a>
              </p>
              <div className="mt-4">
                <YoutubeEmbed videoId={work.preview_video_id} title={work.title} />
              </div>
            </div>
          ) : null}

          {previewUrl ? (
            <div className="rounded-md border border-staff bg-white p-6 md:p-8">
              <p className="text-sm font-medium text-charcoal">Prévia da primeira página</p>
              <p className="mt-1 text-sm text-muted">Imagem que irá ao acervo público na aprovação.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Prévia da grade de ${work.title}`}
                className="mt-4 w-full rounded-sm border border-staff object-contain"
              />
            </div>
          ) : (
            <div className="rounded-md border border-staff bg-white p-6 md:p-8">
              <p className="text-sm font-medium text-charcoal">Prévia da primeira página</p>
              <p className="mt-3 text-sm text-[#A3412F]">
                Ausente. Na publicação o acervo usa o desenho placeholder; peça ao arranjador para reenviar a grade.
              </p>
            </div>
          )}

          <div className="rounded-md border border-staff bg-white p-6 md:p-8">
            <p className="text-sm font-medium text-charcoal">Arquivos</p>
            <ul className="mt-6 divide-y divide-staff">
              <FileRow label="Grade" hint="PDF da partitura completa" url={scoreUrl} />
              <FileRow label="Partes" hint="PDF das partes" url={partsUrl} />
              <li className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-charcoal">Áudio de referência</p>
                <p className="mt-1 text-sm text-muted">Opcional</p>
                {audioUrl ? (
                  <audio controls src={audioUrl} className="mt-4 w-full" preload="metadata">
                    Seu navegador não reproduz este áudio.
                  </audio>
                ) : (
                  <p className="mt-3 text-sm text-muted">Não enviado.</p>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-5">
          <ReviewActions workId={work.id} title={work.title} />
        </div>
      </div>
    </>
  );
}

function FileRow({ label, hint, url }: { label: string; hint: string; url?: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-md border border-charcoal px-4 text-sm font-medium text-charcoal transition duration-300 hover:bg-charcoal hover:text-paper-soft"
        >
          Abrir PDF
        </a>
      ) : (
        <p className="text-sm text-[#A3412F]">Arquivo ausente</p>
      )}
    </li>
  );
}

export default function ReviewWorkPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/curadoria" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-charcoal">
        ← Fila
      </Link>
      <div className="mt-4">
        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <ReviewWorkDetail params={params} />
        </Suspense>
      </div>
    </>
  );
}
