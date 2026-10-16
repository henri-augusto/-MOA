import { STATUS_LABELS, type WorkStatus } from "@/lib/arranger/catalog";

const styles: Record<WorkStatus, string> = {
  rascunho: "border-staff text-muted",
  em_revisao: "border-copper text-copper-deep",
  publicado: "border-charcoal bg-charcoal text-paper-soft",
};

export function StatusBadge({ status }: { status: WorkStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
