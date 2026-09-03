"use client";

import { useCallback, useEffect, useState } from "react";

interface AccessRequest {
  id: string;
  deviceId: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  status: string;
  message: string;
  adminNote: string;
  createdAt: string;
  otherUsersOnDevice: number;
}

interface WhitelistEntry {
  userId: string;
  email: string | null;
  name: string | null;
  note: string;
  createdBy: string;
  createdAt: string;
}

export function AdminDeviceAccessPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [requestFilter, setRequestFilter] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistNote, setWhitelistNote] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    const res = await fetch(`/api/admin/device-requests?status=${requestFilter}`);
    const data = (await res.json()) as { requests?: AccessRequest[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Erro ao carregar solicitações.");
    setRequests(data.requests ?? []);
  }, [requestFilter]);

  const loadWhitelist = useCallback(async () => {
    const res = await fetch("/api/admin/device-whitelist");
    const data = (await res.json()) as { whitelist?: WhitelistEntry[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Erro ao carregar whitelist.");
    setWhitelist(data.whitelist ?? []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadRequests(), loadWhitelist()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [loadRequests, loadWhitelist]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin fetch
    void load();
  }, [load]);

  async function handleReview(id: string, action: "approve" | "reject") {
    setActionId(id);
    setError(null);

    try {
      const res = await fetch("/api/admin/device-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao revisar.");

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao revisar.");
    } finally {
      setActionId(null);
    }
  }

  async function handleAddWhitelist(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/admin/device-whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: whitelistEmail, note: whitelistNote }),
      });
      const data = (await res.json()) as { error?: string; whitelist?: WhitelistEntry[] };
      if (!res.ok) throw new Error(data.error ?? "Erro ao adicionar.");

      setWhitelistEmail("");
      setWhitelistNote("");
      if (data.whitelist) setWhitelist(data.whitelist);
      else await loadWhitelist();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar.");
    }
  }

  async function handleRemoveWhitelist(userId: string) {
    if (!confirm("Remover este usuário da whitelist?")) return;

    await fetch(`/api/admin/device-whitelist?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    await loadWhitelist();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Acesso por dispositivo</h1>
      <p className="mt-1 text-sm text-muted">
        Solicitações de quem tentou usar outra conta no mesmo aparelho. Aprovar adiciona à
        whitelist (ignora limite de dispositivo).
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Solicitações</h2>
              <select
                value={requestFilter}
                onChange={(e) =>
                  setRequestFilter(e.target.value as "pending" | "approved" | "rejected")
                }
                className="rounded-xl border border-black/10 px-3 py-1.5 text-sm"
              >
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovadas</option>
                <option value="rejected">Rejeitadas</option>
              </select>
            </div>

            {requests.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma solicitação neste filtro.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-black/10 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {req.userName ?? "Usuário"} · {req.userEmail ?? req.userId}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted">
                          Dispositivo: {req.deviceId.slice(0, 8)}… ·{" "}
                          {req.otherUsersOnDevice} outra(s) conta(s)
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(req.createdAt).toLocaleString("pt-BR")}
                        </p>
                        {req.message ? (
                          <p className="mt-2 text-sm text-foreground">{req.message}</p>
                        ) : null}
                      </div>
                      {req.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actionId === req.id}
                            onClick={() => void handleReview(req.id, "approve")}
                            className="rounded-xl bg-accent-purple px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={actionId === req.id}
                            onClick={() => void handleReview(req.id, "reject")}
                            className="rounded-xl border px-3 py-1.5 text-sm disabled:opacity-60"
                          >
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-lg bg-surface px-2 py-1 text-xs capitalize">
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Whitelist (confiança)</h2>

            <form
              onSubmit={(e) => void handleAddWhitelist(e)}
              className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-black/10 bg-white p-4"
            >
              <input
                type="email"
                required
                placeholder="E-mail do usuário"
                value={whitelistEmail}
                onChange={(e) => setWhitelistEmail(e.target.value)}
                className="min-w-[200px] flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Nota (opcional)"
                value={whitelistNote}
                onChange={(e) => setWhitelistNote(e.target.value)}
                className="min-w-[160px] flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-xl bg-accent-purple px-4 py-2 text-sm font-medium text-white"
              >
                Adicionar
              </button>
            </form>

            {whitelist.length === 0 ? (
              <p className="text-sm text-muted">Nenhum usuário na whitelist.</p>
            ) : (
              <div className="space-y-2">
                {whitelist.map((entry) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4"
                  >
                    <div>
                      <p className="font-medium">{entry.name ?? entry.email ?? entry.userId}</p>
                      <p className="text-sm text-muted">{entry.email}</p>
                      {entry.note ? (
                        <p className="mt-1 text-xs text-muted">{entry.note}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveWhitelist(entry.userId)}
                      className="text-sm text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
