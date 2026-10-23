"use client";

import { primaryButtonClass, secondaryButtonClass } from "@/components/studio/form";

export function PaymentUnavailable({
  priceLabel,
  onPreviewConfirm,
  onBack,
}: {
  priceLabel: string;
  onPreviewConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="rounded-md border border-dashed border-staff bg-paper-soft px-5 py-6 md:px-6">
        <p className="text-sm font-medium text-charcoal">Pagamento ainda não ligado</p>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">
          Defina as chaves do Stripe e a service role do Supabase para cobrar de verdade. Nada é cobrado
          agora.
        </p>
        <button type="button" disabled className={`mt-6 w-full sm:w-auto ${primaryButtonClass}`}>
          Pagar {priceLabel}
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onPreviewConfirm} className={secondaryButtonClass}>
          Ver a confirmação
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center justify-center px-2 text-sm text-muted hover:text-charcoal"
        >
          Voltar aos dados
        </button>
      </div>
    </div>
  );
}
