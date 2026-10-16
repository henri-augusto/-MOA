import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta de arranjador — MOA",
};

export default function SignUpPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">Cadastro</p>
      <h1 className="mt-4 font-playfair text-3xl leading-tight text-charcoal md:text-4xl">
        Publique suas obras no MOA.
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        Crie sua conta e, em seguida, conte quem você é. O perfil aparece ao lado de cada arranjo.
      </p>

      <div className="mt-10">
        <SignUpForm />
      </div>

      <p className="mt-8 text-sm text-muted">
        Já tem conta?{" "}
        <Link
          href="/arranjador/entrar"
          className="font-medium text-charcoal underline decoration-staff underline-offset-[6px] transition-colors hover:decoration-copper"
        >
          Entrar
        </Link>
      </p>
    </>
  );
}
