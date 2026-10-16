"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { FilePdfIcon } from "@phosphor-icons/react/dist/csr/FilePdf";
import { WaveformIcon } from "@phosphor-icons/react/dist/csr/Waveform";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Field,
  FormAlert,
  borderFor,
  describedBy,
  errorTextClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/studio/form";
import { FORMATIONS, priceInputValue, type Work } from "@/lib/arranger/catalog";
import {
  AUDIO_TYPES,
  FILE_NAMES,
  reviewRequirementErrors,
  validateFile,
  validateWorkDraft,
  type FileSlot,
  type WorkDraft,
  type WorkErrors,
  type WorkIntent,
} from "@/lib/arranger/work-form";
import { createClient } from "@/lib/supabase/client";
import { ARRANGEMENTS_BUCKET } from "@/lib/supabase/env";
import { attachWorkFiles, saveWorkDetails } from "./actions";

export type ExistingFiles = Record<FileSlot, string | null>;

const LEVELS = [
  { value: "1", label: "1 — Iniciante" },
  { value: "2", label: "2 — Básico" },
  { value: "3", label: "3 — Intermediário" },
  { value: "4", label: "4 — Avançado" },
  { value: "5", label: "5 — Profissional" },
];

const SLOTS: { slot: FileSlot; label: string; hint: string; accept: string }[] = [
  { slot: "score", label: "Grade completa", hint: "PDF, até 50 MB.", accept: "application/pdf" },
  { slot: "parts", label: "Partes cavadas", hint: "Todas as partes em um único PDF, até 50 MB.", accept: "application/pdf" },
  { slot: "audio", label: "Áudio de referência", hint: "Opcional. MP3, M4A, WAV, OGG ou FLAC, até 50 MB.", accept: AUDIO_TYPES.join(",") },
];

const SLOT_NAMES: Record<FileSlot, string> = { score: "a grade", parts: "as partes", audio: "o áudio" };

const FIELD_ORDER: (keyof WorkErrors)[] = [
  "title",
  "composer",
  "formation",
  "level",
  "duration",
  "partsCount",
  "price",
  "description",
  "score",
  "parts",
  "audio",
];

