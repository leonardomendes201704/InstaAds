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

export async function backfillActivityFromGenerations(): Promise<{
  inserted: number;
  skipped: number;
}> {
  const supabase = getSupabaseAdmin();

  const { data: generations, error: genError } = await supabase
    .from("generations")
    .select("id, user_id, ad_category, ad_style, ai_cost, created_at")
    .order("created_at", { ascending: true });

  if (genError) throw genError;

  const { data: existingEvents, error: eventsError } = await supabase
    .from("activity_events")
    .select("metadata")
    .eq("type", "generation.completed");

  if (eventsError) throw eventsError;

  const existingIds = new Set(
    (existingEvents ?? [])
      .map((row) => {
        const meta = row.metadata as { generationId?: string } | null;
        return meta?.generationId;
      })
      .filter(Boolean),
  );

  let inserted = 0;
  let skipped = 0;

  for (const gen of generations ?? []) {
    if (existingIds.has(gen.id)) {
      skipped += 1;
      continue;
    }

    const aiCost = gen.ai_cost as { totalUsd?: number } | null;

    const { error } = await supabase.from("activity_events").insert({
      user_id: gen.user_id,
      type: "generation.completed",
      metadata: {
        generationId: gen.id,
        adCategory: gen.ad_category,
        adStyle: gen.ad_style,
        aiCostUsd: aiCost?.totalUsd,
        backfilled: true,
      },
      created_at: gen.created_at,
    });

    if (error) {
      console.error(`Backfill falhou para ${gen.id}:`, error);
      skipped += 1;
      continue;
    }

    inserted += 1;
    existingIds.add(gen.id);
  }

  return { inserted, skipped };
}

export async function backfillSignInFromProfiles(): Promise<number> {
  const supabase = getSupabaseAdmin();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, created_at, last_seen_at");

  if (profilesError) throw profilesError;

  const { data: existingEvents, error: eventsError } = await supabase
    .from("activity_events")
    .select("user_id")
    .eq("type", "user.sign_in");

  if (eventsError) throw eventsError;

  const usersWithSignIn = new Set(
    (existingEvents ?? []).map((row) => row.user_id).filter(Boolean),
  );

  let inserted = 0;

  for (const profile of profiles ?? []) {
    if (usersWithSignIn.has(profile.id)) continue;

    const { error } = await supabase.from("activity_events").insert({
      user_id: profile.id,
      type: "user.sign_in",
      metadata: { email: profile.email, backfilled: true },
      created_at: profile.last_seen_at ?? profile.created_at,
    });

    if (!error) inserted += 1;
  }

  return inserted;
}
