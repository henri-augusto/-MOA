import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/landing/logo";

const promises = [
  "Grade, partes e áudio de referência em um só envio",
  "Curadoria revisa antes de a obra chegar ao acervo",
  "Acessos e vendas acompanhados obra por obra",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-12">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-charcoal p-12 lg:col-span-5 lg:flex xl:p-16">
        <Link href="/" className="self-start rounded-sm py-1" aria-label="MOA, voltar à página inicial">
          <Logo tone="dark" />
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Estúdio do arranjador</p>
          <p className="mt-6 max-w-[16ch] font-playfair text-4xl leading-tight text-paper-soft xl:text-5xl">
            Seu trabalho, com assinatura e repasse.
          </p>
          <ul className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {promises.map((promise) => (
              <li key={promise} className="py-4 text-sm leading-relaxed text-[#C9C3B6]">
                {promise}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-[#A9A294]">Master of Arrangement</p>
      </aside>

      <main className="flex flex-col px-4 py-10 md:px-8 lg:col-span-7 lg:justify-center lg:py-16">
        <Link href="/" className="mb-12 self-start rounded-sm py-1 lg:hidden" aria-label="MOA, voltar à página inicial">
          <Logo />
        </Link>
        <div className="mx-auto w-full max-w-md animate-rise">{children}</div>
      </main>
    </div>
  );
}
