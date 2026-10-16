export const FORMATIONS = [
  "Orquestra sinfônica",
  "Orquestra de cordas",
  "Banda sinfônica",
  "Banda de música",
  "Big band",
  "Coro SATB",
  "Coro e órgão",
  "Coro infantojuvenil",
  "Grupo de câmara",
  "Quarteto de cordas",
  "Quinteto de metais",
  "Quinteto de sopros",
] as const;

export type WorkStatus = "rascunho" | "em_revisao" | "publicado";

export const STATUS_LABELS: Record<WorkStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  publicado: "Publicada",
};

export type Work = {
  id: string;
  title: string;
  composer: string;
  formation: string;
  level: number;
  duration_seconds: number;
  parts_count: number;
  price_cents: number;
  description: string | null;
  status: WorkStatus;
  score_path: string | null;
  parts_path: string | null;
  audio_path: string | null;
  preview_path: string | null;
  preview_video_id: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  artist_name: string | null;
  city: string | null;
  bio: string | null;
  formations: string[];
  is_curator?: boolean;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const integer = new Intl.NumberFormat("pt-BR");

export function formatBRL(cents: number) {
  return brl.format(cents / 100);
}

export function formatInteger(value: number) {
  return integer.format(value);
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}'${String(rest).padStart(2, "0")}"`;
}

export function priceInputValue(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Accepts "212,40", "212.40", "1.212,40" or "R$ 212". Returns null when unreadable. */
export function parsePriceToCents(raw: string) {
  const cleaned = raw.replace(/[R$\s]/g, "");
  if (!cleaned) return null;

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  return Math.round(Number(normalized) * 100);
}

export function displayName(profile: Pick<Profile, "artist_name" | "full_name"> | null) {
  return profile?.artist_name?.trim() || profile?.full_name?.trim() || "Arranjador";
}
