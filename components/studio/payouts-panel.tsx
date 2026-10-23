"use client";

import {
  ConnectAccountManagement,
  ConnectComponentsProvider,
  ConnectNotificationBanner,
  ConnectPayouts,
} from "@stripe/react-connect-js";
import { loadConnectAndInitialize, type StripeConnectInstance } from "@stripe/connect-js";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormAlert, primaryButtonClass } from "@/components/studio/form";
import {
  createAccountOnboardingLink,
  createAccountSession,
  refreshPayoutsReady,
} from "@/app/arranjador/(painel)/recebimentos/actions";

function ConnectSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" aria-label={label} className="grid gap-3">
      <p className="text-sm text-muted">{label}</p>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-md border border-staff bg-paper-soft"
          style={{ width: index === rows - 1 ? "72%" : "100%" }}
        />
      ))}
    </div>
  );
}

type ConnectHandlers = {
  onLoaderStart: () => void;
  onLoadError: (payload: { error: { message?: string } }) => void;
};

function ConnectSlot({
  label,
  rows = 3,
  onError,
  children,
}: {
  label: string;
  rows?: number;
  onError?: (message: string) => void;
  children: (handlers: ConnectHandlers) => ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const onLoaderStart = useCallback(() => {
    setLoadError(null);
    setLoaded(true);
  }, []);

  const onLoadError = useCallback(
    (payload: { error: { message?: string } }) => {
      const message = payload.error.message?.trim() || "Não foi possível carregar este bloco.";
      setLoadError(message);
      setLoaded(true);
      onError?.(message);
    },
    [onError],
  );

  return (
    <div className="relative min-h-32" aria-busy={!loaded && !loadError}>
      {!loaded && !loadError ? (
        <div className="pointer-events-none absolute inset-0 z-10 bg-white">
          <ConnectSkeleton label={label} rows={rows} />
        </div>
      ) : null}
      {loadError ? (
        <p
          role="alert"
          className="rounded-md border border-[#A3412F]/40 bg-[#A3412F]/5 px-4 py-3 text-sm text-[#7E2F21]"
        >
          {loadError}
        </p>
      ) : (
        children({ onLoaderStart, onLoadError })
      )}
    </div>
  );
}

/** Cor de marca do Stripe nos botões dos componentes embutidos (o texto “Entrar” vem do iframe). */
const STRIPE_PURPLE = "#635BFF";

function StripeMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#635BFF] px-2.5 py-1 text-[11px] font-semibold lowercase tracking-wide text-white ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid h-4 w-4 place-items-center rounded-[3px] bg-white text-[10px] font-bold leading-none text-[#635BFF]"
      >
        S
      </span>
      stripe
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-staff bg-white">
      <header className="border-b border-staff px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-charcoal">{title}</h2>
          <StripeMark />
        </div>
        <p className="mt-1 max-w-[52ch] text-sm text-muted">{description}</p>
      </header>
      <div className="p-4 md:p-6">{children}</div>
    </section>
  );
}

function clearStripeQuery(pathname: string, router: ReturnType<typeof useRouter>) {
  router.replace(pathname, { scroll: false });
}

