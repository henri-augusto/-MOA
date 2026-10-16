import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { SiteNav, SiteNavLinks } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-4 z-40 px-4 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-md border border-staff bg-paper-soft/85 px-5 py-3 shadow-[0_8px_30px_-18px_rgba(45,45,45,0.35)] backdrop-blur-md md:px-7">
        <Link href="/" className="rounded-sm py-1" aria-label="MOA, voltar ao início">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <Suspense fallback={<SiteNavLinks pathname={null} />}>
            <SiteNav />
          </Suspense>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/arranjador/cadastro"
            className="inline-flex min-h-11 items-center rounded-md border border-charcoal px-4 text-sm font-medium text-charcoal transition duration-300 hover:bg-charcoal hover:text-paper-soft active:scale-[0.98]"
          >
            Publicar obra
          </Link>
          <Link
            href="/acervo"
            className="inline-flex min-h-11 items-center rounded-md bg-copper px-4 text-sm font-semibold text-charcoal transition duration-300 hover:bg-[#B8924B] active:scale-[0.98]"
          >
            Adquirir obra
          </Link>
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
