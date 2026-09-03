export function formatPlanPrice(plan: {
  priceCents: number;
  currency: string;
}): string {
  if (plan.priceCents === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
  }).format(plan.priceCents / 100);
}
