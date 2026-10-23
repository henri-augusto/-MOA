import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashAccessToken } from "./tokens";

export type OrderStatus = "pending" | "paid" | "refunded" | "failed";

export type OrderRow = {
  id: number;
  work_id: string;
  arranger_id: string;
  buyer_name: string;
  buyer_email: string;
  ensemble: string;
  gross_cents: number;
  platform_fee_cents: number;
  arranger_share_cents: number;
  stripe_payment_intent_id: string | null;
  status: OrderStatus;
  access_token_hash: string;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
};

const ORDER_COLUMNS =
  "id, work_id, arranger_id, buyer_name, buyer_email, ensemble, gross_cents, platform_fee_cents, arranger_share_cents, stripe_payment_intent_id, status, access_token_hash, paid_at, refunded_at, created_at";

export type OrderWorkFiles = {
  title: string;
  score_path: string | null;
  parts_path: string | null;
  parts_count: number;
};

export async function getOrderByAccessToken(token: string) {
  const hash = hashAccessToken(token);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("access_token_hash", hash)
    .maybeSingle();

  if (error) throw error;
  return data as OrderRow | null;
}

export async function getOrderByPaymentIntent(paymentIntentId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) throw error;
  return data as OrderRow | null;
}

export async function getOrderWorkFiles(workId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("works")
    .select("title, score_path, parts_path, parts_count")
    .eq("id", workId)
    .maybeSingle();

  if (error) throw error;
  return data as OrderWorkFiles | null;
}

/** Marca pedido como pago e grava a venda. Idempotente. */
export async function fulfillPaidOrder(orderId: number) {
  const supabase = createAdminClient();
  const paidAt = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: paidAt })
    .eq("id", orderId)
    .eq("status", "pending")
    .select(ORDER_COLUMNS)
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    const existing = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", orderId).maybeSingle();
    return { order: existing.data as OrderRow | null, created: false };
  }

  const order = updated as OrderRow;
  const { error: saleError } = await supabase.from("sales").insert({
    work_id: order.work_id,
    gross_cents: order.gross_cents,
    arranger_share_cents: order.arranger_share_cents,
    order_id: order.id,
    sold_at: paidAt,
  });

  if (saleError && saleError.code !== "23505") throw saleError;

  return { order, created: true };
}

export async function linkOrderPayment(orderId: number, paymentIntentId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq("id", orderId)
    .is("stripe_payment_intent_id", null);

  if (error && error.code !== "23505") throw error;
}

export async function markOrderFailed(orderId: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending");
  if (error) throw error;
}

export async function markOrderRefunded(orderId: number) {
  const supabase = createAdminClient();
  const refundedAt = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status: "refunded", refunded_at: refundedAt })
    .eq("id", orderId)
    .in("status", ["paid", "pending"])
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!updated) return false;

  await supabase.from("sales").update({ refunded_at: refundedAt }).eq("order_id", orderId).is("refunded_at", null);

  return true;
}

export async function setProfilePayoutsReady(stripeAccountId: string, ready: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ payouts_ready: ready })
    .eq("stripe_account_id", stripeAccountId);

  if (error) throw error;
}
