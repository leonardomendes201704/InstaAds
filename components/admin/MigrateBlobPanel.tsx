"use client";

import { useState } from "react";

interface BlobMigrationReport {
  migrated: number;
  skipped: number;
  errors: number;
  legacySession: number;
  totalInBlob: number;
  errorDetails: string[];
}

interface MigrateBlobPanelProps {
  onComplete: () => void;
}

export function MigrateBlobPanel({ onComplete }: MigrateBlobPanelProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<BlobMigrationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMigrate() {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/admin/migrate-blob", { method: "POST" });
      const data = (await response.json()) as {
        ok?: boolean;
        report?: BlobMigrationReport;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Erro ao migrar dados.");
      }

      setReport(data.report ?? null);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao migrar dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-base font-semibold text-foreground">
        Migrar dados do Vercel Blob
      </h2>
      <p className="mt-2 text-sm text-muted">
        Gerações antigas ficaram no Vercel Blob e não entram no Supabase
        automaticamente. Use este botão uma vez para copiar tudo para o banco
        novo.
      </p>

      <button
        type="button"
        onClick={() => void handleMigrate()}
        disabled={loading}
        className="mt-4 rounded-xl bg-accent-purple px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Migrando..." : "Migrar agora"}
      </button>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm">
          <p className="font-medium text-foreground">Migração concluída</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>No Blob: {report.totalInBlob} registro(s)</li>
            <li>Migrados: {report.migrated}</li>
            <li>Já existiam: {report.skipped}</li>
            <li>Erros: {report.errors}</li>
          </ul>
          {report.errorDetails.length > 0 ? (
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600">
              {report.errorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
