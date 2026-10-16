import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/landing/logo";
import { StudioNav, StudioNavLinks } from "@/components/studio/studio-nav";
import { displayName } from "@/lib/arranger/catalog";
import { requireArranger } from "@/lib/arranger/session";
import { signOut } from "./actions";

async function ArrangerBadge() {
  const { supabase, userId } = await requireArranger();
  const { data } = await supabase
    .from("profiles")
    .select("artist_name, full_name")
    .eq("id", userId)
    .maybeSingle();

  return (
    <p className="truncate text-sm text-paper-soft" title={displayName(data)}>
      {displayName(data)}
    </p>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-[#A9A294] transition-colors duration-300 hover:text-paper-soft ${
          compact ? "px-2" : "w-full px-3 hover:bg-white/[0.04]"
        }`}
      >
        <SignOutIcon size={18} weight="light" aria-hidden="true" />
        Sair
      </button>
    </form>
  );
}

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-charcoal px-4 py-8 lg:flex">
        <Link href="/arranjador" className="self-start rounded-sm px-3 py-1" aria-label="Estúdio MOA, início">
          <Logo tone="dark" />
        </Link>
        <p className="mt-3 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-copper">
          Estúdio do arranjador
        </p>

        <nav aria-label="Estúdio" className="mt-12">
          <Suspense fallback={<StudioNavLinks pathname={null} layout="sidebar" />}>
            <StudioNav layout="sidebar" />
          </Suspense>
        </nav>

        <div className="mt-auto grid gap-2 border-t border-white/10 pt-6">
          <div className="px-3 pb-2">
            <p className="text-xs text-[#A9A294]">Conectado como</p>
            <Suspense fallback={<p className="h-5 w-32 animate-pulse rounded-sm bg-white/10" />}>
              <ArrangerBadge />
            </Suspense>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-[#A9A294] transition-colors duration-300 hover:bg-white/[0.04] hover:text-paper-soft"
          >
            <ArrowUpRightIcon size={18} weight="light" aria-hidden="true" />
            Ver o site
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-40 bg-charcoal px-4 pt-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/arranjador" className="rounded-sm py-1" aria-label="Estúdio MOA, início">
            <Logo tone="dark" />
          </Link>
          <SignOutButton compact />
        </div>
        <nav aria-label="Estúdio" className="mt-3 -mx-1">
          <Suspense fallback={<StudioNavLinks pathname={null} layout="tabs" />}>
            <StudioNav layout="tabs" />
          </Suspense>
        </nav>
      </header>

      <main className="min-w-0 px-4 py-10 md:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
