"use client";

import { useCallback, useEffect, useState } from "react";

type SettingKey =
  | "stripe_secret_key"
  | "stripe_publishable_key"
  | "stripe_webhook_secret"
  | "resend_api_key"
  | "email_from";

const labels: Record<SettingKey, string> = {
  stripe_secret_key: "Stripe Secret Key (sk_...)",
  stripe_publishable_key: "Stripe Publishable Key (pk_...)",
  stripe_webhook_secret: "Stripe Webhook Secret (whsec_...)",
  resend_api_key: "Resend API Key (re_...)",
  email_from: "E-mail remetente (ex: InstaAds <noreply@dominio.com>)",
};

export function AdminSettingsPage() {
  const [values, setValues] = useState<Record<SettingKey, string>>({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
    resend_api_key: "",
    email_from: "",
  });
  const [masked, setMasked] = useState<Record<SettingKey, string>>({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
    resend_api_key: "",
    email_from: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = (await res.json()) as {
        settings?: { masked: Record<SettingKey, string> };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar.");
      if (data.settings?.masked) setMasked(data.settings.masked);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin fetch
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const patch: Partial<Record<SettingKey, string>> = {};
      for (const key of Object.keys(values) as SettingKey[]) {
        if (values[key].trim()) patch[key] = values[key].trim();
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { error?: string; settings?: { masked: Record<SettingKey, string> } };
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar.");
      if (data.settings?.masked) setMasked(data.settings.masked);
      setValues({
        stripe_secret_key: "",
        stripe_publishable_key: "",
        stripe_webhook_secret: "",
        resend_api_key: "",
        email_from: "",
      });
      setMessage("Configurações salvas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Configurações</h1>
      <p className="mt-1 text-sm text-muted">
        Chaves Stripe e Resend. Deixe em branco para manter o valor atual. Env vars
        (.env) continuam como fallback.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : (
        <form onSubmit={(e) => void handleSave(e)} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-black/10 bg-white p-5">
            <h2 className="font-semibold text-foreground">Stripe</h2>
            <p className="mt-1 text-xs text-muted">
              Webhook: <code className="text-xs">/api/stripe/webhook</code>
            </p>
            {(Object.keys(labels) as SettingKey[])
              .filter((k) => k.startsWith("stripe_"))
              .map((key) => (
                <div key={key} className="mt-4">
                  <label className="mb-1 block text-sm font-medium">{labels[key]}</label>
                  {masked[key] ? (
                    <p className="mb-1 font-mono text-xs text-muted">Atual: {masked[key]}</p>
                  ) : (
                    <p className="mb-1 text-xs text-amber-700">Não configurado</p>
                  )}
                  <input
                    type="password"
                    value={values[key]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [key]: e.target.value }))
                    }
                    placeholder="Novo valor (opcional)"
                    className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                    autoComplete="off"
                  />
                </div>
              ))}
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5">
            <h2 className="font-semibold text-foreground">E-mail (Resend)</h2>
            {(["resend_api_key", "email_from"] as SettingKey[]).map((key) => (
              <div key={key} className="mt-4">
                <label className="mb-1 block text-sm font-medium">{labels[key]}</label>
                {masked[key] ? (
                  <p className="mb-1 font-mono text-xs text-muted">Atual: {masked[key]}</p>
                ) : (
                  <p className="mb-1 text-xs text-amber-700">Não configurado</p>
                )}
                <input
                  type={key === "email_from" ? "text" : "password"}
                  value={values[key]}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder="Novo valor (opcional)"
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                  autoComplete="off"
                />
              </div>
            ))}
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-accent-purple px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      )}
    </div>
  );
}
