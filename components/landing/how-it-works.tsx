const steps = [
  {
    name: "Escolha o arranjo",
    description: "Filtre o acervo por formação, nível técnico e duração e ouça o áudio de referência.",
    note: "Prévia da grade antes da compra",
  },
  {
    name: "Adquira a obra",
    description: "Pagamento único por arranjo. A obra fica registrada na sua conta, com nota fiscal.",
    note: "Sem assinatura ou mensalidade",
  },
  {
    name: "Baixe e ensaie",
    description: "Grade completa e partes cavadas em PDF, prontas para imprimir e distribuir aos músicos.",
    note: "Downloads disponíveis sempre que precisar",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-staff">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-12">
        <div className="reveal lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep">
            Como funciona
          </p>
          <h2 className="mt-5 font-playfair text-3xl leading-tight text-charcoal md:text-5xl">
            Da escolha à estante, em três passos.
          </h2>
          <p className="mt-6 max-w-[44ch] leading-relaxed text-muted">
            Você adquire o arranjo uma vez e recebe todo o material para o ensaio. A cada obra
            vendida, o arranjador recebe sua parte e acompanha tudo no painel Gerenciar Royalties.
          </p>
        </div>

        <ol className="reveal lg:col-span-7 lg:col-start-6">
          {steps.map((step, index) => (
            <li
              key={step.name}
              className="grid gap-4 border-t border-staff py-9 last:border-b md:grid-cols-[4rem_1fr_14rem] md:gap-8"
            >
              <span className="font-playfair text-2xl italic text-copper-deep tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-playfair text-2xl text-charcoal">{step.name}</h3>
                <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
              <p className="text-sm text-ink md:pt-2">{step.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
