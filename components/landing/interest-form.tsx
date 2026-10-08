"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { useState, type FormEvent } from "react";

type Profile = "regente" | "arranjador";
type Errors = Partial<Record<"name" | "email", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(name: string, email: string): Errors {
  const errors: Errors = {};
  if (name.trim().length < 2) errors.name = "Informe seu nome.";
  if (!email.trim()) errors.email = "Informe seu e-mail.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Este e-mail não parece válido.";
  return errors;
}

const inputBase =
  "min-h-12 w-full rounded-md border bg-white px-4 text-base text-charcoal placeholder:text-[#9A948A] transition-colors duration-300 focus:border-charcoal focus:outline-none";

export function InterestForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");

    const nextErrors = validate(name, email);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = nextErrors.name ? "interesse-nome" : "interesse-email";
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmittedName(name.trim().split(" ")[0]);
  }

  if (submittedName) {
    return (
      <div
        role="status"
        className="animate-rise rounded-md border border-copper bg-white p-8 md:p-10"
      >
        <CheckCircleIcon size={34} weight="light" className="text-copper" aria-hidden="true" />
        <p className="mt-5 font-playfair text-2xl text-charcoal">Obrigado, {submittedName}.</p>
        <p className="mt-3 max-w-[44ch] leading-relaxed text-muted">
          Seu nome está na lista. Avisaremos por e-mail assim que o acervo abrir as portas.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-md border border-staff bg-white p-8 shadow-[0_24px_60px_-40px_rgba(45,45,45,0.4)] md:p-10"
    >
      <div className="grid gap-2">
        <label htmlFor="interesse-nome" className="text-sm font-medium text-charcoal">
          Nome
        </label>
        <input
          id="interesse-nome"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Marina Leal Toledo"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "interesse-nome-erro" : undefined}
          className={`${inputBase} ${errors.name ? "border-[#A3412F]" : "border-staff"}`}
        />
        {errors.name ? (
          <p id="interesse-nome-erro" className="text-sm text-[#A3412F]">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="interesse-email" className="text-sm font-medium text-charcoal">
          E-mail
        </label>
        <input
          id="interesse-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="marina@filarmonicadovale.org"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "interesse-email-erro" : "interesse-email-ajuda"}
          className={`${inputBase} ${errors.email ? "border-[#A3412F]" : "border-staff"}`}
        />
        {errors.email ? (
          <p id="interesse-email-erro" className="text-sm text-[#A3412F]">
            {errors.email}
          </p>
        ) : (
          <p id="interesse-email-ajuda" className="text-sm text-muted">
            Apenas para avisar sobre a abertura. Sem spam.
          </p>
        )}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium text-charcoal">Você é</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { value: "regente", label: "Regente ou instituição" },
              { value: "arranjador", label: "Arranjador" },
            ] satisfies { value: Profile; label: string }[]
          ).map((option, index) => (
            <label
              key={option.value}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-staff px-4 text-sm text-ink transition-colors duration-300 has-checked:border-charcoal has-checked:bg-paper-soft"
            >
              <input
                type="radio"
                name="profile"
                value={option.value}
                defaultChecked={index === 0}
                className="size-4 accent-charcoal"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="mt-2 inline-flex min-h-12 items-center justify-center rounded-md bg-copper px-6 text-sm font-semibold text-charcoal transition duration-300 hover:bg-[#B8924B] active:scale-[0.98]"
      >
        Entrar na lista de abertura
      </button>
    </form>
  );
}
