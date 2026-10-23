import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { formatDuration } from "@/lib/arranger/catalog";
import { supabaseEnv } from "@/lib/supabase/env";
import { layoutFixtures } from "./layout-fixtures";
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
  has_audio: boolean;
  can_purchase?: boolean;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createPublicClient() {
  const { url, publishableKey } = supabaseEnv();
  // These RPCs are granted to anon. A cookie session would call getSession(),
  // which compares the JWT expiry with Date.now() and fails prerender.
  return createSupabaseClient(url, publishableKey, {
    accessToken: async () => null,
  });
}

function withLayoutFixtures(listings: Listing[]) {
  if (process.env.NODE_ENV === "production") return listings;
  const ids = new Set(listings.map((work) => work.id));
  return [...listings, ...layoutFixtures.filter((work) => !ids.has(work.id))];
}

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
    hasAudio: Boolean(row.has_audio),
    canPurchase: Boolean(row.can_purchase),
  };
}

export async function listPublishedWorks() {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("published_catalog");
  if (error) throw error;
  return withLayoutFixtures(((data ?? []) as PublishedRow[]).map(toListing));
}

export async function getPublishedWork(id: string) {
  if (!UUID_PATTERN.test(id)) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("published_work", { p_id: id });
  if (error) throw error;

  const rows = (data ?? []) as PublishedRow[];
  const row = rows[0];
  if (row) return toListing(row);
  if (process.env.NODE_ENV === "production") return null;
  return layoutFixtures.find((work) => work.id === id) ?? null;
}