const FIELD_IDS: Partial<Record<keyof WorkErrors, string>> = {
  title: "obra-titulo",
  composer: "obra-compositor",
  formation: "obra-formacao",
  level: "obra-nivel",
  duration: "obra-minutos",
  partsCount: "obra-partes",
  price: "obra-preco",
  description: "obra-descricao",
  score: "obra-arquivo-score",
  parts: "obra-arquivo-parts",
  audio: "obra-arquivo-audio",
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function focusFirstError(errors: WorkErrors) {
  const first = FIELD_ORDER.find((key) => errors[key]);
  const id = first ? FIELD_IDS[first] : undefined;
  if (id) document.getElementById(id)?.focus();
}

type Phase = { kind: "idle" } | { kind: "busy"; label: string };

type WorkFormProps = {
  userId: string;
  work: Work | null;
  files: ExistingFiles;
};

export function WorkForm({ userId, work, files }: WorkFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<WorkErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [selected, setSelected] = useState<Record<FileSlot, File | null>>({ score: null, parts: null, audio: null });

  const readOnly = work?.status === "publicado";
  const busy = phase.kind === "busy";

  function pickFile(slot: FileSlot, file: File | null) {
    setSelected((current) => ({ ...current, [slot]: file }));
    setErrors((current) => ({ ...current, [slot]: validateFile(slot, file) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || readOnly) return;

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent: WorkIntent = submitter?.value === "revisao" ? "revisao" : "rascunho";
    const data = new FormData(event.currentTarget);
    const draft: WorkDraft = {
      title: String(data.get("title") ?? ""),
      composer: String(data.get("composer") ?? ""),
      formation: String(data.get("formation") ?? ""),
      level: String(data.get("level") ?? ""),
      minutes: String(data.get("minutes") ?? ""),
      seconds: String(data.get("seconds") ?? ""),
      partsCount: String(data.get("partsCount") ?? ""),
      price: String(data.get("price") ?? ""),
      description: String(data.get("description") ?? ""),
    };

    const nextErrors: WorkErrors = { ...validateWorkDraft(draft).errors };
    for (const { slot } of SLOTS) {
      const fileError = validateFile(slot, selected[slot]);
      if (fileError) nextErrors[slot] = fileError;
    }
    if (intent === "revisao") {
      const missing = reviewRequirementErrors(Boolean(selected.score || files.score), Boolean(selected.parts || files.parts));
      for (const slot of ["score", "parts"] as const) {
        nextErrors[slot] ??= missing[slot];
      }
    }

    setFormError(null);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstError(nextErrors);
      return;
    }

    setPhase({ kind: "busy", label: "Salvando dados da obra…" });
    const saved = await saveWorkDetails(work?.id ?? null, draft);
    if (!saved.ok) {
      setPhase({ kind: "idle" });
      setErrors(saved.fieldErrors ?? {});
      setFormError(saved.error ?? "Revise os campos destacados.");
      if (saved.fieldErrors) focusFirstError(saved.fieldErrors);
      return;
    }

    const supabase = createClient();
    const uploaded: FileSlot[] = [];
    for (const { slot } of SLOTS) {
      const file = selected[slot];
      if (!file) continue;

      setPhase({ kind: "busy", label: `Enviando ${SLOT_NAMES[slot]}…` });
      const { error } = await supabase.storage
        .from(ARRANGEMENTS_BUCKET)
        .upload(`${userId}/${saved.id}/${FILE_NAMES[slot]}`, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (error) {
        await attachWorkFiles(saved.id, uploaded, "rascunho");
        setPhase({ kind: "idle" });
        const message = `Não foi possível enviar ${SLOT_NAMES[slot]}. Os dados ficaram salvos como rascunho; tente anexar o arquivo de novo.`;
        if (work) {
          setFormError(message);
          router.refresh();
        } else {
          router.replace(`/arranjador/obras/${saved.id}?erro=upload`);
        }
        return;
      }
      uploaded.push(slot);
    }

    setPhase({ kind: "busy", label: "Registrando arquivos…" });
    const attached = await attachWorkFiles(saved.id, uploaded, intent);
    if (!attached.ok) {
      setPhase({ kind: "idle" });
      setErrors(attached.fieldErrors ?? {});
      setFormError(attached.error ?? "Não foi possível concluir.");
      if (!work) router.replace(`/arranjador/obras/${saved.id}`);
      return;
    }

    router.push(`/arranjador/obras?salva=${intent}`);
  }

  const durationMinutes = work ? String(Math.floor(work.duration_seconds / 60)) : "";
  const durationSeconds = work ? String(work.duration_seconds % 60) : "";
  const inReview = work?.status === "em_revisao";

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-12">
      <fieldset disabled={busy || readOnly} className="grid min-w-0 content-start gap-6 lg:col-span-7">
        <legend className="sr-only">Dados da obra</legend>

        {readOnly ? (
          <FormAlert tone="success">
            Esta obra está publicada no acervo. Alterações passam pela curadoria: escreva para contato@moa.art.br.
          </FormAlert>
        ) : null}
        {formError ? <FormAlert>{formError}</FormAlert> : null}

        <Field id="obra-titulo" label="Título" error={errors.title}>
          <input
            id="obra-titulo"
            name="title"
            type="text"
            defaultValue={work?.title}
            placeholder="Odeon"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("obra-titulo", errors.title)}
            className={`${inputClass} ${borderFor(errors.title)}`}
          />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field id="obra-compositor" label="Compositor" error={errors.composer}>
            <input
              id="obra-compositor"
              name="composer"
              type="text"
              defaultValue={work?.composer}
              placeholder="Ernesto Nazareth"
              aria-invalid={Boolean(errors.composer)}
              aria-describedby={describedBy("obra-compositor", errors.composer)}
              className={`${inputClass} ${borderFor(errors.composer)}`}
            />
          </Field>

          <Field id="obra-formacao" label="Formação" error={errors.formation}>
            <select
              id="obra-formacao"
              name="formation"
              defaultValue={work?.formation ?? ""}
              aria-invalid={Boolean(errors.formation)}
              aria-describedby={describedBy("obra-formacao", errors.formation)}
              className={`${inputClass} ${borderFor(errors.formation)}`}
            >
              <option value="" disabled>
                Escolha
              </option>
              {FORMATIONS.map((formation) => (
                <option key={formation} value={formation}>
                  {formation}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field id="obra-nivel" label="Nível técnico" error={errors.level}>
            <select
              id="obra-nivel"
              name="level"
              defaultValue={work ? String(work.level) : ""}
              aria-invalid={Boolean(errors.level)}
              aria-describedby={describedBy("obra-nivel", errors.level)}
              className={`${inputClass} ${borderFor(errors.level)}`}
            >
              <option value="" disabled>
                Escolha
              </option>
              {LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="grid content-start gap-2" aria-describedby={errors.duration ? "obra-duracao-erro" : undefined}>
            <legend className="mb-2 text-sm font-medium text-charcoal">Duração</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <span className="sr-only">Minutos</span>
                <input
                  id="obra-minutos"
                  name="minutes"
                  type="text"
                  inputMode="numeric"
                  defaultValue={durationMinutes}
                  placeholder="4"
                  aria-invalid={Boolean(errors.duration)}
                  className={`${inputClass} pr-14 tabular-nums ${borderFor(errors.duration)}`}
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  min
                </span>
              </label>
              <label className="relative">
                <span className="sr-only">Segundos</span>
                <input
                  name="seconds"
                  type="text"
                  inputMode="numeric"
                  defaultValue={durationSeconds}
                  placeholder="10"
                  aria-invalid={Boolean(errors.duration)}
                  className={`${inputClass} pr-12 tabular-nums ${borderFor(errors.duration)}`}
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                  s
                </span>
              </label>
            </div>
            {errors.duration ? (
              <p id="obra-duracao-erro" className={errorTextClass}>
                {errors.duration}
              </p>
            ) : null}
          </fieldset>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field id="obra-partes" label="Número de partes" error={errors.partsCount}>
            <input
              id="obra-partes"
              name="partsCount"
              type="text"
              inputMode="numeric"
              defaultValue={work ? String(work.parts_count) : ""}
              placeholder="31"
              aria-invalid={Boolean(errors.partsCount)}
              aria-describedby={describedBy("obra-partes", errors.partsCount)}
              className={`${inputClass} tabular-nums ${borderFor(errors.partsCount)}`}
            />
          </Field>

          <Field id="obra-preco" label="Preço" error={errors.price} hint="Valor pago pelo conjunto por obra.">
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                R$
              </span>
              <input
                id="obra-preco"
                name="price"
                type="text"
                inputMode="decimal"
                defaultValue={work ? priceInputValue(work.price_cents) : ""}
                placeholder="149,90"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={describedBy("obra-preco", errors.price, "Valor pago pelo conjunto por obra.")}
                className={`${inputClass} pl-11 tabular-nums ${borderFor(errors.price)}`}
              />
            </div>
          </Field>
        </div>

        <Field
          id="obra-descricao"
          label="Notas para o regente"
          error={errors.description}
          hint="Opcional. Instrumentação detalhada, divisi, tessitura do coro, observações de execução."
        >
          <textarea
            id="obra-descricao"
            name="description"
            rows={5}
            defaultValue={work?.description ?? ""}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy(
              "obra-descricao",
              errors.description,
              "Opcional. Instrumentação detalhada, divisi, tessitura do coro, observações de execução.",
            )}
            className={`${inputClass} min-h-32 py-3 leading-relaxed ${borderFor(errors.description)}`}
          />
        </Field>
      </fieldset>

      <div className="grid content-start gap-6 lg:col-span-5">
        <fieldset disabled={busy || readOnly} className="rounded-md border border-staff bg-white p-6 md:p-8">
          <legend className="sr-only">Arquivos</legend>
          <p aria-hidden="true" className="text-sm font-medium text-charcoal">
            Arquivos
          </p>
          <p className="mt-1 text-sm text-muted">Ficam privados até a curadoria publicar a obra.</p>

          <ul className="mt-6 divide-y divide-staff">
            {SLOTS.map(({ slot, label, hint, accept }) => (
              <FileSlotRow
                key={slot}
                slot={slot}
                label={label}
                hint={hint}
                accept={accept}
                existingUrl={files[slot]}
                file={selected[slot]}
                error={errors[slot]}
                onPick={(file) => pickFile(slot, file)}
              />
            ))}
          </ul>
        </fieldset>

        {readOnly ? null : (
          <div className="grid gap-3">
            <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted">
              {phase.kind === "busy" ? phase.label : null}
            </p>
            <button type="submit" name="intent" value="revisao" disabled={busy} className={primaryButtonClass}>
              {inReview ? "Salvar e manter em revisão" : "Enviar para revisão"}
            </button>
            <button type="submit" name="intent" value="rascunho" disabled={busy} className={secondaryButtonClass}>
              {inReview ? "Voltar para rascunho" : "Salvar rascunho"}
            </button>
            <p className="text-sm leading-relaxed text-muted">
              A curadoria confere grade, partes e metadados antes de publicar. Rascunhos ficam visíveis só para você.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

type FileSlotRowProps = {
  slot: FileSlot;
  label: string;
  hint: string;
  accept: string;
  existingUrl: string | null;
  file: File | null;
  error?: string;
  onPick: (file: File | null) => void;
};

function FileSlotRow({ slot, label, hint, accept, existingUrl, file, error, onPick }: FileSlotRowProps) {
  const id = `obra-arquivo-${slot}`;
  const SlotIcon = slot === "audio" ? WaveformIcon : FilePdfIcon;

  return (
    <li className="grid gap-3 py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <SlotIcon size={22} weight="light" className="mt-0.5 shrink-0 text-copper-deep" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="text-sm font-medium text-charcoal">
            {label}
          </label>
          {existingUrl && !file ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircleIcon size={16} weight="fill" className="text-copper" aria-hidden="true" />
                Enviado
              </span>
              {slot === "audio" ? null : (
                <a
                  href={existingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-charcoal underline decoration-staff underline-offset-4 hover:decoration-copper"
                >
                  Abrir PDF
                </a>
              )}
            </p>
          ) : null}
          {file ? (
            <p className="mt-1 truncate text-sm text-ink">
              {file.name} · <span className="tabular-nums text-muted">{formatBytes(file.size)}</span>
            </p>
          ) : null}
        </div>
      </div>

      {slot === "audio" && existingUrl && !file ? (
        <audio controls preload="none" src={existingUrl} className="w-full">
          Seu navegador não reproduz este áudio.
        </audio>
      ) : null}

      <input
        id={id}
        type="file"
        accept={accept}
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-erro` : `${id}-ajuda`}
        className="block w-full text-sm text-muted file:mr-4 file:min-h-11 file:cursor-pointer file:rounded-md file:border file:border-charcoal file:bg-transparent file:px-4 file:text-sm file:font-medium file:text-charcoal file:transition-colors file:duration-300 hover:file:bg-charcoal hover:file:text-paper-soft"
      />
      {error ? (
        <p id={`${id}-erro`} className={errorTextClass}>
          {error}
        </p>
      ) : (
        <p id={`${id}-ajuda`} className="text-sm text-muted">
          {existingUrl ? `Escolha outro arquivo para substituir. ${hint}` : hint}
        </p>
      )}
    </li>
  );
}
