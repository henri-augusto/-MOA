import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import { StatusBadge } from "@/components/studio/status-badge";
import type { Work } from "@/lib/arranger/catalog";
import { requireArranger } from "@/lib/arranger/session";
import { ARRANGEMENTS_BUCKET } from "@/lib/supabase/env";
import { UploadErrorNotice } from "../saved-notice";
import { WorkForm, type ExistingFiles } from "../work-form";
import { DeleteWorkButton } from "./delete-work-button";

export const metadata: Metadata = {
  title: "Editar obra — Estúdio do arranjador — MOA",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_SECONDS = 60 * 60;

async function EditWork({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const { supabase, userId } = await requireArranger();
  const { data: work } = await supabase
    .from("works")
    .select("*")
    .eq("id", id)
    .eq("arranger_id", userId)
    .maybeSingle<Work>();

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

  const files: ExistingFiles = {
    score: work.score_path ? (signed.get(work.score_path) ?? null) : null,
    parts: work.parts_path ? (signed.get(work.parts_path) ?? null) : null,
    audio: work.audio_path ? (signed.get(work.audio_path) ?? null) : null,
    preview: work.preview_path ? (signed.get(work.preview_path) ?? null) : null,
  };

  return (
    <>
      <PageHeader
        eyebrow="Editar obra"
        title={work.title}
        description={`${work.composer} · ${work.formation}`}
        actions={<StatusBadge status={work.status} />}
      />
      <Suspense fallback={null}>
        <UploadErrorNotice />
      </Suspense>
      <div className="mt-10">
        <WorkForm key={work.updated_at} userId={userId} work={work} files={files} />
      </div>
      {work.status === "rascunho" ? (
        <div className="mt-16 border-t border-staff pt-8">
          <DeleteWorkButton workId={work.id} title={work.title} />
        </div>
      ) : null}
    </>
  );
}

export default function EditWorkPage({ params }: PageProps<"/arranjador/obras/[id]">) {
  return (
    <>
      <Link href="/arranjador/obras" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-charcoal">
        ← Obras
      </Link>
      <div className="mt-4">
        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <EditWork params={params} />
        </Suspense>
      </div>
    </>
  );
}
