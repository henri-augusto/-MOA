export function LevelMeter({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Nível técnico ${level} de 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`h-3 w-px ${step <= level ? "bg-charcoal" : "bg-staff"}`}
        />
      ))}
    </span>
  );
}
