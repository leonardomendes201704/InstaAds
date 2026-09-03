"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivityEvent, ActivityType } from "@/lib/db/types";
import { ActivityFeed } from "@/components/admin/ActivityFeed";

interface ActivityResponse {
  events: ActivityEvent[];
  total: number;
  error?: string;
}

const typeOptions: { value: "" | ActivityType; label: string }[] = [
  { value: "", label: "Todos os tipos" },
  { value: "user.sign_in", label: "Login" },
  { value: "generation.completed", label: "Geração concluída" },
  { value: "generation.failed", label: "Geração falhou" },
  { value: "admin.user_blocked", label: "Bloqueio" },
  { value: "admin.user_unblocked", label: "Desbloqueio" },
];

export function AdminActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState<"" | ActivityType>("");
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
      if (type) params.set("type", type);

      const response = await fetch(`/api/admin/activity?${params}`);
      const data = (await response.json()) as ActivityResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao carregar atividades.");
      }

      setEvents(data.events);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar atividades.",
      );
    } finally {
      setLoading(false);
    }
  }, [offset, type]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin client fetch
    void load();
  }, [load]);

  const hasMore = offset + events.length < total;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Atividades</h1>
          <p className="mt-1 text-sm text-muted">
            {total} evento{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value as "" | ActivityType);
            setOffset(0);
          }}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-purple"
        >
          {typeOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-12 text-center text-sm text-muted">
          Carregando atividades...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
          {error}
        </div>
      ) : (
        <ActivityFeed events={events} />
      )}

      {(offset > 0 || hasMore) && !loading && !error ? (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!hasMore}
            onClick={() => setOffset(offset + limit)}
            className="rounded-xl bg-accent-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      ) : null}
    </div>
  );
}
