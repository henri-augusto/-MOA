import type { ReactNode } from "react";

export const inputClass =
  "min-h-12 w-full rounded-md border bg-white px-4 text-base text-charcoal placeholder:text-[#9A948A] transition-colors duration-300 focus:border-charcoal focus:outline-none disabled:bg-paper-soft disabled:text-muted";

export const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-copper px-6 text-sm font-semibold text-charcoal transition duration-300 hover:bg-[#B8924B] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

export const secondaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-charcoal px-6 text-sm font-medium text-charcoal transition duration-300 hover:bg-charcoal hover:text-paper-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export const errorTextClass = "text-sm text-[#A3412F]";

export function borderFor(error?: string) {
  return error ? "border-[#A3412F]" : "border-staff";
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ id, label, hint, error, children, className = "" }: FieldProps) {
  return (
    <div className={`grid content-start gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className={errorTextClass}>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-ajuda`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-erro`;
  if (hint) return `${id}-ajuda`;
  return undefined;
}

export function FormAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  const palette =
    tone === "error"
      ? "border-[#A3412F]/40 bg-[#A3412F]/5 text-[#7E2F21]"
      : "border-copper bg-white text-ink";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${palette}`}>
      {children}
    </p>
  );
}
