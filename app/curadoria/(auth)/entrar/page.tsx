import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/app/arranjador/(auth)/entrar/sign-in-form";

export const metadata: Metadata = {
  title: "Entrar — Curadoria — MOA",
};

export default function CuratorSignInPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">Curadoria</p>
      <h1 className="mt-4 font-playfair text-3xl leading-tight text-charcoal md:text-4xl">Entrar para revisar.</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Use a conta marcada como curadoria no Supabase. Contas de arranjador não enxergam a fila.
      </p>

      <div className="mt-10">
        <SignInForm next="/curadoria" />
      </div>

      <p className="mt-8 text-sm text-muted">
        Publica arranjos?{" "}
        <Link
          href="/arranjador/entrar"
          className="font-medium text-charcoal underline decoration-staff underline-offset-[6px] transition-colors hover:decoration-copper"
        >
          Ir ao estúdio
        </Link>
      </p>
    </>
  );
}
