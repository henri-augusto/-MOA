"use client";

import { useEffect, useState } from "react";
import { navLinks } from "./nav-links";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-11 items-center justify-center rounded-md border border-staff bg-white"
      >
        <span
          aria-hidden="true"
          className={`absolute h-px w-5 bg-charcoal transition-transform duration-500 ease-gallery ${open ? "rotate-45" : "-translate-y-[4px]"}`}
        />
        <span
          aria-hidden="true"
          className={`absolute h-px w-5 bg-charcoal transition-transform duration-500 ease-gallery ${open ? "-rotate-45" : "translate-y-[4px]"}`}
        />
      </button>

      <div
        id="menu-mobile"
        hidden={!open}
        className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-md border border-staff bg-paper-soft p-6 shadow-[0_24px_60px_-30px_rgba(45,45,45,0.45)]"
      >
        <nav aria-label="Principal (mobile)">
          <ul className="divide-y divide-staff">
            {navLinks.map((link, index) => (
              <li
                key={link.href}
                className="animate-rise"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <a
                  href={link.href}
                  onClick={close}
                  className="flex min-h-12 items-center font-playfair text-2xl text-charcoal"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 grid gap-3">
          <a
            href="#acervo"
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-copper text-sm font-semibold text-charcoal"
          >
            Adquirir obra
          </a>
          <a
            href="#arranjadores"
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-charcoal text-sm font-medium text-charcoal"
          >
            Publicar obra
          </a>
        </div>
      </div>
    </div>
  );
}
