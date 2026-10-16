"use client";

import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { useActionState } from "react";
import {
  Field,
  FormAlert,
  borderFor,
  describedBy,
  inputClass,
  primaryButtonClass,
} from "@/components/studio/form";
import { signUp, type AuthState } from "../actions";

const passwordHint = "Ao menos 8 caracteres.";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, {});
  const errors = state.fieldErrors ?? {};

  if (state.confirmEmailSentTo) {
    return (
      <div role="status" className="animate-rise rounded-md border border-copper bg-white p-8">
        <EnvelopeSimpleIcon size={34} weight="light" className="text-copper" aria-hidden="true" />
        <p className="mt-5 font-playfair text-2xl text-charcoal">Confirme seu e-mail.</p>
        <p className="mt-3 leading-relaxed text-muted">
          Enviamos um link para <span className="font-medium text-ink">{state.confirmEmailSentTo}</span>. Ao
          abrir, você volta direto para completar o perfil.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="grid gap-6">
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}

      <Field id="cadastro-nome" label="Nome completo" error={errors.name}>
        <input
          id="cadastro-nome"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={state.values?.name}
          placeholder="Helena Vasconcellos Prado"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("cadastro-nome", errors.name)}
          className={`${inputClass} ${borderFor(errors.name)}`}
        />
      </Field>

      <Field id="cadastro-email" label="E-mail" error={errors.email}>
        <input
          id="cadastro-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          placeholder="helena@estudio.art.br"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("cadastro-email", errors.email)}
          className={`${inputClass} ${borderFor(errors.email)}`}
        />
      </Field>

      <Field id="cadastro-senha" label="Senha" error={errors.password} hint={passwordHint}>
        <input
          id="cadastro-senha"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={describedBy("cadastro-senha", errors.password, passwordHint)}
          className={`${inputClass} ${borderFor(errors.password)}`}
        />
      </Field>

      <button type="submit" disabled={pending} className={`mt-2 ${primaryButtonClass}`}>
        {pending ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
