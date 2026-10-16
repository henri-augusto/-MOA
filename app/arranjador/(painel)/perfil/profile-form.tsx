"use client";

import { startTransition, useActionState, useState } from "react";
import {
  Field,
  FormAlert,
  borderFor,
  describedBy,
  errorTextClass,
  inputClass,
  primaryButtonClass,
} from "@/components/studio/form";
import { FORMATIONS, type Profile } from "@/lib/arranger/catalog";
import { updateProfile, type ProfileState } from "../actions";

const BIO_LIMIT = 600;
const artistHint = "Como você quer ser creditado. Se ficar em branco, usamos o nome completo.";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0);
  const errors = state.fieldErrors ?? {};

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="grid gap-10 lg:grid-cols-12"
    >
      <div className="grid content-start gap-6 lg:col-span-7">
        {state.error ? <FormAlert>{state.error}</FormAlert> : null}
        {state.saved ? <FormAlert tone="success">Perfil salvo.</FormAlert> : null}

        <div className="grid gap-6 md:grid-cols-2">
          <Field id="perfil-nome" label="Nome completo" error={errors.fullName}>
            <input
              id="perfil-nome"
              name="fullName"
              type="text"
              autoComplete="name"
              defaultValue={profile.full_name}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={describedBy("perfil-nome", errors.fullName)}
              className={`${inputClass} ${borderFor(errors.fullName)}`}
            />
          </Field>

          <Field id="perfil-cidade" label="Cidade" error={errors.city}>
            <input
              id="perfil-cidade"
              name="city"
              type="text"
              autoComplete="address-level2"
              defaultValue={profile.city ?? ""}
              placeholder="Belo Horizonte, MG"
              aria-invalid={Boolean(errors.city)}
              aria-describedby={describedBy("perfil-cidade", errors.city)}
              className={`${inputClass} ${borderFor(errors.city)}`}
            />
          </Field>
        </div>

        <Field id="perfil-artistico" label="Nome artístico" error={errors.artistName} hint={artistHint}>
          <input
            id="perfil-artistico"
            name="artistName"
            type="text"
            defaultValue={profile.artist_name ?? ""}
            aria-invalid={Boolean(errors.artistName)}
            aria-describedby={describedBy("perfil-artistico", errors.artistName, artistHint)}
            className={`${inputClass} ${borderFor(errors.artistName)}`}
          />
        </Field>

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="perfil-bio" className="text-sm font-medium text-charcoal">
              Sobre você
            </label>
            <span
              className={`text-xs tabular-nums ${bioLength > BIO_LIMIT ? "text-[#A3412F]" : "text-muted"}`}
              aria-live="polite"
            >
              {bioLength}/{BIO_LIMIT}
            </span>
          </div>
          <textarea
            id="perfil-bio"
            name="bio"
            rows={6}
            defaultValue={profile.bio ?? ""}
            onChange={(event) => setBioLength(event.target.value.length)}
            placeholder="Formação, conjuntos com que trabalhou, repertório em que se especializou."
            aria-invalid={Boolean(errors.bio)}
            aria-describedby={errors.bio ? "perfil-bio-erro" : undefined}
            className={`${inputClass} min-h-40 py-3 leading-relaxed ${borderFor(errors.bio)}`}
          />
          {errors.bio ? (
            <p id="perfil-bio-erro" className={errorTextClass}>
              {errors.bio}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid content-start gap-8 lg:col-span-5">
        <fieldset
          aria-describedby={errors.formations ? "perfil-formacoes-erro" : undefined}
          className="rounded-md border border-staff bg-white p-6 md:p-8"
        >
          <legend className="sr-only">Formações para as quais escreve</legend>
          <p aria-hidden="true" className="text-sm font-medium text-charcoal">
            Formações para as quais escreve
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {FORMATIONS.map((formation) => (
              <label
                key={formation}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-staff px-3 text-sm text-ink transition-colors duration-300 has-checked:border-charcoal has-checked:bg-paper-soft"
              >
                <input
                  type="checkbox"
                  name="formations"
                  value={formation}
                  defaultChecked={profile.formations.includes(formation)}
                  className="size-4 accent-charcoal"
                />
                {formation}
              </label>
            ))}
          </div>
          {errors.formations ? (
            <p id="perfil-formacoes-erro" className={`mt-4 ${errorTextClass}`}>
              {errors.formations}
            </p>
          ) : null}
        </fieldset>

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </button>
      </div>
    </form>
  );
}
