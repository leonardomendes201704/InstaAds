"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/lib/db/types";

interface UsersResponse {
  profiles: Profile[];
  total: number;
  error?: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function truncateId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function UsersTable() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "blocked">("all");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
        status,
      });
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(`/api/admin/users?${params}`);
      const data = (await response.json()) as UsersResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao carregar usuários.");
      }

      setProfiles(data.profiles);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, [offset, search, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin client fetch
    void load();
  }, [load]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setOffset(0);
    void load();
  }

  const hasMore = offset + profiles.length < total;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Usuários</h1>
        <p className="mt-1 text-sm text-muted">
          {total} usuário{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
        </p>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por e-mail, nome ou ID..."
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-purple"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setOffset(0);
          }}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-accent-purple"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="blocked">Bloqueados</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-accent-purple px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-12 text-center text-sm text-muted">
          Carregando usuários...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
          {error}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-12 text-center">
          <p className="text-sm text-muted">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="hidden grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.6fr] gap-3 border-b border-black/10 bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
            <span>Usuário</span>
            <span>E-mail</span>
            <span>Cadastro</span>
            <span>Último acesso</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-black/10">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <Link
                  href={`/admin/users/${encodeURIComponent(profile.id)}`}
                  className="block px-4 py-4 transition-colors hover:bg-surface/50"
                >
                  <div className="grid gap-2 md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.6fr] md:items-center md:gap-3">
                    <div className="flex items-center gap-3">
                      {profile.image ? (
                        <img
                          src={profile.image}
                          alt=""
                          className="h-8 w-8 rounded-full border border-black/10"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs text-muted">
                          ?
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {profile.name ?? "Sem nome"}
                        </p>
                        <p className="font-mono text-xs text-muted">
                          {truncateId(profile.id)}
                        </p>
                      </div>
                    </div>
                    <p className="truncate text-sm text-muted">
                      {profile.email ?? "—"}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDate(profile.createdAt)}
                    </p>
                    <p className="text-sm text-muted">
                      {profile.lastSeenAt
                        ? formatDate(profile.lastSeenAt)
                        : "—"}
                    </p>
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                        profile.status === "blocked"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {profile.status === "blocked" ? "Bloqueado" : "Ativo"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
