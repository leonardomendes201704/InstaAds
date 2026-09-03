import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ActivityEvent, ActivityRow, ActivityType } from "@/lib/db/types";

function mapActivity(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    userEmail: row.profiles?.email,
    userName: row.profiles?.name,
  };
}

export async function logActivity(input: {
  userId?: string | null;
  type: ActivityType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("activity_events").insert({
    user_id: input.userId ?? null,
    type: input.type,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Falha ao registrar atividade:", error);
  }
}

export async function listActivityEvents(options?: {
  userId?: string;
  type?: ActivityType;
  offset?: number;
  limit?: number;
}): Promise<{ events: ActivityEvent[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 30;

  let query = supabase
    .from("activity_events")
    .select("*, profiles(email, name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    events: (data as ActivityRow[]).map(mapActivity),
    total: count ?? 0,
  };
}
