"use client";

import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { HouseSimpleIcon } from "@phosphor-icons/react/dist/csr/HouseSimple";
import { MusicNotesIcon } from "@phosphor-icons/react/dist/csr/MusicNotes";
import { QueueIcon } from "@phosphor-icons/react/dist/csr/Queue";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet";
import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinks: { href: string; label: string; icon: Icon }[] = [
  { href: "/arranjador", label: "Início", icon: HouseSimpleIcon },
  { href: "/arranjador/obras", label: "Obras", icon: MusicNotesIcon },
  { href: "/arranjador/recebimentos", label: "Recebimentos", icon: WalletIcon },
  { href: "/arranjador/perfil", label: "Perfil", icon: UserCircleIcon },
];

const curatorLink = { href: "/curadoria", label: "Curadoria", icon: QueueIcon };

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/arranjador") return pathname === href;
  if (href === "/curadoria") return pathname === href || pathname.startsWith("/curadoria/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Layout = "sidebar" | "tabs";

export function StudioNavLinks({
  pathname,
  layout,
  showCurator = false,
}: {
  pathname: string | null;
  layout: Layout;
  showCurator?: boolean;
}) {
  const links = showCurator ? [...baseLinks, curatorLink] : baseLinks;

  if (layout === "tabs") {
    return (
      <ul className="flex gap-1 overflow-x-auto">
        {links.map(({ href, label }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm transition-colors duration-300 ${
                  active ? "border-copper text-paper-soft" : "border-transparent text-[#A9A294] hover:text-paper-soft"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="grid gap-1">
      {links.map(({ href, label, icon: LinkIcon }) => {
        const active = isActive(href, pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-300 ${
                active ? "bg-white/[0.06] text-paper-soft" : "text-[#A9A294] hover:bg-white/[0.04] hover:text-paper-soft"
              }`}
            >
              <LinkIcon
                size={20}
                weight={active ? "regular" : "light"}
                className={active ? "text-copper" : undefined}
                aria-hidden="true"
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function StudioNav({ layout, showCurator = false }: { layout: Layout; showCurator?: boolean }) {
  const pathname = usePathname();
  return <StudioNavLinks pathname={pathname} layout={layout} showCurator={showCurator} />;
}
