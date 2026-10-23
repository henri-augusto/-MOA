export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET,
  );
}

export function stripePublishableKey() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Stripe não configurado: defina NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
  }
  return key;
}

export function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe não configurado: defina STRIPE_SECRET_KEY.");
  }
  return key;
}

export function stripeWebhookSecret() {
  const key = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key) {
    throw new Error("Stripe não configurado: defina STRIPE_WEBHOOK_SECRET.");
  }
  return key;
}

export function isPaymentsReady() {
  return isStripeConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
