"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PREVIEWS_BUCKET } from "@/lib/supabase/env";

const started = new Set<string>();

type EnsurePublicPreviewProps = {
  workId: string;
  scoreUrl: string | null;
  previewUrl: string | null;
  refresh?: boolean;
};

export function EnsurePublicPreview({ workId, scoreUrl, previewUrl, refresh = false }: EnsurePublicPreviewProps) {
  const router = useRouter();
  const [message, setMessage] = useState("Gerando a prévia da primeira página…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.has(workId)) return;
    started.add(workId);
    let cancelled = false;

    async function publish() {
      try {
        const blob = await previewBlob(previewUrl, scoreUrl);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const supabase = createClient();
        const { error } = await supabase.storage.from(PREVIEWS_BUCKET).upload(`${workId}.jpg`, bytes, {
          contentType: "image/jpeg",
          cacheControl: "86400",
          upsert: false,
        });

        if (error && !alreadyStored(error)) {
          started.delete(workId);
          if (!cancelled) {
            setFailed(true);
            setMessage(
              "Não foi possível publicar a prévia da primeira página. Confira se o SQL da prévia pública foi aplicado no Supabase e atualize a página.",
            );
          }
          return;
        }

        if (refresh) {
          router.refresh();
          return;
        }
        if (!cancelled) setMessage("A prévia da primeira página está no acervo.");
      } catch {
        started.delete(workId);
        if (!cancelled) {
          setFailed(true);
          setMessage("Não foi possível gerar a prévia da primeira página a partir da grade.");
        }
      }
    }

    void publish();
    return () => {
      cancelled = true;
    };
  }, [previewUrl, refresh, router, scoreUrl, workId]);

  return <p className={`mt-4 text-sm ${failed ? "text-[#A3412F]" : "text-muted"}`}>{message}</p>;
}

async function previewBlob(previewUrl: string | null, scoreUrl: string | null) {
  if (previewUrl) {
    const response = await fetch(previewUrl);
    if (!response.ok) throw new Error("preview");
    return response.blob();
  }

  if (!scoreUrl) throw new Error("score");
  const response = await fetch(scoreUrl);
  if (!response.ok) throw new Error("score");
  const file = new File([await response.blob()], "grade.pdf", { type: "application/pdf" });
  const { renderScorePreview } = await import("@/lib/arranger/score-preview");
  return renderScorePreview(file);
}

function alreadyStored(error: { message: string; status?: number; statusCode?: string | number }) {
  const status = String(error.statusCode ?? error.status ?? "");
  return status === "409" || /already exists|duplicate/i.test(error.message);
}
