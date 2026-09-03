import type { ActivityEvent, ActivityType } from "@/lib/db/types";

const typeLabels: Record<ActivityType, string> = {
  "user.sign_in": "Login",
  "generation.completed": "Geração concluída",
  "generation.failed": "Geração falhou",
  "admin.user_blocked": "Usuário bloqueado",
  "admin.user_unblocked": "Usuário desbloqueado",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function eventDescription(event: ActivityEvent): string {
  const meta = event.metadata;

  switch (event.type) {
    case "generation.completed":
      return `Geração ${String(meta.generationId ?? "").slice(0, 8)}… · ${String(meta.adCategory ?? "")}`;
    case "generation.failed":
      return `Falha: ${String(meta.error ?? "erro desconhecido")}`;
    case "admin.user_blocked":
      return `Motivo: ${String(meta.reason ?? "—")}`;
    case "admin.user_unblocked":
      return "Conta reativada";
    case "user.sign_in":
      return event.userEmail ?? "Login via Google";
    default:
      return "";
  }
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  compact?: boolean;
}

export function ActivityFeed({ events, compact = false }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-12 text-center">
        <p className="text-sm text-muted">Nenhuma atividade registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
      <ul className="divide-y divide-black/10">
        {events.map((event) => (
          <li
            key={event.id}
            className={`px-4 ${compact ? "py-3" : "py-4"} hover:bg-surface/50`}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {typeLabels[event.type] ?? event.type}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {event.userName ?? event.userEmail ?? event.userId ?? "Sistema"}
                </p>
                {!compact ? (
                  <p className="mt-1 text-sm text-muted">
                    {eventDescription(event)}
                  </p>
                ) : null}
              </div>
              <time className="shrink-0 text-xs text-muted">
                {formatDate(event.createdAt)}
              </time>
            </div>
            {compact ? (
              <p className="mt-1 text-xs text-muted">{eventDescription(event)}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
