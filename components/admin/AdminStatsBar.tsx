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

function formatDateLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
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

  const maxCount = Math.max(
    ...stats.generationsByDay.map((d) => d.count),
    1,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
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

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-foreground">
          Gerações nos últimos 7 dias
        </p>
        <div className="mt-4 flex items-end gap-2">
          {stats.generationsByDay.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-accent-purple/80 transition-all"
                  style={{
                    height: `${Math.max(8, (day.count / maxCount) * 100)}%`,
                  }}
                  title={`${day.count} gerações`}
                />
              </div>
              <span className="text-[10px] text-muted">
                {formatDateLabel(day.date)}
              </span>
              <span className="text-xs font-medium text-foreground">
                {day.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
