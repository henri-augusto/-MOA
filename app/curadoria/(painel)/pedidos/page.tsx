import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormAlert } from "@/components/studio/form";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import { formatBRL } from "@/lib/arranger/catalog";
import { requireCurator } from "@/lib/arranger/session";
import { isPaymentsReady } from "@/lib/payments/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { RefundButton } from "./refund-button";

export const metadata: Metadata = {
  title: "Pedidos — Curadoria — MOA",
};

type OrderListRow = {
  id: number;
  buyer_name: string;
  buyer_email: string;
  ensemble: string;
  gross_cents: number;
  status: "pending" | "paid" | "refunded" | "failed";
  paid_at: string | null;
  created_at: string;
  works: { title: string } | null;
};

const STATUS_LABEL: Record<OrderListRow["status"], string> = {
  pending: "Pendente",
  paid: "Pago",
  refunded: "Reembolsado",
  failed: "Falhou",
};

async function PedidosContent() {
  await requireCurator();

  if (!isPaymentsReady()) {
    return (
      <FormAlert tone="success">
        Configure as chaves do Stripe e a service role do Supabase para listar e reembolsar pedidos.
      </FormAlert>
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, buyer_name, buyer_email, ensemble, gross_cents, status, paid_at, created_at, works ( title )")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return <FormAlert>Não foi possível carregar os pedidos.</FormAlert>;
  }

  const rows = (data ?? []) as unknown as OrderListRow[];
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-staff bg-paper-soft px-6 py-16 text-center">
        <p className="text-sm text-muted">Nenhum pedido ainda.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-staff overflow-hidden rounded-md border border-staff bg-white">
      {rows.map((order) => (
        <li key={order.id} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-6">
          <div>
            <p className="font-medium text-charcoal">{order.works?.title ?? "Obra"}</p>
            <p className="mt-1 text-sm text-ink">
              {order.buyer_name} · {order.ensemble}
            </p>
            <p className="mt-1 text-sm text-muted">{order.buyer_email}</p>
            <p className="mt-2 text-sm text-muted">
              #{order.id} · {STATUS_LABEL[order.status]} · {formatBRL(order.gross_cents)}
              {order.paid_at ? ` · pago em ${new Date(order.paid_at).toLocaleString("pt-BR")}` : null}
            </p>
          </div>
          {order.status === "paid" ? <RefundButton orderId={order.id} /> : null}
        </li>
      ))}
    </ul>
  );
}

export default function PedidosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pedidos"
        title="Vendas do acervo."
        description="Reembolse pelo botão abaixo para o Stripe reverter o repasse e a comissão juntos."
      />
      <p className="mt-4 text-sm text-muted">
        <Link href="/curadoria" className="text-charcoal underline-offset-2 hover:underline">
          Voltar à fila
        </Link>
      </p>
      <div className="mt-10">
        <Suspense fallback={<SectionSkeleton />}>
          <PedidosContent />
        </Suspense>
      </div>
    </>
  );
}
