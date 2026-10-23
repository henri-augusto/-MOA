import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/marketplace/catalog-browser";
import { PreviewNote } from "@/components/marketplace/preview-note";
import { SectionSkeleton } from "@/components/studio/page-header";
import { listPublishedWorks } from "@/lib/marketplace/catalog";

export const metadata: Metadata = {
  title: "Acervo — MOA",
  description:
    "Arranjos para orquestra, banda e coro. Escolha a partitura, confira a grade e adquira uma vez, com grade e partes em PDF.",
};

async function CatalogSection() {
  let listings;
  try {
    listings = await listPublishedWorks();
  } catch {
    return (
      <p role="alert" className="rounded-md border border-[#A3412F]/40 bg-[#A3412F]/5 px-4 py-3 text-sm text-[#7E2F21]">
        Não foi possível carregar o acervo. Confira se o SQL do catálogo publicado foi aplicado no Supabase.
      </p>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-staff bg-paper-soft px-6 py-16 text-center md:px-12">
        <p className="font-playfair text-2xl text-charcoal">Nenhuma obra publicada ainda.</p>
        <p className="mx-auto mt-3 max-w-[46ch] leading-relaxed text-muted">
          Quando a curadoria publicar um arranjo, ele aparece aqui com preço, formação e nível técnico.
        </p>
      </div>
    );
  }

  return <CatalogBrowser listings={listings} />;
}

export default function AcervoPage() {
  return (
    <>
      <header className="border-b border-staff pb-8 md:pb-10">
        <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Loja de partituras</p>
        <h1 className="mt-4 max-w-[18ch] font-playfair text-4xl leading-[1.05] text-charcoal md:text-6xl">
          Acervo MOA
        </h1>
        <div className="mt-6">
          <PreviewNote />
        </div>
      </header>

      <div className="mt-2">
        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <CatalogSection />
        </Suspense>
      </div>
    </>
  );
}
