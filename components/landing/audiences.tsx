import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { BooksIcon } from "@phosphor-icons/react/dist/ssr/Books";
import { CertificateIcon } from "@phosphor-icons/react/dist/ssr/Certificate";
import { CoinsIcon } from "@phosphor-icons/react/dist/ssr/Coins";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { FoldersIcon } from "@phosphor-icons/react/dist/ssr/Folders";
import { UploadSimpleIcon } from "@phosphor-icons/react/dist/ssr/UploadSimple";

type Feature = { icon: Icon; title: string; description: string };

const buyerFeatures: Feature[] = [
  {
    icon: CertificateIcon,
    title: "Adquirir obra",
    description:
      "Pagamento único por arranjo. Depois da compra, a obra fica na sua conta para baixar quando precisar.",
  },
  {
    icon: DownloadSimpleIcon,
    title: "Baixar partitura",
    description:
      "Grade completa e partes cavadas em PDF, prontas para estante, com a revisão do próprio arranjador.",
  },
  {
    icon: BooksIcon,
    title: "Acervo Premium",
    description:
      "Obras selecionadas por formação, nível técnico e duração, para montar o programa da temporada.",
  },
];

const arrangerFeatures: Feature[] = [
  {
    icon: UploadSimpleIcon,
    title: "Upload de obra",
    description: "Envie grade, partes e áudio de referência. Nossa curadoria revisa antes de publicar.",
  },
  {
    icon: FoldersIcon,
    title: "Seu catálogo",
    description: "Uma vitrine com o seu nome, suas formações e o histórico de cada arranjo.",
  },
  {
    icon: CoinsIcon,
    title: "Gerenciar royalties",
    description: "Acompanhe vendas e repasses em um painel, obra por obra.",
  },
];

function FeatureList({ features, tone }: { features: Feature[]; tone: "light" | "dark" }) {
  const divider = tone === "light" ? "divide-staff" : "divide-white/10";
  const title = tone === "light" ? "text-charcoal" : "text-paper-soft";
  const body = tone === "light" ? "text-muted" : "text-[#C9C3B6]";

  return (
    <ul className={`divide-y ${divider}`}>
      {features.map(({ icon: FeatureIcon, title: featureTitle, description }) => (
        <li key={featureTitle} className="flex gap-5 py-6 first:pt-0 last:pb-0">
          <FeatureIcon size={26} weight="light" className="mt-0.5 shrink-0 text-copper" aria-hidden="true" />
          <div>
            <h4 className={`font-semibold ${title}`}>{featureTitle}</h4>
            <p className={`mt-1.5 max-w-[48ch] text-sm leading-relaxed ${body}`}>{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Audiences() {
  return (
    <section className="border-t border-staff">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        <div className="reveal grid gap-6 lg:grid-cols-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper-deep lg:col-span-3">
            Para quem é o MOA
          </p>
          <h2 className="font-playfair text-3xl leading-tight text-charcoal md:text-5xl lg:col-span-8">
            Quem rege encontra o arranjo. Quem escreve encontra o palco.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-12 lg:items-start">
          <article className="reveal rounded-md border border-staff bg-white p-8 shadow-[0_20px_50px_-35px_rgba(45,45,45,0.35)] md:p-12 lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Regentes e instituições
            </p>
            <h3 className="mt-4 max-w-[22ch] font-playfair text-2xl text-charcoal md:text-3xl">
              Repertório pronto para a estante, direto de quem escreveu.
            </h3>
            <div className="mt-10">
              <FeatureList features={buyerFeatures} tone="light" />
            </div>
          </article>

          <article
            id="arranjadores"
            className="reveal rounded-md bg-charcoal p-8 md:p-12 lg:col-span-5 lg:mt-24"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper">Arranjadores</p>
            <h3 className="mt-4 font-playfair text-2xl text-paper-soft md:text-3xl">
              Seu trabalho, com assinatura e repasse.
            </h3>
            <div className="mt-10">
              <FeatureList features={arrangerFeatures} tone="dark" />
            </div>
            <a
              href="#interesse"
              className="mt-10 inline-flex min-h-12 items-center rounded-md border border-copper px-5 text-sm font-medium text-copper transition duration-300 hover:bg-copper hover:text-charcoal active:scale-[0.98]"
            >
              Quero publicar minhas obras
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
