import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr/SealCheck";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/studio/form";
import { formatBRL } from "@/lib/arranger/catalog";
import { getOrderByAccessToken, getOrderWorkFiles } from "@/lib/payments/orders";
import { reconcilePendingOrder } from "@/lib/payments/reconcile";
import { OrderStatusPoller } from "./status-poller";

export const metadata: Metadata = {
  title: "Seu pedido — MOA",
  robots: { index: false, follow: false },
};

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

async function PedidoContent({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  if (!TOKEN_PATTERN.test(token)) notFound();

  const loaded = await getOrderByAccessToken(token);
  if (!loaded) notFound();
  const sessionId = Array.isArray(query.session_id) ? query.session_id[0] : query.session_id;
  const order = await reconcilePendingOrder(loaded, sessionId);

  const work = await getOrderWorkFiles(order.work_id);
  const title = work?.title ?? "Obra";
  const price = formatBRL(order.gross_cents);

  if (order.status === "pending") {
    return (
      <div>
        <h1 className="max-w-[22ch] font-playfair text-4xl leading-tight text-charcoal md:text-5xl">
          Confirmando o pagamento…
        </h1>
        <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted">
          O Stripe ainda está processando. Esta página atualiza sozinha quando o pagamento for confirmado.
        </p>
        <OrderStatusPoller token={token} />
        <dl className="mt-10 divide-y divide-staff border-y border-staff text-sm">
          <Row term="Obra" value={title} />
          <Row term="Para" value={order.ensemble} />
          <Row term="Contato" value={`${order.buyer_name} · ${order.buyer_email}`} />
          <Row term="Total" value={price} />
        </dl>
      </div>
    );
  }

  if (order.status === "failed") {
    return (
      <div>
        <h1 className="max-w-[22ch] font-playfair text-4xl leading-tight text-charcoal md:text-5xl">
          Pagamento não concluído.
        </h1>
        <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted">
          Nada foi liberado. Você pode tentar de novo a partir da página da obra.
        </p>
        <Link href={`/acervo/${order.work_id}/adquirir`} className={`mt-8 inline-flex ${primaryButtonClass}`}>
          Tentar novamente
        </Link>
      </div>
    );
  }

  if (order.status === "refunded") {
    return (
      <div>
        <h1 className="max-w-[22ch] font-playfair text-4xl leading-tight text-charcoal md:text-5xl">
          Pedido reembolsado.
        </h1>
        <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted">
          O valor foi estornado e os arquivos desta compra não estão mais disponíveis.
        </p>
        <Link href="/acervo" className={`mt-8 inline-flex ${secondaryButtonClass}`}>
          Voltar ao acervo
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start gap-4">
        <SealCheckIcon size={32} weight="light" className="mt-1 shrink-0 text-copper" aria-hidden="true" />
        <div>
          <h1 className="max-w-[22ch] font-playfair text-4xl leading-tight text-charcoal md:text-5xl">
            Pagamento confirmado.
          </h1>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted">
            {title} ficou registrada para {order.ensemble}. Guarde este link: ele é a chave do download.
          </p>
        </div>
      </div>

      <dl className="mt-10 divide-y divide-staff border-y border-staff text-sm">
        <Row term="Obra" value={title} />
        <Row term="Para" value={order.ensemble} />
        <Row term="Contato" value={`${order.buyer_name} · ${order.buyer_email}`} />
        <Row term="Total pago" value={price} />
      </dl>

      <h2 className="mt-12 font-playfair text-2xl text-charcoal">Downloads</h2>
      <ul className="mt-4 divide-y divide-staff border-y border-staff text-sm">
        <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-ink">Grade completa</span>
          {work?.score_path ? (
            <a href={`/pedido/${token}/arquivo/grade`} className={primaryButtonClass}>
              Baixar PDF
            </a>
          ) : (
            <span className="text-muted">Arquivo indisponível</span>
          )}
        </li>
        <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-ink">{work?.parts_count ?? "—"} partes cavadas</span>
          {work?.parts_path ? (
            <a href={`/pedido/${token}/arquivo/partes`} className={primaryButtonClass}>
              Baixar PDF
            </a>
          ) : (
            <span className="text-muted">Arquivo indisponível</span>
          )}
        </li>
      </ul>

      <Link href="/acervo" className={`mt-10 inline-flex ${secondaryButtonClass}`}>
        Continuar no acervo
      </Link>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
      <dt className="text-muted">{term}</dt>
      <dd className="text-charcoal">{value}</dd>
    </div>
  );
}

export default function PedidoPage({ params, searchParams }: PageProps<"/pedido/[token]">) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-staff/70" aria-hidden="true" />}>
        <PedidoContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
