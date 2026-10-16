"use server";

import { redirect } from "next/navigation";
import { requestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

type Field = "name" | "email" | "password";

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
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com este e-mail. Entre com sua senha.";
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

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Informe seu nome.";
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Informe um e-mail válido.";
  if (password.length < MIN_PASSWORD) fieldErrors.password = `Use ao menos ${MIN_PASSWORD} caracteres.`;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values: { name, email } };

  const supabase = await createClient();
  const origin = await requestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback?next=/arranjador/perfil`,
    },
  });

  if (error) {
    return {
      error: authErrorMessage(error.code, "Não foi possível criar a conta agora. Tente novamente."),
      values: { name, email },
    };
  }

  // With e-mail confirmation on, an existing address comes back as a user without identities.
  if (data.user && data.user.identities?.length === 0) {
    return { error: authErrorMessage("user_already_exists", ""), values: { name, email } };
  }

  if (!data.session) {
    return { confirmEmailSentTo: email };
  }

  redirect("/arranjador/perfil");
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

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

  redirect("/arranjador");
}
