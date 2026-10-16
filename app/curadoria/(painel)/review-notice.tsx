"use client";

import { useSearchParams } from "next/navigation";
import { FormAlert } from "@/components/studio/form";

const messages: Record<string, string> = {
  aprovada: "Obra publicada no acervo.",
  devolvida: "Obra devolvida ao arranjador com o seu recado.",
};

export function ReviewNotice() {
  const done = useSearchParams().get("feita");
  const message = done ? messages[done] : undefined;
  if (!message) return null;

  return (
    <div className="mt-8">
      <FormAlert tone="success">{message}</FormAlert>
    </div>
  );
}
