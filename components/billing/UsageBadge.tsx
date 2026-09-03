"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BillingUsage {
  plan: { name: string; slug: string };
  usage: number;
  limit: number;
  remaining: number;
}

export function UsageBadge() {
  const [billing, setBilling] = useState<BillingUsage | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/billing/usage");
        if (!res.ok) return;
        const data = (await res.json()) as { billing?: BillingUsage };
        setBilling(data.billing ?? null);
      } catch {
        // ignore
      }
    })();
  }, []);

  if (!billing) return null;

  const ratio = billing.limit > 0 ? billing.usage / billing.limit : 0;
  const warn = ratio >= 0.8;

  return (
    <Link
      href="/planos"
      className={`mb-2 block rounded-xl border px-3 py-2 text-center text-xs transition-colors ${
        warn
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-black/10 bg-surface text-muted hover:bg-white"
      }`}
    >
      <span className="font-medium text-foreground">{billing.plan.name}</span>
      {" · "}
      {billing.usage}/{billing.limit} gerações este mês
      {billing.remaining === 0 ? " · Upgrade →" : null}
    </Link>
  );
}
