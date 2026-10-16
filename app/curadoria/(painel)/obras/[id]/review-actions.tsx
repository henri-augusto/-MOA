"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/csr/Check";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowCounterClockwise";
import { useState, useTransition } from "react";
import {
  Field,
  FormAlert,
  borderFor,
  describedBy,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/studio/form";
import { approveWork, returnWork } from "../../actions";

const NOTE_MAX = 500;

export function ReviewActions({ workId, title }: { workId: string; title: string }) {
  const [mode, setMode] = useState<"idle" | "approve" | "return">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveWork(workId);
      if (result && !result.ok) setError(result.error);
    });
  }

  function returnToDraft() {
    setError(null);
    startTransition(async () => {
      const result = await returnWork(workId, note);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="grid gap-6 rounded-md border border-staff bg-white p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-charcoal">Decisão</p>
        <p className="mt-1 text-sm text-muted">
          Publicar coloca a obra no acervo. Devolver envia de volta ao rascunho do arranjador com o seu recado.
        </p>
      </div>

      {error ? <FormAlert>{error}</FormAlert> : null}

      {mode === "idle" ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setMode("approve")} className={primaryButtonClass}>
            <CheckIcon size={18} weight="bold" aria-hidden="true" />
            Aprovar
          </button>
          <button type="button" onClick={() => setMode("return")} className={secondaryButtonClass}>
            <ArrowCounterClockwiseIcon size={18} weight="light" aria-hidden="true" />
            Devolver
          </button>
        </div>
      ) : null}

      {mode === "approve" ? (
        <div className="grid gap-4">
          <p className="text-sm text-ink">
            Publicar <span className="font-medium">“{title}”</span> no acervo? O arranjador deixa de editar a obra.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={approve} disabled={pending} className={primaryButtonClass}>
              {pending ? "Publicando…" : "Confirmar publicação"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
              disabled={pending}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {mode === "return" ? (
        <div className="grid gap-4">
          <Field
            id="curadoria-recado"
            label="Recado para o arranjador"
            hint="Explique o que precisa mudar. Ele vê o texto na obra."
            error={note.trim().length > 0 && note.trim().length < 8 ? "Use ao menos 8 caracteres." : undefined}
          >
            <textarea
              id="curadoria-recado"
              name="note"
              rows={4}
              maxLength={NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex.: A grade está ok, mas faltam as partes do naipe de metais."
              aria-invalid={note.trim().length > 0 && note.trim().length < 8}
              aria-describedby={describedBy(
                "curadoria-recado",
                note.trim().length > 0 && note.trim().length < 8 ? "erro" : undefined,
                "Explique o que precisa mudar. Ele vê o texto na obra.",
              )}
              className={`${inputClass} min-h-28 resize-y py-3 ${borderFor(
                note.trim().length > 0 && note.trim().length < 8 ? "erro" : undefined,
              )}`}
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={returnToDraft}
              disabled={pending || note.trim().length < 8}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#A3412F] px-6 text-sm font-semibold text-white transition duration-300 hover:bg-[#8C3727] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Devolvendo…" : "Devolver para rascunho"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setNote("");
                setError(null);
              }}
              disabled={pending}
              className={secondaryButtonClass}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
