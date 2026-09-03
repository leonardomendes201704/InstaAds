import type { AdminStats } from "@/lib/storage";

interface AdminStatsBarProps {
  stats: AdminStats;
  hasMore: boolean;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(value);
}

export function AdminStatsBar({ stats, hasMore }: AdminStatsBarProps) {
  const cards = [
    { label: "Gerações (lote)", value: String(stats.totalGenerations) },
    { label: "Sessões (lote)", value: String(stats.uniqueSessions) },
    { label: "Custo IA (lote)", value: formatUsd(stats.totalCostUsd) },
    { label: "Hoje (lote)", value: String(stats.generationsToday) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>
      {hasMore ? (
        <p className="mt-3 text-xs text-muted">
          Métricas referentes ao lote carregado. Use &quot;Carregar mais&quot; para
          incluir gerações adicionais.
        </p>
      ) : null}
    </div>
  );
}
