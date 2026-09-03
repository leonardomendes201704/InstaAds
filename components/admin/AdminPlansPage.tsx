"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPlanPrice } from "@/lib/billing/format";

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyGenerationLimit: number;
  priceCents: number;
  currency: string;
  stripePriceId: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

type PlanForm = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  monthlyGenerationLimit: number;
  priceCents: number;
  stripePriceId: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
};

const emptyForm = (): PlanForm => ({
  slug: "",
  name: "",
  description: "",
  monthlyGenerationLimit: 10,
  priceCents: 0,
  stripePriceId: "",
  isActive: true,
  isDefault: false,
  sortOrder: 0,
});

export function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      const data = (await res.json()) as { plans?: Plan[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro.");
      setPlans(data.plans ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin fetch
    void load();
  }, [load]);

  function startEdit(plan: Plan) {
    setForm({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      monthlyGenerationLimit: plan.monthlyGenerationLimit,
      priceCents: plan.priceCents,
      stripePriceId: plan.stripePriceId ?? "",
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      sortOrder: plan.sortOrder,
    });
    setEditing(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      ...form,
      stripePriceId: form.stripePriceId.trim() || null,
      priceCents: Math.round(form.priceCents),
    };

    const res = await fetch("/api/admin/plans", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? payload : payload),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar plano.");
      return;
    }

    setForm(emptyForm());
    setEditing(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este plano?")) return;
    await fetch(`/api/admin/plans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Planos</h1>
      <p className="mt-1 text-sm text-muted">
        Edite limites, preços e Stripe Price ID. Preço em centavos (4900 = R$ 49,00).
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {plan.name}{" "}
                      {plan.isDefault ? (
                        <span className="text-xs text-accent-purple">(padrão)</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted">{plan.slug}</p>
                    <p className="mt-1 text-sm">
                      {plan.monthlyGenerationLimit}/mês · {formatPlanPrice(plan)}
                    </p>
                    {plan.stripePriceId ? (
                      <p className="mt-1 font-mono text-xs text-muted">
                        {plan.stripePriceId}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className="text-sm text-accent-purple"
                    >
                      Editar
                    </button>
                    {!plan.isDefault ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(plan.id)}
                        className="text-sm text-red-600"
                      >
                        Excluir
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="rounded-2xl border border-black/10 bg-white p-5 space-y-3"
          >
            <h2 className="font-semibold">{editing ? "Editar plano" : "Novo plano"}</h2>
            {(
              [
                ["slug", "Slug"],
                ["name", "Nome"],
                ["description", "Descrição"],
                ["stripePriceId", "Stripe Price ID"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-sm font-medium">{label}</label>
                <input
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={key === "slug" || key === "name"}
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Limite/mês</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  value={form.monthlyGenerationLimit}
                  onChange={(e) =>
                    setForm({ ...form, monthlyGenerationLimit: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Preço (centavos)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  value={form.priceCents}
                  onChange={(e) =>
                    setForm({ ...form, priceCents: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Plano padrão (Free)
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-accent-purple px-4 py-2 text-sm font-medium text-white"
              >
                {editing ? "Salvar" : "Criar"}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm(emptyForm());
                  }}
                  className="rounded-xl border px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
