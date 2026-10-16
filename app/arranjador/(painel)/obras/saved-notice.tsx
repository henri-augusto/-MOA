"use client";

import { useSearchParams } from "next/navigation";
import { FormAlert } from "@/components/studio/form";

const messages: Record<string, string> = {
  revisao: "Obra enviada para revisão. A curadoria avisa por e-mail quando ela for publicada.",
  rascunho: "Rascunho salvo.",
};

export function SavedNotice() {
  const saved = useSearchParams().get("salva");
  const message = saved ? messages[saved] : undefined;
  if (!message) return null;

  return (
    <div className="mt-8">
      <FormAlert tone="success">{message}</FormAlert>
    </div>
  );
}

export function UploadErrorNotice() {
  const failed = useSearchParams().get("erro") === "upload";
  if (!failed) return null;

  return (
    <div className="mt-8">
      <FormAlert>
        Os dados da obra ficaram salvos como rascunho, mas um dos arquivos não subiu. Escolha o arquivo de novo e salve.
      </FormAlert>
    </div>
  );
}
