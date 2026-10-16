import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import type { Metadata } from "next";
import Link from "next/link";
import { primaryButtonClass } from "@/components/studio/form";

export const metadata: Metadata = {
  title: "Obra não encontrada — Acervo — MOA",
};

export default function AcervoNotFound() {
  return (
    <div className="max-w-xl py-16">
      <h1 className="font-playfair text-4xl leading-tight text-charcoal md:text-5xl">
        Esta obra não está no acervo.
      </h1>
      <p className="mt-4 max-w-[46ch] leading-relaxed text-muted">
        O endereço pode ter mudado, ou a partitura ainda não foi publicada.
      </p>
      <Link href="/acervo" className={`mt-8 ${primaryButtonClass}`}>
        <ArrowLeftIcon size={16} weight="light" aria-hidden="true" />
        Voltar ao acervo
      </Link>
    </div>
  );
}
