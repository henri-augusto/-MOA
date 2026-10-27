import type { Metadata } from "next";
import Link from "next/link";
import { io } from "next/cache";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/landing/logo";
import { primaryButtonClass, secondaryButtonClass } from "@/components/studio/form";
import { createClient } from "@/lib/supabase/server";
import { signOutCurator } from "../(painel)/actions";

export const metadata: Metadata = {
  title: "Acesso negado — Curadoria — MOA",
};

function AccessDeniedFallback() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando"
      className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16"
    >
      <div className="h-3 w-24 animate-pulse rounded-sm bg-staff" />
      <div className="mt-4 h-10 max-w-sm animate-pulse rounded-sm bg-staff" />
      <div className="mt-4 h-20 animate-pulse rounded-sm bg-paper" />
    </main>
  );
}

export default function CuratorAccessDeniedPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper-soft">
      <header className="border-b border-staff bg-charcoal px-4 py-4 md:px-8">
        <Link href="/" className="inline-flex rounded-sm py-1" aria-label="MOA, voltar à página inicial">
          <Logo tone="dark" />
        </Link>
      </header>
      <Suspense fallback={<AccessDeniedFallback />}>
        <AccessDeniedBody />
      </Suspense>
    </div>
  );
}

async function AccessDeniedBody() {
  // getClaims() compara o JWT com Date.now(); precisa sair do prerender.
  await io();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    redirect("/curadoria/entrar");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">Curadoria</p>
      <h1 className="mt-4 font-playfair text-3xl leading-tight text-charcoal md:text-4xl">
        Esta conta não é de curadoria.
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        A fila de revisão só abre para perfis com a marca de curador no Supabase. Se você publica arranjos, use o
        estúdio.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/arranjador" className={primaryButtonClass}>
          Ir ao estúdio
        </Link>
        <form action={signOutCurator}>
          <button type="submit" className={secondaryButtonClass}>
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
