import type { Metadata } from "next";
import { Suspense } from "react";
import { FormAlert } from "@/components/studio/form";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import { PayoutsPanel } from "@/components/studio/payouts-panel";
import { requireArranger } from "@/lib/arranger/session";
import { isPaymentsReady, stripePublishableKey } from "@/lib/payments/env";

export const metadata: Metadata = {
  title: "Recebimentos — Estúdio do arranjador — MOA",
};

async function RecebimentosContent() {
  const { supabase, userId } = await requireArranger();

  if (!isPaymentsReady()) {
    return (
      <FormAlert tone="success">
        Os recebimentos com Stripe ainda não estão configurados neste ambiente. Defina as chaves em
        .env.local para liberar o cadastro bancário.
      </FormAlert>
    );
  }

  const { data } = await supabase
    .from("profiles")
    .select("stripe_account_id, payouts_ready")
    .eq("id", userId)
    .maybeSingle();

  return (
    <PayoutsPanel
      publishableKey={stripePublishableKey()}
      payoutsReady={Boolean(data?.payouts_ready)}
      hasAccount={Boolean(data?.stripe_account_id)}
    />
  );
}

export default function RecebimentosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Recebimentos"
        title="Para onde vai o repasse."
        description="Cadastre sua conta bancária no Stripe. A cada venda no acervo, a MOA fica com a comissão e o restante cai na sua conta."
      />
      <div className="mt-10">
        <Suspense fallback={<SectionSkeleton />}>
          <RecebimentosContent />
        </Suspense>
      </div>
    </>
  );
}
