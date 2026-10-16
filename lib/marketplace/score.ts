/** Stepwise pitch rows so each sample score reads as a line, not scattered dots. */
export function scoreSystems(slug: string) {
  let seed = 2166136261;
  for (const char of slug) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }

  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };

  return Array.from({ length: 4 }, () => {
    let step = 3 + (next() % 3);
    return Array.from({ length: 12 }, () => {
      step = Math.min(8, Math.max(1, step + ((next() % 3) - 1)));
      return step;
    });
  });
}
