export function formatPlanPrice(plan: {
  priceCents: number;
  currency: string;
}): string {
  if (plan.priceCents === 0) return "Grátis";
  return formatCents(plan.priceCents, plan.currency);
}

export function formatCents(cents: number, currency = "brl"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDatePt(isoDate: string): string {
  const date = isoDate.includes("T")
    ? new Date(isoDate)
    : new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

/** First day of the month after `periodStart` (YYYY-MM-01). */
export function nextQuotaResetIso(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);
  const next = new Date(year, month, 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function estimateProrationCents(input: {
  currentPriceCents: number;
  nextPriceCents: number;
  periodStartMs: number;
  periodEndMs: number;
  nowMs?: number;
}): number {
  const now = input.nowMs ?? Date.now();
  const total = Math.max(1, input.periodEndMs - input.periodStartMs);
  const remaining = Math.max(0, input.periodEndMs - now);
  const delta = Math.max(0, input.nextPriceCents - input.currentPriceCents);
  return Math.round(delta * (remaining / total));
}
