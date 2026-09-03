"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminStats, StoredGeneration } from "@/lib/storage";
import { AdminStatsBar } from "@/components/admin/AdminStatsBar";
import { GenerationsList } from "@/components/admin/GenerationsList";

interface GenerationsResponse {
  generations: StoredGeneration[];
  stats: AdminStats | null;
  cursor?: string;
  hasMore: boolean;
  error?: string;
}

function mergeGenerations(
  current: StoredGeneration[],
  incoming: StoredGeneration[],
): StoredGeneration[] {
  const map = new Map<string, StoredGeneration>();
  for (const item of [...current, ...incoming]) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function computeMergedStats(generations: StoredGeneration[]): AdminStats {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return {
    totalGenerations: generations.length,
    uniqueSessions: new Set(generations.map((g) => g.sessionId)).size,
    totalCostUsd: generations.reduce(
      (sum, g) => sum + (g.aiCost?.totalUsd ?? 0),
      0,
    ),
    generationsToday: generations.filter(
      (g) => new Date(g.createdAt) >= todayStart,
    ).length,
  };
}

export function AdminDashboard() {
  const [generations, setGenerations] = useState<StoredGeneration[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGenerations = useCallback(async (nextCursor?: string) => {
    const isInitial = !nextCursor;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    setError(null);

    try {
      const url = nextCursor
        ? `/api/admin/generations?cursor=${encodeURIComponent(nextCursor)}`
        : "/api/admin/generations";

      const response = await fetch(url);
      const data = (await response.json()) as GenerationsResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao carregar gerações.");
      }

      setGenerations((current) =>
        isInitial ? data.generations : mergeGenerations(current, data.generations),
      );
      setCursor(data.cursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar gerações.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadGenerations();
  }, [loadGenerations]);

  const stats = useMemo(() => computeMergedStats(generations), [generations]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">InstaAds Admin</h1>
          <p className="mt-1 text-sm text-muted">
            Acompanhe gerações, sessões e custo estimado de IA.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="self-start rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          Sair
        </button>
      </div>

      <AdminStatsBar stats={stats} hasMore={hasMore} />

      <div className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-12 text-center text-sm text-muted">
            Carregando gerações...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
            {error}
          </div>
        ) : (
          <GenerationsList generations={generations} />
        )}
      </div>

      {hasMore && !loading && !error ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void loadGenerations(cursor)}
            disabled={loadingMore}
            className="rounded-xl bg-accent-purple px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loadingMore ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
