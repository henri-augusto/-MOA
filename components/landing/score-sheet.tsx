const systems = [
  [3, 5, 4, 6, 7, 5, 4, 2, 3, 5, 6, 8],
  [6, 5, 3, 4, 2, 4, 5, 7, 6, 4, 3, 1],
  [2, 4, 5, 7, 8, 6, 5, 3, 4, 6, 5, 3],
  [5, 6, 8, 7, 5, 4, 2, 3, 5, 4, 3, 2],
];

const STAFF_GAP = 7;
const STAFF_LEFT = 44;
const STAFF_RIGHT = 372;
const NOTE_START = 78;
const NOTE_STEP = 24.5;

function Staff({ top, notes }: { top: number; notes: number[] }) {
  const bottom = top + STAFF_GAP * 4;

  return (
    <g>
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1={STAFF_LEFT}
          x2={STAFF_RIGHT}
          y1={top + line * STAFF_GAP}
          y2={top + line * STAFF_GAP}
          stroke="#2D2D2D"
          strokeOpacity="0.55"
          strokeWidth="0.7"
        />
      ))}
      <line x1={STAFF_LEFT} x2={STAFF_LEFT} y1={top} y2={bottom} stroke="#2D2D2D" strokeWidth="0.9" />
      {[1, 2, 3].map((bar) => {
        const x = NOTE_START - 12 + bar * NOTE_STEP * 4 - 2;
        return (
          <line key={bar} x1={x} x2={x} y1={top} y2={bottom} stroke="#2D2D2D" strokeOpacity="0.7" strokeWidth="0.8" />
        );
      })}
      <line x1={STAFF_RIGHT} x2={STAFF_RIGHT} y1={top} y2={bottom} stroke="#2D2D2D" strokeWidth="0.9" />

      <text x={STAFF_LEFT + 4} y={bottom + 2} fontFamily="serif" fontSize="34" fill="#2D2D2D">
        𝄞
      </text>

      {notes.map((step, index) => {
        const x = NOTE_START + index * NOTE_STEP;
        const y = bottom - step * (STAFF_GAP / 2);
        const stemUp = step < 4;
        return (
          <g key={index}>
            <ellipse cx={x} cy={y} rx="3.6" ry="2.6" transform={`rotate(-20 ${x} ${y})`} fill="#1C1C1C" />
            <line
              x1={stemUp ? x + 3.3 : x - 3.3}
              x2={stemUp ? x + 3.3 : x - 3.3}
              y1={y}
              y2={stemUp ? y - 22 : y + 22}
              stroke="#1C1C1C"
              strokeWidth="0.9"
            />
          </g>
        );
      })}
    </g>
  );
}

export function ScoreSheet({ className = "" }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Primeira página de uma partitura de Odeon, de Ernesto Nazareth, arranjada para orquestra de cordas"
      viewBox="0 0 400 520"
      className={className}
    >
      <rect width="400" height="520" fill="#FFFFFF" />
      <text x="200" y="58" textAnchor="middle" fontFamily="var(--font-playfair-display), serif" fontSize="26" fill="#1C1C1C">
        Odeon
      </text>
      <text x="200" y="80" textAnchor="middle" fontFamily="var(--font-jakarta), sans-serif" fontSize="8.5" letterSpacing="2.4" fill="#5F5A52">
        TANGO BRASILEIRO PARA ORQUESTRA DE CORDAS
      </text>
      <text x="372" y="106" textAnchor="end" fontFamily="var(--font-jakarta), sans-serif" fontSize="8" fill="#2D2D2D">
        Ernesto Nazareth
      </text>
      <text x="372" y="118" textAnchor="end" fontFamily="var(--font-jakarta), sans-serif" fontSize="8" fill="#7D5F26">
        arr. Helena Vasconcellos Prado
      </text>
      <text x={STAFF_LEFT} y="134" fontFamily="var(--font-playfair-display), serif" fontStyle="italic" fontSize="9" fill="#2D2D2D">
        Allegretto, com graça
      </text>

      {systems.map((notes, index) => (
        <Staff key={index} top={160 + index * 82} notes={notes} />
      ))}

      <line x1={STAFF_LEFT} x2={STAFF_RIGHT} y1="492" y2="492" stroke="#E8E3D5" />
      <text x="200" y="506" textAnchor="middle" fontFamily="var(--font-jakarta), sans-serif" fontSize="7" letterSpacing="1.6" fill="#5F5A52">
        MOA · ACERVO PREMIUM · GRADE — 1
      </text>
    </svg>
  );
}
