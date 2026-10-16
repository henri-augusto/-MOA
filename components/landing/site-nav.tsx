"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "./nav-links";

export function SiteNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-9 text-sm text-ink">
      {navLinks.map((link) => {
        const active = link.href === "/acervo" && Boolean(pathname?.startsWith("/acervo"));
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative py-2 transition-colors duration-300 ${
                active ? "text-charcoal" : "hover:text-copper-deep"
              }`}
            >
              {link.label}
              {active ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-px bg-copper" /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  return <SiteNavLinks pathname={pathname} />;
}
