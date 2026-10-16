import { formatInteger } from "@/lib/arranger/catalog";

export type DailyAccess = { day: string; total: number };

const WIDTH = 600;
const HEIGHT = 180;
const dayFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });

function label(day: string) {
  return dayFormat.format(new Date(`${day}T00:00:00Z`)).replace(".", "");
}

export function AccessChart({ series }: { series: DailyAccess[] }) {
  const total = series.reduce((sum, point) => sum + point.total, 0);
  const peak = series.reduce((best, point) => (point.total > best.total ? point : best), series[0] ?? { day: "", total: 0 });
  const max = Math.max(peak.total, 1);
  const step = series.length > 1 ? WIDTH / (series.length - 1) : WIDTH;

  const points = series.map((point, index) => {
    const x = index * step;
    const y = HEIGHT - (point.total / max) * (HEIGHT - 12);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${points.join(" L")}`;
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  const summary =
    total === 0
      ? "Nenhum acesso registrado nos últimos 30 dias."
      : `${formatInteger(total)} acessos nos últimos 30 dias, com pico de ${formatInteger(peak.total)} em ${label(peak.day)}.`;

  return (
    <figure className="rounded-md border border-staff bg-white p-6 md:p-8">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-charcoal">Acessos por dia</span>
        <span className="text-xs text-muted">Página, audições e prévias de partitura</span>
      </figcaption>

      <div className="relative mt-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2].map((line) => (
            <span key={line} className="border-t border-dashed border-staff" />
          ))}
        </div>
        <svg
          role="img"
          aria-label={summary}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="relative h-44 w-full overflow-visible md:h-52"
        >
          <defs>
            <linearGradient id="access-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
            </linearGradient>
          </defs>
          {total > 0 ? <path d={area} fill="url(#access-fill)" /> : null}
          <path
            d={line}
            fill="none"
            stroke={total > 0 ? "#7D5F26" : "#E8E3D5"}
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
        {total === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted">
            Os acessos aparecem aqui quando o acervo abrir.
          </p>
        ) : null}
      </div>

      {series.length > 0 ? (
        <div className="mt-3 flex justify-between text-xs tabular-nums text-muted">
          <span>{label(series[0].day)}</span>
          {total > 0 ? (
            <span>
              Pico: {formatInteger(peak.total)} em {label(peak.day)}
            </span>
          ) : null}
          <span>{label(series[series.length - 1].day)}</span>
        </div>
      ) : null}
    </figure>
  );
}
