import "server-only";

import { io } from "next/cache";
import { formatDuration } from "@/lib/arranger/catalog";
import { ARRANGEMENTS_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "./types";

export type { Listing };

type PublishedRow = {
  id: string;
  title: string;
  composer: string;
  formation: string;
  level: number;
  duration_seconds: number;
  parts_count: number;
  price_cents: number;
  description: string | null;
  arranger_name: string;
  preview_video_id: string | null;
  has_preview: boolean;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toListing(row: PublishedRow): Listing {
  return {
    id: row.id,
    title: row.title,
    composer: row.composer,
    arranger: row.arranger_name,
    formation: row.formation,
    level: row.level,
    durationLabel: formatDuration(row.duration_seconds),
    durationSeconds: row.duration_seconds,
    parts: row.parts_count,
    priceCents: row.price_cents,
    description:
      row.description?.trim() ||
      `Arranjo de ${row.arranger_name} para ${row.formation}, com grade e partes cavadas.`,
    previewVideoId: row.preview_video_id,
    hasPreview: Boolean(row.has_preview),
  };
}

export async function listPublishedWorks() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("published_catalog");
  if (error) throw error;
  return ((data ?? []) as PublishedRow[]).map(toListing);
}

export async function getPublishedWork(id: string) {
  if (!UUID_PATTERN.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("published_work", { p_id: id });
  if (error) throw error;

  const rows = (data ?? []) as PublishedRow[];
  const row = rows[0];
  return row ? toListing(row) : null;
}

const SIGNED_URL_SECONDS = 120;

export async function getOwnedPreviewSources(workId: string) {
  try {
    await io();

    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) return null;

    const { data: owned } = await supabase
      .from("works")
      .select("score_path, preview_path")
      .eq("id", workId)
      .eq("arranger_id", userId)
      .eq("status", "publicado")
      .maybeSingle();

    if (!owned || (!owned.score_path && !owned.preview_path)) return null;

    const paths = [owned.score_path, owned.preview_path].filter((path): path is string => Boolean(path));
    const signed = new Map<string, string>();
    const { data: links } = await supabase.storage.from(ARRANGEMENTS_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    links?.forEach((entry) => {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    });

    return {
      scoreUrl: owned.score_path ? (signed.get(owned.score_path) ?? null) : null,
      previewUrl: owned.preview_path ? (signed.get(owned.preview_path) ?? null) : null,
    };
  } catch {
    return null;
  }
}
