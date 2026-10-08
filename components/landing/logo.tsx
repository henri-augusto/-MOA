type LogoProps = {
  withTagline?: boolean;
  className?: string;
};

export function Logo({ withTagline = false, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="relative inline-block self-start pr-4 font-playfair text-[1.65rem] font-medium tracking-[0.04em] text-charcoal">
        MOA
        <svg
          aria-hidden="true"
          viewBox="0 0 40 14"
          className="absolute -right-1 bottom-[0.32em] h-[0.42em] w-auto text-copper"
          fill="none"
        >
          <path
            d="M1 11c6-1 9-7 14-7 4 0 3 6 8 6 5 0 8-6 16-8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {withTagline ? (
        <span className="mt-2 text-[0.62rem] font-medium uppercase tracking-[0.28em] text-muted">
          Master of Arrangement
        </span>
      ) : null}
      <span className="sr-only"> — Master of Arrangement</span>
    </span>
  );
}

export function Baton({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 16"
      fill="none"
      className={className}
    >
      <path d="M2 9.2 252 6.2v3.6L2 9.6Z" fill="#2D2D2D" />
      <path d="M120 8.4 252 7.4" stroke="#C5A059" strokeWidth="1.2" />
      <rect x="252" y="4.6" width="8" height="7" rx="1.5" fill="#2D2D2D" />
      <path
        d="M260 5.2c10-.6 22-3.2 40-3.2 10 0 16 2.6 16 6s-6 6-16 6c-18 0-30-2.6-40-3.2Z"
        stroke="#2D2D2D"
        strokeWidth="1.6"
      />
      <path d="M268 8c12 0 22-1.6 34-1.2" stroke="#C5A059" strokeWidth="1.2" />
    </svg>
  );
}
