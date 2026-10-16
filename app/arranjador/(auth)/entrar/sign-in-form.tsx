"use client";

import { useActionState } from "react";
import {
  Field,
  FormAlert,
  borderFor,
  describedBy,
  inputClass,
  primaryButtonClass,
} from "@/components/studio/form";
import { signIn, type AuthState } from "../actions";

export function SignInForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="grid gap-6">
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}

      <Field id="entrar-email" label="E-mail" error={errors.email}>
        <input
          id="entrar-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("entrar-email", errors.email)}
          className={`${inputClass} ${borderFor(errors.email)}`}
        />
      </Field>

      <Field id="entrar-senha" label="Senha" error={errors.password}>
        <input
          id="entrar-senha"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={describedBy("entrar-senha", errors.password)}
          className={`${inputClass} ${borderFor(errors.password)}`}
        />
      </Field>

      <button type="submit" disabled={pending} className={`mt-2 ${primaryButtonClass}`}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
