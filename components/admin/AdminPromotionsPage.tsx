"use client";

import { useCallback, useEffect, useState } from "react";

interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed_cents";
  discountValue: number;
  planIds: string[] | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  stripePromotionCodeId: string | null;
}

type PromoForm = {
  id?: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed_cents";
  discountValue: number;
  maxRedemptions: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  stripePromotionCodeId: string;
};

const emptyForm = (): PromoForm => ({
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  maxRedemptions: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
  stripePromotionCodeId: "",
});

function formatDiscount(promo: Promotion): string {
  if (promo.discountType === "percent") return `${promo.discountValue}%`;
  return `R$ ${(promo.discountValue / 100).toFixed(2)}`;
}

export function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState<PromoForm>(emptyForm());
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      const data = (await res.json()) as { promotions?: Promotion[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro.");
      setPromotions(data.promotions ?? []);
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

  function startEdit(promo: Promotion) {
    setForm({
      id: promo.id,
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxRedemptions: promo.maxRedemptions?.toString() ?? "",
      validFrom: promo.validFrom ? promo.validFrom.slice(0, 16) : "",
      validUntil: promo.validUntil ? promo.validUntil.slice(0, 16) : "",
      isActive: promo.isActive,
      stripePromotionCodeId: promo.stripePromotionCodeId ?? "",
    });
    setEditing(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      ...form,
      maxRedemptions: form.maxRedemptions.trim()
        ? Number.parseInt(form.maxRedemptions, 10)
        : null,
      validFrom: form.validFrom.trim() ? new Date(form.validFrom).toISOString() : null,
      validUntil: form.validUntil.trim() ? new Date(form.validUntil).toISOString() : null,
      stripePromotionCodeId: form.stripePromotionCodeId.trim() || null,
    };

    const res = await fetch("/api/admin/promotions", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar promoção.");
      return;
    }

    setForm(emptyForm());
    setEditing(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta promoção?")) return;
    await fetch(`/api/admin/promotions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Promoções</h1>
      <p className="mt-1 text-sm text-muted">
        Cupons de desconto. Stripe Promotion Code é opcional (configure quando a conta
        estiver verificada).
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            {promotions.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma promoção cadastrada.</p>
            ) : null}
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold font-mono">{promo.code}</p>
                    <p className="text-sm text-muted">{promo.description || "—"}</p>
                    <p className="mt-1 text-sm">
                      {formatDiscount(promo)} · {promo.redemptionCount}
                      {promo.maxRedemptions !== null ? ` / ${promo.maxRedemptions}` : ""}{" "}
                      resgates
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {promo.isActive ? "Ativa" : "Inativa"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(promo)}
                      className="text-sm text-accent-purple"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(promo.id)}
                      className="text-sm text-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-3 rounded-2xl border border-black/10 bg-white p-5"
          >
            <h2 className="font-semibold">
              {editing ? "Editar promoção" : "Nova promoção"}
            </h2>

            <div>
              <label className="text-sm font-medium">Código</label>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-mono uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountType: e.target.value as "percent" | "fixed_cents",
                    })
                  }
                >
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed_cents">Valor fixo (centavos)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Valor</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Máx. resgates (vazio = ilimitado)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                value={form.maxRedemptions}
                onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Válida de</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Válida até</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Stripe Promotion Code ID</label>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm font-mono"
                value={form.stripePromotionCodeId}
                onChange={(e) =>
                  setForm({ ...form, stripePromotionCodeId: e.target.value })
                }
                placeholder="promo_... (opcional)"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Ativa
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
