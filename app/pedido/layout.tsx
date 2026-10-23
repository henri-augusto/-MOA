import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/landing/logo";

export default function PedidoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-staff">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 md:px-8">
          <Link href="/" aria-label="MOA, início">
            <Logo />
          </Link>
          <Link href="/acervo" className="text-sm text-muted hover:text-charcoal">
            Acervo
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
