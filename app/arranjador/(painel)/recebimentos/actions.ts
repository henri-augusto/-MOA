"use server";

import { revalidatePath } from "next/cache";
import { requireArranger } from "@/lib/arranger/session";
import { isPaymentsReady } from "@/lib/payments/env";
import { accountCanReceiveDestinationCharges, getStripe } from "@/lib/payments/stripe";
import { authSiteOrigin } from "@/lib/request-origin";

type ProfileStripe = {
  stripe_account_id: string | null;
  payouts_ready: boolean;
  full_name: string;
  artist_name: string | null;
};

async function loadProfile(userId: string) {
  const { supabase } = await requireArranger();
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_account_id, payouts_ready, full_name, artist_name")
    .eq("id", userId)
    .maybeSingle<ProfileStripe>();

  if (error || !data) throw new Error("Não foi possível carregar o perfil.");
  return { supabase, profile: data };
}

export async function ensureConnectAccount(): Promise<{ error?: string; accountId?: string }> {
  if (!isPaymentsReady()) {
    return { error: "Recebimentos ainda não estão ligados neste ambiente." };
  }

  const { userId } = await requireArranger();
  const { supabase, profile } = await loadProfile(userId);

  if (profile.stripe_account_id) {
    return { accountId: profile.stripe_account_id };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return { error: "Sua conta precisa de um e-mail confirmado." };

  const displayName =
    profile.artist_name?.trim() || profile.full_name.trim() || email.split("@")[0] || "Arranjador";

  try {
    const stripe = getStripe();
    const account = await stripe.v2.core.accounts.create({
      contact_email: email,
      display_name: displayName,
      dashboard: "express",
      identity: {
        country: "br",
        entity_type: "individual",
      },
      configuration: {
        // Contas no Brasil não aceitam stripe_transfers sem card_payments.
        merchant: {
          capabilities: {
            card_payments: { requested: true },
          },
        },
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      defaults: {
        currency: "brl",
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
    });

    const { error } = await supabase
      .from("profiles")
      .update({ stripe_account_id: account.id, payouts_ready: false })
      .eq("id", userId)
      .is("stripe_account_id", null);

    if (error) {
      return { error: "Não foi possível gravar a conta de recebimento. Tente novamente." };
    }

    revalidatePath("/arranjador/recebimentos");
    revalidatePath("/arranjador");
    return { accountId: account.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao criar a conta Stripe.";
    return { error: message };
  }
}

export async function createAccountSession(): Promise<{ clientSecret?: string; error?: string }> {
  if (!isPaymentsReady()) {
    return { error: "Recebimentos ainda não estão ligados neste ambiente." };
  }

  const ensured = await ensureConnectAccount();
  if (ensured.error || !ensured.accountId) return { error: ensured.error ?? "Conta indisponível." };

  try {
    const stripe = getStripe();
    const session = await stripe.accountSessions.create({
      account: ensured.accountId,
      components: {
        account_management: { enabled: true },
        notification_banner: { enabled: true },
        payouts: { enabled: true },
      },
    });

    return { clientSecret: session.client_secret };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao abrir o cadastro de recebimento.";
    return { error: message };
  }
}

export async function createAccountOnboardingLink(): Promise<{ url?: string; error?: string }> {
  if (!isPaymentsReady()) {
    return { error: "Recebimentos ainda não estão ligados neste ambiente." };
  }

  const ensured = await ensureConnectAccount();
  if (ensured.error || !ensured.accountId) return { error: ensured.error ?? "Conta indisponível." };

  try {
    const origin = await authSiteOrigin();
    const stripe = getStripe();
    const link = await stripe.v2.core.accountLinks.create({
      account: ensured.accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          // Nesta versão da API o Stripe infere as configurations da conta; não enviar o campo.
          return_url: `${origin}/arranjador/recebimentos?stripe=return`,
          refresh_url: `${origin}/arranjador/recebimentos?stripe=refresh`,
        },
      },
    });

    if (!link.url) return { error: "Stripe não devolveu o link de cadastro." };
    return { url: link.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao abrir o cadastro no Stripe.";
    return { error: message };
  }
}

/** Abre o Express Dashboard do arranjador (dados bancários, identidade e repasses). */
export async function createExpressLoginLink(): Promise<{ url?: string; error?: string }> {
  if (!isPaymentsReady()) {
    return { error: "Recebimentos ainda não estão ligados neste ambiente." };
  }

  const { userId } = await requireArranger();
  const { profile } = await loadProfile(userId);

  if (!profile.stripe_account_id) {
    return { error: "Conclua o cadastro de recebimento antes de abrir o painel." };
  }

  try {
    const stripe = getStripe();
    const link = await stripe.accounts.createLoginLink(profile.stripe_account_id);
    if (!link.url) return { error: "Stripe não devolveu o link do painel." };
    return { url: link.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao abrir o painel no Stripe.";
    return { error: message };
  }
}

export async function refreshPayoutsReady(): Promise<{ ready: boolean; error?: string }> {
  if (!isPaymentsReady()) return { ready: false, error: "Recebimentos ainda não estão ligados." };

  const { userId } = await requireArranger();
  const { supabase, profile } = await loadProfile(userId);

  if (!profile.stripe_account_id) return { ready: false };

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const ready = accountCanReceiveDestinationCharges(account);

    if (ready !== profile.payouts_ready) {
      await supabase.from("profiles").update({ payouts_ready: ready }).eq("id", userId);
      revalidatePath("/arranjador/recebimentos");
      revalidatePath("/arranjador");
    }

    return { ready };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível consultar o Stripe.";
    return { ready: profile.payouts_ready, error: message };
  }
}
