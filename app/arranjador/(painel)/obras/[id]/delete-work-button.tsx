"use client";

import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { useState, useTransition } from "react";
import { FormAlert } from "@/components/studio/form";
import { deleteWork } from "../actions";

export function DeleteWorkButton({ workId, title }: { workId: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteWork(workId);
      if (result && !result.ok) setError(result.error ?? "Não foi possível excluir a obra.");
    });
  }

  return (
    <div className="grid max-w-xl gap-4">
      <div>
        <p className="text-sm font-medium text-charcoal">Excluir rascunho</p>
        <p className="mt-1 text-sm text-muted">Remove os dados e os arquivos enviados. Não dá para desfazer.</p>
      </div>
      {error ? <FormAlert>{error}</FormAlert> : null}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#A3412F] px-4 text-sm font-semibold text-white transition duration-300 hover:bg-[#8C3727] active:scale-[0.98] disabled:opacity-60"
          >
            <TrashIcon size={18} weight="light" aria-hidden="true" />
            {pending ? "Excluindo…" : `Excluir “${title}”`}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted hover:text-charcoal"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-[#A3412F]/50 px-4 text-sm font-medium text-[#A3412F] transition-colors duration-300 hover:bg-[#A3412F]/5"
        >
          <TrashIcon size={18} weight="light" aria-hidden="true" />
          Excluir obra
        </button>
      )}
    </div>
  );
}
