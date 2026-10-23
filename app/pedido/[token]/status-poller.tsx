"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OrderStatusPoller({ token }: { token: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const sessionId = new URLSearchParams(window.location.search).get("session_id");
        const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
        const response = await fetch(`/pedido/${token}/status${query}`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { status?: string };
        if (data.status && data.status !== "pending") {
          router.refresh();
        }
      } catch {
        // Mantém o polling; falhas transitórias são esperadas.
      }
    }

    const id = window.setInterval(tick, 2500);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [router, token]);

  return (
    <p className="mt-6 text-sm text-muted" role="status">
      Aguardando confirmação do Stripe…
    </p>
  );
}
