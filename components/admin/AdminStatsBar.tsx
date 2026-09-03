import type { DashboardStats } from "@/lib/db/types";

interface AdminStatsBarProps {
  stats: DashboardStats;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(value);
}

export function AdminStatsBar({ stats }: AdminStatsBarProps) {
  const cards = [
    { label: "Usuários", value: String(stats.totalUsers) },
    { label: "Gerações", value: String(stats.totalGenerations) },
    { label: "Custo IA total", value: formatUsd(stats.totalCostUsd) },
    { label: "Gerações hoje", value: String(stats.generationsToday) },
    { label: "Novos usuários hoje", value: String(stats.usersToday) },
    { label: "Usuários bloqueados", value: String(stats.blockedUsers) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
