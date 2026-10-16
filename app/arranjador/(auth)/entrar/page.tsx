import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LinkErrorNotice } from "./link-error-notice";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Entrar — Estúdio do arranjador — MOA",
};

export default function SignInPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">Estúdio</p>
      <h1 className="mt-4 font-playfair text-3xl leading-tight text-charcoal md:text-4xl">Bom te ver de novo.</h1>
      <p className="mt-4 leading-relaxed text-muted">Entre para acompanhar suas obras, acessos e vendas.</p>

      <Suspense fallback={null}>
        <LinkErrorNotice />
      </Suspense>

      <div className="mt-10">
        <SignInForm />
      </div>

      <p className="mt-8 text-sm text-muted">
        Ainda não publica no MOA?{" "}
        <Link
          href="/arranjador/cadastro"
          className="font-medium text-charcoal underline decoration-staff underline-offset-[6px] transition-colors hover:decoration-copper"
        >
          Criar conta de arranjador
        </Link>
      </p>
    </>
  );
}
