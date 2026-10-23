/** Comissão da plataforma em basis points (3000 = 30%). */
export const PLATFORM_FEE_BPS = 3000;

export function splitSale(priceCents: number) {
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    throw new Error("Preço inválido.");
  }

  const platformFeeCents = Math.round((priceCents * PLATFORM_FEE_BPS) / 10_000);
  const arrangerShareCents = priceCents - platformFeeCents;

  return {
    grossCents: priceCents,
    platformFeeCents,
    arrangerShareCents,
  };
}
