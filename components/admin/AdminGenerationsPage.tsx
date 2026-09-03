"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoredGeneration } from "@/lib/db/types";
import { GenerationsList } from "@/components/admin/GenerationsList";

interface GenerationsResponse {
  generations: StoredGeneration[];
  offset: number;
  hasMore: boolean;
  total: number;
  error?: string;
}

export function AdminGenerationsPage() {
  const [generations, setGenerations] = useState<StoredGeneration[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const loadGenerations = useCallback(
    async (nextOffset = 0, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      setError(null);

      try {
        const response = await fetch(
          `/api/admin/generations?offset=${nextOffset}&limit=${limit}`,
        );
        const data = (await response.json()) as GenerationsResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Erro ao carregar gerações.");
        }

        setGenerations((current) =>
          append ? [...current, ...data.generations] : data.generations,
        );
        setOffset(data.offset);
        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar gerações.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- admin client fetch
    void loadGenerations(0, false);
  }, [loadGenerations]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Gerações</h1>
        <p className="mt-1 text-sm text-muted">
          {total} geraç{total !== 1 ? "ões" : "ão"} no total
        </p>
      </div>

      <div className="mt-4">
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
            onClick={() => void loadGenerations(offset + limit, true)}
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
