"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ActivityEvent, Profile, StoredGeneration } from "@/lib/db/types";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { GenerationsList } from "@/components/admin/GenerationsList";

interface UserDetailProps {
  userId: string;
}

interface UserDetailResponse {
  profile?: Profile;
  generations?: StoredGeneration[];
  activity?: ActivityEvent[];
  error?: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function UserDetail({ userId }: UserDetailProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [generations, setGenerations] = useState<StoredGeneration[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
      );
      const data = (await response.json()) as UserDetailResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao carregar usuário.");
      }

      setProfile(data.profile ?? null);
      setGenerations(data.generations ?? []);
      setActivity(data.activity ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuário.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin client fetch
    void load();
  }, [load]);

  async function handleBlock() {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/block`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: blockReason }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Erro ao bloquear.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao bloquear.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnblock() {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/unblock`,
        { method: "POST" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Erro ao desbloquear.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desbloquear.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-muted">
        Carregando usuário...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/users"
        className="text-sm text-accent-purple hover:underline"
      >
        ← Voltar para usuários
      </Link>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {profile.image ? (
            <img
              src={profile.image}
              alt=""
              className="h-16 w-16 rounded-full border border-black/10"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {profile.name ?? "Usuário sem nome"}
            </h1>
            <p className="mt-1 text-sm text-muted">{profile.email ?? "—"}</p>
            <p className="mt-1 font-mono text-xs text-muted">{profile.id}</p>
            <p className="mt-2 text-sm text-muted">
              Cadastro: {formatDate(profile.createdAt)}
            </p>
            {profile.lastSeenAt ? (
              <p className="text-sm text-muted">
                Último acesso: {formatDate(profile.lastSeenAt)}
              </p>
            ) : null}
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                profile.status === "blocked"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {profile.status === "blocked" ? "Bloqueado" : "Ativo"}
            </span>
            {profile.status === "blocked" && profile.blockedReason ? (
              <p className="mt-2 text-sm text-red-700">
                Motivo: {profile.blockedReason}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:min-w-80">
          {profile.status === "active" ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Motivo do bloqueio
              </label>
              <textarea
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-black/10 bg-surface px-3 py-2 text-sm outline-none focus:border-accent-purple"
                placeholder="Opcional"
              />
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleBlock()}
                className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoading ? "Processando..." : "Bloquear usuário"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleUnblock()}
              className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {actionLoading ? "Processando..." : "Desbloquear usuário"}
            </button>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Gerações ({generations.length})
        </h2>
        <GenerationsList generations={generations} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Atividade</h2>
        <ActivityFeed events={activity} />
      </section>
    </div>
  );
}
