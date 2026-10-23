"use server";

import { redirect } from "next/navigation";
import { authSiteOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const MAX_NAME = 120;

type Field = "name" | "email" | "password" | "passwordConfirmation";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  values?: { name?: string; email?: string };
  confirmEmailSentTo?: string;
};

function authErrorMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
    case "weak_password":
      return "Escolha uma senha mais forte, com letras e números.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
    case "email_address_invalid":
      return "Este e-mail não parece válido.";
    default:
      return fallback;
  }
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "");

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Informe seu nome.";
  else if (name.length > MAX_NAME) fieldErrors.name = `Use até ${MAX_NAME} caracteres.`;
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Informe um e-mail válido.";
  if (password.length < MIN_PASSWORD) fieldErrors.password = `Use ao menos ${MIN_PASSWORD} caracteres.`;
  else if (password.length > MAX_PASSWORD) fieldErrors.password = `Use até ${MAX_PASSWORD} caracteres.`;
  if (!passwordConfirmation) fieldErrors.passwordConfirmation = "Repita a senha.";
  else if (passwordConfirmation !== password) fieldErrors.passwordConfirmation = "As senhas não coincidem.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values: { name, email } };

  let origin: string;
  try {
    origin = await authSiteOrigin();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Não foi possível criar a conta agora. Tente novamente.",
      values: { name, email },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback?next=/arranjador/perfil`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { confirmEmailSentTo: email };
    }
    return {
      error: authErrorMessage(error.code, "Não foi possível criar a conta agora. Tente novamente."),
      values: { name, email },
    };
  }

  // With e-mail confirmation on, an existing address comes back as a user without identities.
  // Same success screen either way, so the form does not reveal whether the address is taken.
  if (data.user && data.user.identities?.length === 0) {
    return { confirmEmailSentTo: email };
  }

  if (!data.session) {
    return { confirmEmailSentTo: email };
  }

  redirect("/arranjador/perfil");
}

const SIGN_IN_DESTINATIONS = new Set(["/arranjador", "/curadoria"]);

function signInDestination(raw: FormDataEntryValue | null) {
  const next = typeof raw === "string" ? raw : "";
  return SIGN_IN_DESTINATIONS.has(next) ? next : "/arranjador";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = signInDestination(formData.get("next"));

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Informe um e-mail válido.";
  if (!password) fieldErrors.password = "Informe sua senha.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values: { email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: authErrorMessage(error.code, "Não foi possível entrar agora. Tente novamente."),
      values: { email },
    };
  }

  redirect(next);
}
