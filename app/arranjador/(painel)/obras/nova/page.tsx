import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, SectionSkeleton } from "@/components/studio/page-header";
import { requireArranger } from "@/lib/arranger/session";
import { WorkForm } from "../work-form";

export const metadata: Metadata = {
  title: "Nova obra — Estúdio do arranjador — MOA",
};

async function NewWorkForm() {
  const { userId } = await requireArranger();
  return (
    <WorkForm userId={userId} work={null} files={{ score: null, parts: null, audio: null, preview: null }} />
  );
}

export default function NewWorkPage() {
  return (
    <>
      <Link href="/arranjador/obras" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-charcoal">
        ← Obras
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow="Nova obra"
          title="Cadastrar arranjo."
          description="Preencha os dados como aparecerão no acervo e anexe o material. Grade e partes são obrigatórias para enviar à revisão."
        />
      </div>
      <div className="mt-10">
        <Suspense fallback={<SectionSkeleton rows={4} />}>
          <NewWorkForm />
        </Suspense>
      </div>
    </>
  );
}
