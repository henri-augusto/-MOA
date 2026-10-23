import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeWebhookSecret } from "@/lib/payments/env";
import {
  fulfillPaidOrder,
  getOrderByPaymentIntent,
  linkOrderPayment,
  markOrderFailed,
  markOrderRefunded,
  setProfilePayoutsReady,
} from "@/lib/payments/orders";
import { accountCanReceiveDestinationCharges, checkoutPaymentIntentId, getStripe } from "@/lib/payments/stripe";

export const runtime = "nodejs";

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderIdRaw = paymentIntent.metadata?.order_id;
  let orderId = orderIdRaw ? Number(orderIdRaw) : NaN;

  if (!Number.isFinite(orderId)) {
    const order = await getOrderByPaymentIntent(paymentIntent.id);
    if (!order) return;
    orderId = order.id;
  }

  await fulfillPaidOrder(orderId);
}

function orderIdFromSession(session: Stripe.Checkout.Session) {
  const raw = session.metadata?.order_id ?? session.client_reference_id;
  const orderId = raw ? Number(raw) : NaN;
  return Number.isFinite(orderId) ? orderId : null;
}

async function handleCheckoutFulfillment(session: Stripe.Checkout.Session) {
  const orderId = orderIdFromSession(session);
  if (!orderId) return;

  const paymentIntentId = checkoutPaymentIntentId(session);
  if (paymentIntentId) await linkOrderPayment(orderId, paymentIntentId);

  if (session.payment_status === "unpaid") return;
  await fulfillPaidOrder(orderId);
}

async function handleCheckoutClosed(session: Stripe.Checkout.Session) {
  const orderId = orderIdFromSession(session);
  if (!orderId) return;
  await markOrderFailed(orderId);
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return;
  const ready = accountCanReceiveDestinationCharges(account);
  await setProfilePayoutsReady(account.id, ready);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const order = await getOrderByPaymentIntent(paymentIntentId);
  if (!order) return;
  await markOrderRefunded(order.id);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assinatura inválida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutFulfillment(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await handleCheckoutClosed(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return NextResponse.json({ error: "Falha ao processar evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
