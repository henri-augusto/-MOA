import { FORMATIONS, parsePriceToCents } from "./catalog";

export type WorkDraft = {
  title: string;
  composer: string;
  formation: string;
  level: string;
  minutes: string;
  seconds: string;
  partsCount: string;
  price: string;
  description: string;
};

export type WorkIntent = "rascunho" | "revisao";

export type FileSlot = "score" | "parts" | "audio";

export type WorkErrors = Partial<Record<keyof WorkDraft | "duration" | FileSlot, string>>;

export type WorkValues = {
  title: string;
  composer: string;
  formation: string;
  level: number;
  duration_seconds: number;
  parts_count: number;
  price_cents: number;
  description: string | null;
};

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const FILE_NAMES: Record<FileSlot, string> = {
  score: "grade.pdf",
  parts: "partes.pdf",
  audio: "audio-referencia",
};

export const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/flac",
];

function toInt(raw: string) {
  const trimmed = raw.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
}

export function validateWorkDraft(draft: WorkDraft): { errors: WorkErrors; values: WorkValues | null } {
  const errors: WorkErrors = {};

  const title = draft.title.trim();
  const composer = draft.composer.trim();
  const description = draft.description.trim();
  const level = toInt(draft.level);
  const minutes = draft.minutes.trim() ? toInt(draft.minutes) : 0;
  const seconds = draft.seconds.trim() ? toInt(draft.seconds) : 0;
  const partsCount = toInt(draft.partsCount);
  const priceCents = parsePriceToCents(draft.price);

  if (!title) errors.title = "Informe o título da obra.";
  else if (title.length > 160) errors.title = "Use até 160 caracteres.";

  if (!composer) errors.composer = "Informe o compositor.";
  else if (composer.length > 160) errors.composer = "Use até 160 caracteres.";

  if (!(FORMATIONS as readonly string[]).includes(draft.formation)) errors.formation = "Escolha a formação.";

  if (!(level >= 1 && level <= 5)) errors.level = "Escolha o nível técnico.";

  if (Number.isNaN(minutes) || Number.isNaN(seconds) || seconds > 59) {
    errors.duration = "Use minutos e segundos (0 a 59).";
  } else if (minutes * 60 + seconds <= 0) {
    errors.duration = "Informe a duração.";
  }

  if (!(partsCount >= 1 && partsCount <= 200)) errors.partsCount = "Informe quantas partes acompanham a grade.";

  if (priceCents === null) errors.price = "Use um valor como 149,90.";
  else if (priceCents < 500) errors.price = "O preço mínimo é R$ 5,00.";
  else if (priceCents > 500000) errors.price = "O preço máximo é R$ 5.000,00.";

  if (description.length > 1200) errors.description = "Use até 1.200 caracteres.";

  if (Object.keys(errors).length > 0) return { errors, values: null };

  return {
    errors,
    values: {
      title,
      composer,
      formation: draft.formation,
      level,
      duration_seconds: minutes * 60 + seconds,
      parts_count: partsCount,
      price_cents: priceCents as number,
      description: description || null,
    },
  };
}

export function validateFile(slot: FileSlot, file: File | null) {
  if (!file) return undefined;
  if (file.size > MAX_FILE_BYTES) return "O arquivo passa de 50 MB.";
  if (slot === "audio") {
    return AUDIO_TYPES.includes(file.type) ? undefined : "Use MP3, M4A, WAV, OGG ou FLAC.";
  }
  return file.type === "application/pdf" ? undefined : "Envie um arquivo PDF.";
}

export function reviewRequirementErrors(hasScore: boolean, hasParts: boolean): WorkErrors {
  const errors: WorkErrors = {};
  if (!hasScore) errors.score = "A revisão precisa da grade em PDF.";
  if (!hasParts) errors.parts = "A revisão precisa das partes em PDF.";
  return errors;
}
