"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivityEvent } from "@/lib/db/types";
import { AdminStatsBar } from "@/components/admin/AdminStatsBar";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { MigrateBlobPanel } from "@/components/admin/MigrateBlobPanel";
import type { DashboardStats } from "@/lib/db/types";

export function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity?limit=10"),
      ]);

      const statsData = (await statsRes.json()) as {
        stats?: DashboardStats;
        error?: string;
      };
      const activityData = (await activityRes.json()) as {
        events?: ActivityEvent[];
        error?: string;
      };

      if (!statsRes.ok) {
        throw new Error(statsData.error ?? "Erro ao carregar estatísticas.");
      }

      setStats(statsData.stats ?? null);
      setEvents(activityData.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Data fetch on mount / filter change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin client fetch
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Visão geral de usuários, gerações e atividade recente.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-12 text-center text-sm text-muted">
          Carregando dashboard...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
          {error}
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {stats.totalGenerations === 0 ? (
            <MigrateBlobPanel onComplete={() => void load()} />
          ) : null}
          <AdminStatsBar stats={stats} />
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Atividade recente
            </h2>
            <ActivityFeed events={events} compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