export function PayoutsPanel({
  publishableKey,
  payoutsReady,
  hasAccount,
}: {
  publishableKey: string;
  payoutsReady: boolean;
  hasAccount: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stripeReturnHandled = useRef(false);
  const statusRefreshHandled = useRef(false);

  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(payoutsReady);
  const [accountReady, setAccountReady] = useState(hasAccount);
  const [showStripeDetails, setShowStripeDetails] = useState(false);
  /** null = ainda carregando; 0 = sem avisos; >0 = mostrar banner */
  const [notificationTotal, setNotificationTotal] = useState<number | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const result = await createAccountSession();
    if (result.error || !result.clientSecret) {
      const message = result.error ?? "Não foi possível abrir o cadastro.";
      setError(message);
      throw new Error(message);
    }
    setError(null);
    return result.clientSecret;
  }, []);

  useEffect(() => {
    if (!accountReady || !showStripeDetails) return;

    if (!publishableKey?.trim()) {
      setError("Stripe não configurado: falta a chave pública (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).");
      setInstance(null);
      return;
    }

    const connect = loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret,
      locale: "pt-BR",
      // Connect roda em iframe: precisa do CSS da fonte, não herda o next/font do body.
      fonts: [
        {
          cssSrc:
            "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
        },
      ],
      appearance: {
        overlays: "dialog",
        variables: {
          fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
          fontSizeBase: "16px",
          colorPrimary: STRIPE_PURPLE,
          colorText: "#1C1C1C",
          colorBackground: "#FFFFFF",
          buttonPrimaryColorBackground: STRIPE_PURPLE,
          buttonPrimaryColorBorder: STRIPE_PURPLE,
          buttonPrimaryColorText: "#FFFFFF",
          borderRadius: "6px",
        },
      },
    });
    setInstance(connect);
  }, [accountReady, fetchClientSecret, publishableKey, showStripeDetails]);

  async function openOnboardingLink() {
    setBusy(true);
    setError(null);
    const result = await createAccountOnboardingLink();
    if (result.error || !result.url) {
      setBusy(false);
      setError(result.error ?? "Não foi possível abrir o cadastro no Stripe.");
      return;
    }
    setAccountReady(true);
    window.location.assign(result.url);
  }

  useEffect(() => {
    const stripe = searchParams.get("stripe");
    if (stripe !== "return" && stripe !== "refresh") return;
    if (stripeReturnHandled.current) return;
    stripeReturnHandled.current = true;
    statusRefreshHandled.current = true;

    void (async () => {
      setAccountReady(true);
      setBusy(true);
      setError(null);

      if (stripe === "refresh") {
        const link = await createAccountOnboardingLink();
        if (link.url) {
          window.location.assign(link.url);
          return;
        }
        setBusy(false);
        setError(link.error ?? "Não foi possível reabrir o cadastro. Tente de novo.");
        clearStripeQuery(pathname, router);
        return;
      }

      const result = await refreshPayoutsReady();
      setBusy(false);
      if (result.error) setError(result.error);
      setReady(result.ready);
      clearStripeQuery(pathname, router);
    })();
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (statusRefreshHandled.current) return;
    if (!accountReady || ready) return;
    if (searchParams.get("stripe") === "return" || searchParams.get("stripe") === "refresh") return;
    statusRefreshHandled.current = true;

    void (async () => {
      const result = await refreshPayoutsReady();
      if (result.error) setError(result.error);
      setReady(result.ready);
    })();
  }, [accountReady, ready, searchParams]);

  const showBannerCard = notificationTotal === null || notificationTotal > 0;

  return (
    <div className="grid gap-6">
      {ready ? (
        <div className="rounded-md border border-staff bg-white p-6">
          <p className="font-medium text-charcoal">Conta pronta para receber.</p>
          <p className="mt-1 max-w-[52ch] text-sm text-muted">
            Sua conta está pronta para receber repasses das vendas no acervo.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-copper bg-white p-6 md:p-8">
          <p className="font-medium text-charcoal">
            {accountReady ? "Continue o cadastro no Stripe." : "Comece o cadastro bancário."}
          </p>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
            Conclua o cadastro bancário no Stripe. Enquanto isso, o botão de adquirir das suas obras
            publicadas fica indisponível. Você será levado à página segura do Stripe para informar
            seus dados e a conta bancária. O repasse de cada venda cai automaticamente nessa conta.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={openOnboardingLink}
            className={`mt-6 ${primaryButtonClass}`}
          >
            {busy
              ? "Abrindo Stripe…"
              : accountReady
                ? "Continuar cadastro no Stripe"
                : "Começar cadastro de recebimento"}
          </button>
        </div>
      )}

      {error ? <FormAlert>{error}</FormAlert> : null}

      {accountReady && !showStripeDetails ? (
        <section className="overflow-hidden rounded-md border border-staff bg-white">
          <header className="border-b border-staff px-4 py-4 md:px-6 md:py-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-medium text-charcoal">Conta e repasses</h2>
              <StripeMark />
            </div>
            <p className="mt-1 max-w-[52ch] text-sm text-muted">
              Dados bancários, identidade e histórico de repasses ficam na área segura do Stripe.
              Abra quando quiser consultar ou editar.
            </p>
          </header>
          <div className="p-4 md:p-6">
            <button
              type="button"
              onClick={() => setShowStripeDetails(true)}
              className={primaryButtonClass}
            >
              Ver conta e repasses
            </button>
          </div>
        </section>
      ) : null}

      {accountReady && showStripeDetails && !instance ? (
        <div className="grid gap-6">
          <ConnectSkeleton label="Preparando o Stripe…" rows={2} />
          <ConnectSkeleton label="Carregando dados da conta…" rows={4} />
          <ConnectSkeleton label="Carregando repasses…" rows={3} />
        </div>
      ) : null}

      {accountReady && showStripeDetails && instance ? (
        <ConnectComponentsProvider connectInstance={instance}>
          <div className="grid gap-6">
            {showBannerCard ? (
              <section className="overflow-hidden rounded-md border border-staff bg-white p-4 md:p-6">
                <ConnectSlot label="Carregando avisos…" rows={2}>
                  {({ onLoaderStart, onLoadError }) => (
                    <ConnectNotificationBanner
                      onLoaderStart={onLoaderStart}
                      onLoadError={(payload) => {
                        setNotificationTotal(0);
                        onLoadError(payload);
                        const message =
                          payload.error.message?.trim() || "Não foi possível carregar os avisos.";
                        setError(message);
                      }}
                      onNotificationsChange={({ total }) => {
                        setNotificationTotal(total);
                      }}
                    />
                  )}
                </ConnectSlot>
              </section>
            ) : null}

            <SectionCard
              title="Dados da conta"
              description="Para ver ou editar identidade, e-mail e conta bancária, entre na área segura do Stripe."
            >
              <ConnectSlot label="Carregando dados da conta…" rows={4} onError={setError}>
                {({ onLoaderStart, onLoadError }) => (
                  <ConnectAccountManagement onLoaderStart={onLoaderStart} onLoadError={onLoadError} />
                )}
              </ConnectSlot>
            </SectionCard>

            <SectionCard
              title="Repasses"
              description="Histórico e status dos valores enviados à sua conta, também na área do Stripe."
            >
              <ConnectSlot label="Carregando repasses…" rows={3} onError={setError}>
                {({ onLoaderStart, onLoadError }) => (
                  <ConnectPayouts onLoaderStart={onLoaderStart} onLoadError={onLoadError} />
                )}
              </ConnectSlot>
            </SectionCard>
          </div>
        </ConnectComponentsProvider>
      ) : null}
    </div>
  );
}
