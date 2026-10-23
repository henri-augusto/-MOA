"use server";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { authSiteOrigin } from "@/lib/request-origin";
import { splitSale } from "@/lib/payments/fees";
import { isPaymentsReady } from "@/lib/payments/env";
import { getStripe } from "@/lib/payments/stripe";
import { createAccessToken, hashAccessToken } from "@/lib/payments/tokens";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutInput = {
  workId: string;
  name: string;
  email: string;
  ensemble: string;
  accepted: boolean;
};

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

function checkoutIntegrationId() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(8);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `moa_acervo_${suffix}`;
}

type WorkForCheckout = {
  id: string;
  title: string;
  price_cents: number;
  status: string;
  arranger_id: string;
  profiles: {
    stripe_account_id: string | null;
    payouts_ready: boolean;
  } | null;
};

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  if (!isPaymentsReady()) {
    return { ok: false, error: "O pagamento ainda não está ligado neste ambiente." };
  }

  if (!UUID_PATTERN.test(input.workId)) {
    return { ok: false, error: "Obra inválida." };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const ensemble = input.ensemble.trim();

  if (name.length < 3) return { ok: false, error: "Informe o nome de quem adquire." };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "Informe um e-mail válido." };
  if (ensemble.length < 2) return { ok: false, error: "Informe o conjunto ou a instituição." };
  if (!input.accepted) return { ok: false, error: "Confirme que a aquisição é para esse conjunto." };

  const supabase = createAdminClient();
  const { data: work, error: workError } = await supabase
    .from("works")
    .select("id, title, price_cents, status, arranger_id, profiles!arranger_id ( stripe_account_id, payouts_ready )")
    .eq("id", input.workId)
    .maybeSingle();

  if (workError) {
    console.error("createCheckout: falha ao consultar a obra", workError.message);
    const invalidKey = /invalid api key/i.test(workError.message);
    return {
      ok: false,
      error: invalidKey
        ? "Pagamento indisponível: a chave de serviço do Supabase não está configurada."
        : "Não foi possível consultar a obra. Tente novamente.",
    };
  }

  if (!work) {
    return { ok: false, error: "Obra não encontrada." };
  }

  const listing = work as unknown as WorkForCheckout;
  if (listing.status !== "publicado") {
    return { ok: false, error: "Esta obra não está disponível para compra." };
  }

  const stripeAccountId = listing.profiles?.stripe_account_id;
  if (!stripeAccountId || !listing.profiles?.payouts_ready) {
    return { ok: false, error: "O arranjador ainda não concluiu o cadastro de recebimento." };
  }

  const { grossCents, platformFeeCents, arrangerShareCents } = splitSale(listing.price_cents);
  if (grossCents <= 0) {
    return { ok: false, error: "Preço inválido para cobrança." };
  }

  let origin: string;
  try {
    origin = await authSiteOrigin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível abrir o pagamento.";
    return { ok: false, error: message };
  }

  const accessToken = createAccessToken();
  const accessTokenHash = hashAccessToken(accessToken);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      work_id: listing.id,
      arranger_id: listing.arranger_id,
      buyer_name: name,
      buyer_email: email,
      ensemble,
      gross_cents: grossCents,
      platform_fee_cents: platformFeeCents,
      arranger_share_cents: arrangerShareCents,
      status: "pending",
      access_token_hash: accessTokenHash,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, error: "Não foi possível abrir o pedido. Tente novamente." };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale: "pt-BR",
        customer_email: email,
        client_reference_id: String(order.id),
        integration_identifier: checkoutIntegrationId(),
        success_url: `${origin}/pedido/${accessToken}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/acervo/${listing.id}/adquirir`,
        metadata: {
          order_id: String(order.id),
          work_id: listing.id,
          arranger_id: listing.arranger_id,
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "brl",
              unit_amount: grossCents,
              product_data: {
                name: listing.title,
                description: `Arranjo para ${ensemble}`,
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: platformFeeCents,
          transfer_data: {
            destination: stripeAccountId,
          },
          receipt_email: email,
          description: `MOA · ${listing.title}`,
          metadata: {
            order_id: String(order.id),
            work_id: listing.id,
            arranger_id: listing.arranger_id,
          },
        },
      },
      {
        idempotencyKey: `checkout_${order.id}`,
      },
    );

    if (!session.url) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      return { ok: false, error: "Stripe não devolveu a página de pagamento." };
    }

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (paymentIntentId) {
      const { error: linkError } = await supabase
        .from("orders")
        .update({ stripe_payment_intent_id: paymentIntentId })
        .eq("id", order.id);

      if (linkError) {
        return { ok: false, error: "Pedido criado, mas falhou ao vincular o pagamento." };
      }
    }

    return { ok: true, url: session.url };
  } catch (err) {
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    const message = err instanceof Error ? err.message : "Falha ao criar a cobrança.";
    return { ok: false, error: message };
  }
}
