import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AcquireFlow } from "@/components/marketplace/acquire-flow";
import { PreviewNote } from "@/components/marketplace/preview-note";
import { getPublishedWork } from "@/lib/marketplace/catalog";
import { isPaymentsReady } from "@/lib/payments/env";

export async function generateMetadata({
  params,
}: PageProps<"/acervo/[id]/adquirir">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getPublishedWork(id);
  if (!listing) return { title: "Adquirir obra — MOA" };
  return {
    title: `Adquirir ${listing.title} — MOA`,
    description: `Aquisição de ${listing.title}, arranjo de ${listing.arranger}. Pagamento único, sem mensalidade.`,
  };
}

async function Acquire({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getPublishedWork(id);
  if (!listing) notFound();

  const paymentsEnabled = isPaymentsReady();

  return (
    <>
      {paymentsEnabled ? null : <PreviewNote />}
      <div className={paymentsEnabled ? undefined : "mt-10"}>
        <AcquireFlow listing={listing} paymentsEnabled={paymentsEnabled} />
      </div>
    </>
  );
}

export default function AcquirePage({ params }: PageProps<"/acervo/[id]/adquirir">) {
  return (
    <Suspense fallback={<div className="h-96 rounded-md bg-staff/70" aria-hidden="true" />}>
      <Acquire params={params} />
    </Suspense>
  );
}
