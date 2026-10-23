import "server-only";

import Stripe from "stripe";
import { stripeSecretKey } from "./env";

let client: Stripe | null = null;

export function getStripe() {
  if (!client) {
    client = new Stripe(stripeSecretKey(), {
      typescript: true,
    });
  }
  return client;
}

/** Conta pronta para receber destination charges e sacar para o banco. */
export function accountCanReceiveDestinationCharges(account: Stripe.Account) {
  return Boolean(account.payouts_enabled && account.capabilities?.transfers === "active");
}

export function checkoutPaymentIntentId(session: Stripe.Checkout.Session) {
  const paymentIntent = session.payment_intent;
  if (!paymentIntent) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}
