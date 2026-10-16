"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  borderFor,
  describedBy,
  errorTextClass,
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/studio/form";
import { formatBRL } from "@/lib/arranger/catalog";
import type { Listing } from "@/lib/marketplace/types";

type Step = "dados" | "pagamento" | "confirmacao";
type Method = "cartao" | "pix";

type Buyer = {
  name: string;
  email: string;
  ensemble: string;
  accepted: boolean;
};

type Errors = Partial<Record<keyof Buyer, string>>;

const emptyBuyer: Buyer = { name: "", email: "", ensemble: "", accepted: false };

function validate(buyer: Buyer): Errors {
  const errors: Errors = {};
  if (buyer.name.trim().length < 3) errors.name = "Informe o nome de quem adquire.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) {
    errors.email = "Informe um e-mail válido. A confirmação chega por ele.";
  }
  if (buyer.ensemble.trim().length < 2) errors.ensemble = "Informe o conjunto ou a instituição.";
  if (!buyer.accepted) errors.accepted = "Confirme que a aquisição é para esse conjunto.";
  return errors;
}

export function AcquireFlow({ listing }: { listing: Listing }) {
  const [step, setStep] = useState<Step>("dados");
  const [method, setMethod] = useState<Method>("cartao");
  const [buyer, setBuyer] = useState<Buyer>(emptyBuyer);
  const [errors, setErrors] = useState<Errors>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const ensembleRef = useRef<HTMLInputElement>(null);
  const acceptedRef = useRef<HTMLInputElement>(null);
  const opened = useRef(false);
  const baseId = useId();
  const price = formatBRL(listing.priceCents);

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function update<K extends keyof Buyer>(key: K, value: Buyer[K]) {
    setBuyer((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(buyer);
    setErrors(next);
    if (next.name) firstFieldRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.ensemble) ensembleRef.current?.focus();
    else if (next.accepted) acceptedRef.current?.focus();
    else setStep("pagamento");
  }

  return (
    <div>
      <Link
        href={`/acervo/${listing.id}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors duration-300 hover:text-charcoal"
      >
        <ArrowLeftIcon size={16} weight="light" aria-hidden="true" />
        {listing.title}
      </Link>
      <p className="mt-6 text-sm text-muted">
        {step === "dados" ? "Seus dados" : step === "pagamento" ? "Pagamento" : "Confirmação"}
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 max-w-[22ch] scroll-mt-28 text-balance font-playfair text-4xl leading-tight text-charcoal outline-none md:text-5xl"
      >
        {step === "confirmacao" ? "Ensaio concluído." : `Adquirir ${listing.title}`}
      </h1>

      <div className="mt-10 grid items-start gap-12 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7">
          {step === "dados" ? (
            <form className="grid gap-6" onSubmit={continueToPayment} noValidate>
              <Field id={`${baseId}-nome`} label="Nome" error={errors.name} hint="Quem responde pelo conjunto.">
                <input
                  ref={firstFieldRef}
                  id={`${baseId}-nome`}
                  value={buyer.name}
                  onChange={(event) => update("name", event.target.value)}
                  autoComplete="name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={describedBy(`${baseId}-nome`, errors.name, "Quem responde pelo conjunto.")}
                  className={`${inputClass} ${borderFor(errors.name)}`}
                />
              </Field>
              <Field
                id={`${baseId}-email`}
                label="E-mail"
                error={errors.email}
                hint="A confirmação e os PDFs ficam ligados a este endereço."
              >
                <input
                  ref={emailRef}
                  id={`${baseId}-email`}
                  type="email"
                  inputMode="email"
                  value={buyer.email}
                  onChange={(event) => update("email", event.target.value)}
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={describedBy(
                    `${baseId}-email`,
                    errors.email,
                    "A confirmação e os PDFs ficam ligados a este endereço.",
                  )}
                  className={`${inputClass} ${borderFor(errors.email)}`}
                />
              </Field>
              <Field
                id={`${baseId}-conjunto`}
                label="Conjunto ou instituição"
                error={errors.ensemble}
                hint="Orquestra, banda, coro ou escola que vai usar a partitura."
              >
                <input
                  ref={ensembleRef}
                  id={`${baseId}-conjunto`}
                  value={buyer.ensemble}
                  onChange={(event) => update("ensemble", event.target.value)}
                  autoComplete="organization"
                  aria-invalid={errors.ensemble ? true : undefined}
                  aria-describedby={describedBy(
                    `${baseId}-conjunto`,
                    errors.ensemble,
                    "Orquestra, banda, coro ou escola que vai usar a partitura.",
                  )}
                  className={`${inputClass} ${borderFor(errors.ensemble)}`}
                />
              </Field>

              <div className="grid gap-2">
                <label className="flex min-h-11 items-start gap-3 text-sm leading-relaxed text-ink">
                  <input
                    ref={acceptedRef}
                    type="checkbox"
                    checked={buyer.accepted}
                    onChange={(event) => update("accepted", event.target.checked)}
                    aria-invalid={errors.accepted ? true : undefined}
                    aria-describedby={errors.accepted ? `${baseId}-aceite-erro` : undefined}
                    className="mt-1 size-4 accent-charcoal"
                  />
                  <span>A aquisição é para o conjunto informado, para ensaio e apresentação.</span>
                </label>
                {errors.accepted ? (
                  <p id={`${baseId}-aceite-erro`} className={errorTextClass}>
                    {errors.accepted}
                  </p>
                ) : null}
              </div>

              <button type="submit" className={`${primaryButtonClass} w-full sm:w-auto`}>
                Seguir para o pagamento
              </button>
            </form>
          ) : null}

          {step === "pagamento" ? (
            <div>
              <fieldset>
                <legend className="text-sm font-medium text-charcoal">Forma de pagamento</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["cartao", "Cartão"],
                      ["pix", "Pix"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-staff px-4 text-sm text-ink transition-colors duration-300 has-checked:border-charcoal has-checked:bg-white has-checked:font-semibold has-checked:text-charcoal"
                    >
                      <input
                        type="radio"
                        name="pagamento"
                        value={value}
                        checked={method === value}
                        onChange={() => setMethod(value)}
                        className="size-4 accent-charcoal"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-6 rounded-md border border-dashed border-staff bg-paper-soft px-5 py-6 md:px-6">
                <p className="text-sm font-medium text-charcoal">Campo do Stripe</p>
                <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
                  {method === "cartao"
                    ? "Número, validade e CVC aparecem aqui, no componente seguro do Stripe. O MOA não vê nem guarda o cartão."
                    : "O QR Code do Pix aparece aqui, gerado pelo Stripe, depois que a aquisição for confirmada."}
                </p>
                <button type="button" disabled className={`mt-6 ${primaryButtonClass}`}>
                  Pagar {price}
                </button>
                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted">
                  Este botão liga quando o Stripe estiver conectado. Nada é cobrado agora.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setStep("confirmacao")} className={secondaryButtonClass}>
                  Ver a confirmação
                </button>
                <button
                  type="button"
                  onClick={() => setStep("dados")}
                  className="inline-flex min-h-12 items-center justify-center px-2 text-sm text-muted hover:text-charcoal"
                >
                  Voltar aos dados
                </button>
              </div>
            </div>
          ) : null}

          {step === "confirmacao" ? (
            <div>
              <div className="flex items-start gap-4">
                <SealCheckIcon size={28} weight="light" className="mt-1 shrink-0 text-copper" aria-hidden="true" />
                <p className="max-w-[58ch] text-base leading-relaxed text-ink">
                  Nenhum valor foi cobrado. Quando o Stripe estiver ligado, esta tela confirma a compra de{" "}
                  {listing.title} para {buyer.ensemble.trim()} e libera os PDFs.
                </p>
              </div>

              <dl className="mt-10 divide-y divide-staff border-y border-staff text-sm">
                <Row term="Obra" value={listing.title} />
                <Row term="Para" value={buyer.ensemble.trim()} />
                <Row term="Contato" value={`${buyer.name.trim()} · ${buyer.email.trim()}`} />
                <Row term="Forma escolhida" value={method === "cartao" ? "Cartão" : "Pix"} />
                <Row term="Total previsto" value={price} />
              </dl>

              <h2 className="mt-12 font-playfair text-2xl text-charcoal">O que chega com o pagamento</h2>
              <ul className="mt-4 divide-y divide-staff border-y border-staff text-sm">
                <li className="flex items-center justify-between gap-4 py-4">
                  <span className="text-ink">Grade completa</span>
                  <span className="text-muted">PDF após o pagamento</span>
                </li>
                <li className="flex items-center justify-between gap-4 py-4">
                  <span className="text-ink">{listing.parts} partes cavadas</span>
                  <span className="text-muted">PDF após o pagamento</span>
                </li>
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/acervo" className={primaryButtonClass}>
                  Voltar ao acervo
                </Link>
                <button
                  type="button"
                  onClick={() => setStep("pagamento")}
                  className="inline-flex min-h-12 items-center justify-center px-2 text-sm text-muted hover:text-charcoal"
                >
                  Rever o pagamento
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {step === "confirmacao" ? null : (
          <aside className="order-1 rounded-md border border-staff bg-white p-6 md:p-8 lg:sticky lg:top-28 lg:order-2 lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{listing.formation}</p>
            <h2 className="mt-4 font-playfair text-2xl text-charcoal">{listing.title}</h2>
            <p className="mt-2 text-sm text-ink">{listing.composer}</p>
            <p className="text-sm text-muted">arr. {listing.arranger}</p>

            <dl className="mt-8 divide-y divide-staff border-y border-staff text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-ink">Grade, partes e áudio</dt>
                <dd className="font-semibold tabular-nums text-charcoal">{price}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-medium text-charcoal">Total</dt>
                <dd className="font-semibold tabular-nums text-charcoal">{price}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Pagamento único. A obra fica com o conjunto, sem mensalidade.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
      <dt className="text-muted">{term}</dt>
      <dd className="text-charcoal">{value}</dd>
    </div>
  );
}
