"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WizardShell } from "@/components/wizard/WizardShell";
import { UsageBadge } from "@/components/billing/UsageBadge";

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyGenerationLimit: number;
  priceCents: number;
  priceLabel: string;
  stripePriceId: string | null;
  isDefault: boolean;
}

interface BillingData {
  billing?: {
    plan: Plan;
    usage: number;
    limit: number;
    remaining: number;
  };
  plans?: Plan[];
  stripeConfigured?: boolean;
}

export function PlansPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/usage");
      const json = (await res.json()) as BillingData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar planos.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setMessage("Assinatura atualizada com sucesso!");
    }
    if (params.get("canceled") === "1") {
      setMessage("Checkout cancelado.");
    }
    void load();
  }, [load]);

  async function handleCheckout(planId: string) {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro no checkout.");
      if (json.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no checkout.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao abrir portal.");
      if (json.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir portal.");
    }
  }

  const currentPlanId = data?.billing?.plan.id;

  return (
    <WizardShell
      step={1}
      title="Planos InstaAds"
      subtitle="Escolha o plano ideal para o seu volume de anúncios."
      showBack={false}
      showBrand
      footer={
        <Link
          href="/"
          className="block w-full rounded-2xl border border-black/10 bg-white py-3 text-center text-sm font-medium text-foreground"
        >
          Voltar ao app
        </Link>
      }
    >
      <div className="mx-auto max-w-lg space-y-4 pb-8">
        <UsageBadge />

        {message ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </p>
        ) : null}

        {loading ? (
          <p className="text-center text-sm text-muted">Carregando planos...</p>
        ) : error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : (
          <>
            {data?.billing ? (
              <p className="text-center text-sm text-muted">
                Uso atual: {data.billing.usage}/{data.billing.limit} gerações (
                {data.billing.remaining} restantes)
              </p>
            ) : null}

            <div className="space-y-3">
              {data?.plans?.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isFree = plan.priceCents === 0;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-5 ${
                      isCurrent
                        ? "border-accent-purple bg-accent-purple/5"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">
                          {plan.name}
                          {isCurrent ? (
                            <span className="ml-2 text-xs font-normal text-accent-purple">
                              (atual)
                            </span>
                          ) : null}
                        </h2>
                        <p className="mt-1 text-sm text-muted">{plan.description}</p>
                        <p className="mt-2 text-sm text-foreground">
                          {plan.monthlyGenerationLimit} gerações/mês
                        </p>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {plan.priceLabel}
                      </p>
                    </div>

                    {!isCurrent && !isFree && data?.stripeConfigured ? (
                      <button
                        type="button"
                        disabled={checkoutLoading === plan.id}
                        onClick={() => void handleCheckout(plan.id)}
                        className="mt-4 w-full rounded-xl bg-accent-purple py-2.5 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {checkoutLoading === plan.id ? "Redirecionando..." : "Assinar"}
                      </button>
                    ) : null}

                    {!isCurrent && !isFree && !data?.stripeConfigured ? (
                      <p className="mt-3 text-xs text-muted">
                        Pagamentos em breve — Stripe em configuração.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {data?.stripeConfigured && !data?.billing?.plan.isDefault ? (
              <button
                type="button"
                onClick={() => void handlePortal()}
                className="w-full rounded-xl border border-black/10 py-2.5 text-sm font-medium text-foreground"
              >
                Gerenciar assinatura
              </button>
            ) : null}
          </>
        )}
      </div>
    </WizardShell>
  );
}
