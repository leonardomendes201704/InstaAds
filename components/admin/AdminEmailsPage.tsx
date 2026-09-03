"use client";

import { useCallback, useEffect, useState } from "react";

interface EmailLogEntry {
  id: string;
  userId: string | null;
  toEmail: string;
  template: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  sent: "text-green-700 bg-green-50",
  failed: "text-red-700 bg-red-50",
  skipped: "text-amber-700 bg-amber-50",
  pending: "text-muted bg-surface",
};

export function AdminEmailsPage() {
  const [emails, setEmails] = useState<EmailLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/emails?${params}`);
      const data = (await res.json()) as {
        emails?: EmailLogEntry[];
        total?: number;
        error?: string;
      };

      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar e-mails.");
      setEmails(data.emails ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin fetch
    void load();
  }, [load]);

  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">E-mails</h1>
      <p className="mt-1 text-sm text-muted">
        Histórico de envios via Resend. Se Resend não estiver configurado, os e-mails
        aparecem como &quot;skipped&quot;.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : emails.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nenhum e-mail registrado ainda.</p>
      ) : (
        <>
          <div className="mt-8 space-y-2">
            {emails.map((email) => (
              <div
                key={email.id}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{email.subject}</p>
                    <p className="text-sm text-muted">
                      {email.toEmail} · {email.template}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(email.createdAt).toLocaleString("pt-BR")}
                    </p>
                    {email.errorMessage ? (
                      <p className="mt-1 text-xs text-red-600">{email.errorMessage}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                      statusColors[email.status] ?? "text-muted bg-surface"
                    }`}
                  >
                    {email.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <p className="text-muted">
              {offset + 1}–{Math.min(offset + limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                className="rounded-xl border px-3 py-1.5 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => setOffset((o) => o + limit)}
                className="rounded-xl border px-3 py-1.5 disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
