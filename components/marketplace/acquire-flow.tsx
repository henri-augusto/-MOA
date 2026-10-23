"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { CaretDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown";
import { LockIcon } from "@phosphor-icons/react/dist/csr/Lock";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createCheckout } from "@/app/acervo/[id]/adquirir/actions";
import { PaymentUnavailable } from "@/components/marketplace/payment-form";
import {
  borderFor,
  describedBy,
  errorTextClass,
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/studio/form";
import { formatBRL } from "@/lib/arranger/catalog";
import type { Listing } from "@/lib/marketplace/types";

type Step = "dados" | "pagamento" | "confirmacao";

type Buyer = {
  name: string;
  email: string;
  ensemble: string;
  accepted: boolean;
};

type Errors = Partial<Record<keyof Buyer, string>>;

const emptyBuyer: Buyer = { name: "", email: "", ensemble: "", accepted: false };

const steps: { id: Step; label: string }[] = [
  { id: "dados", label: "Seus dados" },
  { id: "pagamento", label: "Pagamento" },
  { id: "confirmacao", label: "Confirmação" },
];

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

function OrderSummary({
  listing,
  price,
  compact = false,
}: {
  listing: Listing;
  price: string;
  compact?: boolean;
}) {
  return (
    <aside className="rounded-md border border-staff bg-white p-5 md:p-6">
      <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Resumo do pedido</p>
      <div className={compact ? "mt-3" : "mt-4"}>
        <h2 className="font-playfair text-xl text-charcoal md:text-2xl">{listing.title}</h2>
        <p className="mt-1 text-sm text-ink">{listing.composer}</p>
        <p className="text-sm text-muted">arr. {listing.arranger}</p>
        <p className="mt-2 text-xs tracking-[0.14em] text-muted uppercase">{listing.formation}</p>
      </div>

      <dl className="mt-6 divide-y divide-staff border-y border-staff text-sm">
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-ink">Grade, partes e áudio</dt>
          <dd className="font-semibold tabular-nums text-charcoal">{price}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="font-medium text-charcoal">Total</dt>
          <dd className="text-lg font-semibold tabular-nums text-charcoal">{price}</dd>
        </div>
      </dl>
      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted">
        <LockIcon size={16} weight="light" className="mt-0.5 shrink-0" aria-hidden="true" />
        Pagamento único e seguro. A obra fica com o conjunto, sem mensalidade.
      </p>
    </aside>
  );
}

export function AcquireFlow({
  listing,
  paymentsEnabled,
}: {
  listing: Listing;
  paymentsEnabled: boolean;
}) {
  const [step, setStep] = useState<Step>("dados");
  const [buyer, setBuyer] = useState<Buyer>(emptyBuyer);
  const [errors, setErrors] = useState<Errors>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const ensembleRef = useRef<HTMLInputElement>(null);
  const acceptedRef = useRef<HTMLInputElement>(null);
  const opened = useRef(false);
  const baseId = useId();
  const price = formatBRL(listing.priceCents);
  const stepIndex = steps.findIndex((item) => item.id === step);
  const canBuy = paymentsEnabled && listing.canPurchase;

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

  async function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(buyer);
    setErrors(next);
    if (next.name) {
      firstFieldRef.current?.focus();
      return;
    }
    if (next.email) {
      emailRef.current?.focus();
      return;
    }
    if (next.ensemble) {
      ensembleRef.current?.focus();
      return;
    }
    if (next.accepted) {
      acceptedRef.current?.focus();
      return;
    }

    if (!canBuy) {
      setCheckoutError(null);
      setStep("pagamento");
      return;
    }

    setCheckoutBusy(true);
    setCheckoutError(null);
    const result = await createCheckout({
      workId: listing.id,
      name: buyer.name,
      email: buyer.email,
      ensemble: buyer.ensemble,
      accepted: buyer.accepted,
    });

    if (!result.ok) {
      setCheckoutBusy(false);
      setCheckoutError(result.error);
      return;
    }

    window.location.assign(result.url);
  }

  return (
    <div>
      <Link
        href={`/acervo/${listing.id}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors duration-300 hover:text-charcoal"
      >
        <ArrowLeftIcon size={16} weight="light" aria-hidden="true" />
        Voltar à obra
      </Link>

      <ol className="mt-8 flex flex-wrap gap-2" aria-label="Etapas da aquisição">
        {steps.map((item, index) => {
          const current = item.id === step;
          const done = index < stepIndex;
          return (
            <li
              key={item.id}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm ${
                current
                  ? "border-charcoal bg-charcoal text-paper-soft"
                  : done
                    ? "border-copper bg-white text-charcoal"
                    : "border-staff bg-paper-soft text-muted"
              }`}
            >
              <span className="tabular-nums font-semibold">{index + 1}</span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ol>

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 max-w-[22ch] scroll-mt-28 text-balance font-playfair text-4xl leading-tight text-charcoal outline-none md:text-5xl"
      >
        {step === "confirmacao" ? "Ensaio concluído." : `Adquirir ${listing.title}`}
      </h1>
      <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-muted">
        {step === "dados"
          ? canBuy
            ? "Informe quem adquire. O pagamento abre na página do Stripe."
            : "Informe quem adquire. Não é preciso criar conta nesta etapa."
          : step === "pagamento"
            ? paymentsEnabled && !listing.canPurchase
              ? "O arranjador ainda não concluiu o cadastro de recebimento."
              : "O pagamento com Stripe ainda não está ligado neste ambiente."
            : "Quando o Stripe estiver ligado, esta tela confirma a compra e libera os PDFs."}
      </p>

      {!listing.canPurchase && paymentsEnabled ? (
        <p className="mt-4 max-w-[52ch] rounded-md border border-copper bg-white px-4 py-3 text-sm text-ink">
          O arranjador ainda não concluiu o cadastro de recebimento. A compra fica bloqueada até lá.
        </p>
      ) : null}

      {step !== "confirmacao" ? (
        <div className="mt-8 lg:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((open) => !open)}
            className="flex w-full min-h-12 items-center justify-between rounded-md border border-staff bg-white px-4 text-sm font-medium text-charcoal"
            aria-expanded={summaryOpen}
          >
            <span>
              Resumo · <span className="tabular-nums">{price}</span>
            </span>
            <CaretDownIcon
              size={16}
              weight="bold"
              aria-hidden="true"
              className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`}
            />
          </button>
          {summaryOpen ? (
            <div className="mt-3">
              <OrderSummary listing={listing} price={price} compact />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
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

              {checkoutError ? <p className={errorTextClass}>{checkoutError}</p> : null}

              <button type="submit" disabled={checkoutBusy} className={`${primaryButtonClass} w-full sm:w-auto`}>
                {checkoutBusy ? "Abrindo o checkout…" : canBuy ? "Ir para o checkout" : "Seguir para o pagamento"}
              </button>
            </form>
          ) : null}

          {step === "pagamento" ? (
            <PaymentUnavailable
              priceLabel={price}
              onPreviewConfirm={() => setStep("confirmacao")}
              onBack={() => setStep("dados")}
            />
          ) : null}

          {step === "confirmacao" ? (
            <div>
              <div className="flex items-start gap-4 rounded-md border border-staff bg-white p-5 md:p-6">
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
                <Row term="Total previsto" value={price} />
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/acervo" className={primaryButtonClass}>
                  Continuar comprando
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
          <div className="order-1 hidden lg:sticky lg:top-28 lg:order-2 lg:col-span-5 lg:block">
            <OrderSummary listing={listing} price={price} />
          </div>
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
