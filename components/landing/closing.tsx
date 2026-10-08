import { InterestForm } from "./interest-form";

export function Closing() {
  return (
    <section id="interesse" className="border-t border-staff bg-paper-soft">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-12 lg:items-center">
        <div className="reveal lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">
            Abertura do acervo
          </p>
          <h2 className="mt-5 font-playfair text-3xl leading-tight text-charcoal md:text-5xl">
            Reserve seu lugar na primeira fila.
          </h2>
          <p className="mt-6 max-w-[44ch] leading-relaxed text-muted">
            Estamos reunindo os primeiros arranjadores e conjuntos. Deixe seu contato e receba o
            convite quando o MOA abrir.
          </p>
        </div>
        <div className="reveal lg:col-span-6 lg:col-start-7">
          <InterestForm />
        </div>
      </div>
    </section>
  );
}
