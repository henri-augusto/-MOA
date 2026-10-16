import { Suspense } from "react";
import { Audiences } from "@/components/landing/audiences";
import { Catalog } from "@/components/landing/catalog";
import { Closing } from "@/components/landing/closing";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SectionSkeleton } from "@/components/studio/page-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Audiences />
        <Suspense fallback={<SectionSkeleton rows={3} />}>
          <Catalog />
        </Suspense>
        <HowItWorks />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}
