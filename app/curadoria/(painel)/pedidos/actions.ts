"use server";

import { revalidatePath } from "next/cache";
import { requireCurator } from "@/lib/arranger/session";
import { isPaymentsReady } from "@/lib/payments/env";
import { getOrderByPaymentIntent, markOrderRefunded } from "@/lib/payments/orders";
import { getStripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type RefundState = {
  error?: string;
  success?: string;
};

export async function refundOrder(_prev: RefundState, formData: FormData): Promise<RefundState> {
  await requireCurator();

  if (!isPaymentsReady()) {
    return { error: "Pagamentos não estão configurados neste ambiente." };
  }

  const orderId = Number(formData.get("orderId"));
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return { error: "Pedido inválido." };
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, stripe_payment_intent_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return { error: "Pedido não encontrado." };
  if (order.status === "refunded") return { success: "Pedido já estava reembolsado." };
  if (order.status !== "paid") return { error: "Só pedidos pagos podem ser reembolsados." };
  if (!order.stripe_payment_intent_id) return { error: "Pedido sem PaymentIntent." };

  try {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reverse_transfer: true,
      refund_application_fee: true,
    });

    await markOrderRefunded(order.id);
    revalidatePath("/curadoria/pedidos");
    return { success: "Reembolso enviado ao Stripe e pedido marcado como estornado." };
  } catch (err) {
    // Se o Dashboard já reembolsou, o webhook pode ter marcado; sincroniza pelo PI.
    const existing = await getOrderByPaymentIntent(order.stripe_payment_intent_id);
    if (existing?.status === "refunded") {
      revalidatePath("/curadoria/pedidos");
      return { success: "Pedido já estava reembolsado." };
    }
    const message = err instanceof Error ? err.message : "Falha ao reembolsar.";
    return { error: message };
  }
}
