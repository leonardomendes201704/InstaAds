"use client";

import { useEffect, useState } from "react";
import { GradientButton } from "@/components/ui/GradientButton";
import type { PaywallResponse, SubscribeResponse } from "@/lib/billing/paywall-types";
import { useWizardStore } from "@/stores/wizard-store";

interface PaywallSheetProps {
  open: boolean;
  onDismiss: () => void;
  onUpgraded: () => void;
}

export function PaywallSheet({ open, onDismiss, onUpgraded }: PaywallSheetProps) {
  const persistDraftForCheckout = useWizardStore((state) => state.persistDraftForCheckout);
  const [data, setData] = useState<PaywallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/billing/paywall");
        const json = (await res.json()) as PaywallResponse & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Erro ao carregar planos.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar planos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const primary = data?.targets[0] ?? null;
  const extras = data?.targets.slice(1) ?? [];
  const usageRatio =
    data && data.billing.limit > 0 ? data.billing.usage / data.billing.limit : 1;

  async function handlePlan(planId: string) {
    setActionId(planId);
    setError(null);
    try {
      await persistDraftForCheckout();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, returnTo: "wizard" }),
      });
      const json = (await res.json()) as SubscribeResponse;
      if (!res.ok) throw new Error(json.error ?? "Erro ao atualizar o plano.");
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      if (json.upgraded) {
        onUpgraded();
        return;
      }
      throw new Error("Não foi possível concluir o upgrade.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar o plano.");
      setActionId(null);
    }
  }

  async function handlePortal() {
    setActionId("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao abrir o portal.");
      if (json.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir o portal.");
      setActionId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        className="relative z-[61] max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-lg sm:rounded-3xl"
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-muted">Carregando seu plano...</p>
        ) : error && !data ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="text-sm font-medium text-accent-purple"
            >
              Fechar
            </button>
          </div>
        ) : !data ? (
          <p className="py-8 text-center text-sm text-muted">Não foi possível carregar os planos.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Limite do plano {data.billing.plan.name}
              </p>
              <h2 id="paywall-title" className="mt-1 text-xl font-semibold text-foreground">
                Você usou {data.billing.usage} de {data.billing.limit} gerações
              </h2>
              <p className="mt-1 text-sm text-muted">
                Seu anúncio continua neste passo. Depois do pagamento, geramos ele na hora.
              </p>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>Uso deste mês</span>
                <span>
                  {data.billing.usage}/{data.billing.limit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${Math.min(100, usageRatio * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1 rounded-2xl bg-surface px-4 py-3 text-sm text-muted">
              <p>
                Gerações voltam em{" "}
                <span className="font-medium text-foreground">{data.quotaResetsAtLabel}</span>
                {" "}
                (dia 1 do mês).
              </p>
              {data.billingRenewsAtLabel ? (
                <p>
                  Próxima cobrança Stripe em{" "}
                  <span className="font-medium text-foreground">{data.billingRenewsAtLabel}</span>
                  .
                </p>
              ) : (
                <p>Ainda não há cobrança — o plano atual é gratuito.</p>
              )}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {data.needsPaymentUpdate ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Há um pagamento pendente. Atualize o cartão para continuar.
              </p>
            ) : null}

            {!data.stripeConfigured ? (
              <p className="text-sm text-muted">Pagamentos em breve — Stripe em configuração.</p>
            ) : null}

            {primary && data.stripeConfigured && !data.needsPaymentUpdate ? (
              <div className="rounded-2xl border border-accent-purple bg-accent-purple/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{primary.name}</p>
                    <p className="text-sm text-muted">
                      {primary.monthlyGenerationLimit} gerações/mês
                    </p>
                  </div>
                  <p className="text-base font-bold text-foreground">{primary.priceLabel}</p>
                </div>
                <p className="mt-2 text-sm text-foreground">
                  Libera {primary.remainingAfterUpgrade} gerações agora (as{" "}
                  {data.billing.usage} já usadas continuam no contador).
                </p>
                {primary.proration ? (
                  <p className="mt-2 text-xs text-muted">
                    Cobrança proporcional agora: {primary.proration.amountDueNowLabel}. No
                    próximo ciclo, {primary.proration.nextInvoiceLabel}.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Assinatura mensal. O limite sobe assim que o pagamento confirmar.
                  </p>
                )}
                <GradientButton
                  className="mt-3"
                  loading={actionId === primary.id}
                  disabled={Boolean(actionId)}
                  onClick={() => void handlePlan(primary.id)}
                >
                  {primary.ctaLabel}
                </GradientButton>
              </div>
            ) : null}

            {extras.map((plan) => (
              <button
                key={plan.id}
                type="button"
                disabled={Boolean(actionId) || !data.stripeConfigured}
                onClick={() => void handlePlan(plan.id)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-left text-sm disabled:opacity-60"
              >
                <span className="font-medium text-foreground">{plan.name}</span>
                <span className="text-muted">
                  {" "}
                  · {plan.monthlyGenerationLimit} gerações · {plan.priceLabel}
                </span>
              </button>
            ))}

            {data.needsPaymentUpdate && data.stripeConfigured ? (
              <GradientButton
                loading={actionId === "portal"}
                disabled={Boolean(actionId)}
                onClick={() => void handlePortal()}
              >
                Atualizar pagamento
              </GradientButton>
            ) : null}

            {!primary && !data.needsPaymentUpdate ? (
              <p className="text-sm text-muted">
                Você já está no plano mais alto. Dá para esperar o dia 1 ou gerenciar a
                assinatura.
              </p>
            ) : null}

            {data.stripeConfigured && !data.billing.plan.isDefault ? (
              <button
                type="button"
                disabled={Boolean(actionId)}
                onClick={() => void handlePortal()}
                className="w-full text-center text-sm font-medium text-foreground"
              >
                Gerenciar assinatura
              </button>
            ) : null}

            <button
              type="button"
              disabled={Boolean(actionId)}
              onClick={onDismiss}
              className="w-full pb-1 text-center text-sm text-muted"
            >
              Esperar até {data.quotaResetsAtLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
