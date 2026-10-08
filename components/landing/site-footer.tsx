import { Baton, Logo } from "./logo";
import { navLinks } from "./nav-links";

export function SiteFooter() {
  return (
    <footer className="border-t border-staff">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <Logo withTagline />
          <Baton className="mt-8 h-3 w-48" />
          <p className="mt-8 max-w-[38ch] text-sm leading-relaxed text-muted">
            Um acervo de arranjos para quem leva a música de conjunto a sério, do primeiro ensaio
            à noite de estreia.
          </p>
        </div>

        <nav aria-label="Rodapé" className="md:col-span-3 md:col-start-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Navegar</p>
          <ul className="mt-4 grid gap-1 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="inline-flex min-h-10 items-center text-ink hover:text-copper-deep">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#interesse" className="inline-flex min-h-10 items-center text-ink hover:text-copper-deep">
                Lista de abertura
              </a>
            </li>
          </ul>
        </nav>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Contato</p>
          <a
            href="mailto:contato@moa.art.br"
            className="mt-4 inline-flex min-h-10 items-center text-sm text-ink hover:text-copper-deep"
          >
            contato@moa.art.br
          </a>
        </div>
      </div>
      <div className="border-t border-staff">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>
            © 2026 MOA — Master of Arrangement. Todos os direitos reservados aos respectivos
            arranjadores.
          </p>
          <p>
            Site criado e administrado por{" "}
            <a
              href="https://www.agencylogos.com/pt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline decoration-staff underline-offset-4 transition-colors duration-300 hover:text-copper-deep hover:decoration-copper"
            >
              Agency Logos
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
