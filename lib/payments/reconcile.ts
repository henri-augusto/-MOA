import "server-only";

import { fulfillPaidOrder, linkOrderPayment, markOrderFailed, type OrderRow } from "./orders";
import { checkoutPaymentIntentId, getStripe } from "./stripe";

const SESSION_PATTERN = /^cs_(test|live)_[A-Za-z0-9]+$/;

/** Se o webhook ainda não chegou, confirma o pedido na Checkout Session ou no PaymentIntent. */
export async function reconcilePendingOrder(order: OrderRow, checkoutSessionId?: string | null): Promise<OrderRow> {
  if (order.status !== "pending") return order;

  try {
    const stripe = getStripe();
    let current = order;

    if (checkoutSessionId && SESSION_PATTERN.test(checkoutSessionId)) {
      const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
        expand: ["payment_intent"],
      });
      const sessionOrderId = Number(session.metadata?.order_id ?? session.client_reference_id);
      if (sessionOrderId === order.id) {
        const paymentIntentId = checkoutPaymentIntentId(session);
        if (paymentIntentId && paymentIntentId !== current.stripe_payment_intent_id) {
          await linkOrderPayment(order.id, paymentIntentId);
          current = { ...current, stripe_payment_intent_id: paymentIntentId };
        }

        const intentStatus =
          session.payment_intent && typeof session.payment_intent === "object" ? session.payment_intent.status : null;

        if (session.payment_status !== "unpaid" || intentStatus === "succeeded") {
          const { order: updated } = await fulfillPaidOrder(order.id);
          return updated ?? { ...current, status: "paid" };
        }

        if (session.status === "expired" || intentStatus === "canceled") {
          await markOrderFailed(order.id);
          return { ...current, status: "failed" };
        }
      }
    }

    if (!current.stripe_payment_intent_id) return current;

    const paymentIntent = await stripe.paymentIntents.retrieve(current.stripe_payment_intent_id);
    if (paymentIntent.status === "canceled") {
      await markOrderFailed(order.id);
      return { ...current, status: "failed" };
    }
    if (paymentIntent.status !== "succeeded") return current;

    const { order: updated } = await fulfillPaidOrder(order.id);
    return updated ?? { ...current, status: "paid" };
  } catch (err) {
    console.error("reconcilePendingOrder", order.id, err);
    return order;
  }
}
