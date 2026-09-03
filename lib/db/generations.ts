import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { AiCostEstimate } from "@/lib/ai-cost";
import type {
  AdminStats,
  DashboardStats,
  GenerationRow,
  StoredGeneration,
} from "@/lib/db/types";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";

export function rowToStoredGeneration(row: GenerationRow): StoredGeneration {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email ?? undefined,
    userName: row.user_name ?? undefined,
    createdAt: row.created_at,
    status: row.status,
    adCategory: row.ad_category,
    adStyle: row.ad_style,
    mainMessage: row.main_message,
    publishTarget: row.publish_target,
    headline: row.headline,
    subheadline: row.subheadline,
    benefits: row.benefits,
    cta: row.cta,
    originalPhotoUrl: row.original_path,
    generatedArtUrl: row.feed_path ?? undefined,
    generatedStoriesUrl: row.stories_path ?? undefined,
    errorMessage: row.error_message ?? undefined,
    aiCost: row.ai_cost ?? undefined,
  };
}

export function getGenerationOwnerLabel(generation: StoredGeneration): string {
  return generation.userEmail ?? generation.userName ?? generation.userId;
}

export async function insertGeneration(input: {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  status: "success" | "error";
  adCategory: AdCategory;
  adStyle: AdStyle;
  mainMessage: string;
  publishTarget: PublishTarget;
  headline: string;
  subheadline: string;
  benefits: [string, string, string];
  cta: string;
  originalPath: string;
  feedPath?: string;
  storiesPath?: string;
  errorMessage?: string;
  aiCost?: AiCostEstimate;
}): Promise<StoredGeneration> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("generations")
    .insert({
      id: input.id,
      user_id: input.userId,
      user_email: input.userEmail ?? null,
      user_name: input.userName ?? null,
      status: input.status,
      ad_category: input.adCategory,
      ad_style: input.adStyle,
      main_message: input.mainMessage,
      publish_target: input.publishTarget,
      headline: input.headline,
      subheadline: input.subheadline,
      benefits: input.benefits,
      cta: input.cta,
      original_path: input.originalPath,
      feed_path: input.feedPath ?? null,
      stories_path: input.storiesPath ?? null,
      error_message: input.errorMessage ?? null,
      ai_cost: input.aiCost ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return rowToStoredGeneration(data as GenerationRow);
}

export async function getGenerationById(
  id: string,
): Promise<StoredGeneration | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToStoredGeneration(data as GenerationRow) : null;
}

export async function listGenerationsByUser(
  userId: string,
  limit = 50,
): Promise<StoredGeneration[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as GenerationRow[]).map(rowToStoredGeneration);
}

export async function listAllGenerations(options?: {
  offset?: number;
  limit?: number;
}): Promise<{
  generations: StoredGeneration[];
  offset: number;
  hasMore: boolean;
  total: number;
}> {
  const supabase = getSupabaseAdmin();
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 20;

  const { data, error, count } = await supabase
    .from("generations")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const total = count ?? 0;
  const generations = (data as GenerationRow[]).map(rowToStoredGeneration);

  return {
    generations,
    offset,
    hasMore: offset + generations.length < total,
    total,
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = getSupabaseAdmin();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [generationsResult, usersResult, todayResult, costRows] =
    await Promise.all([
      supabase
        .from("generations")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("generations")
        .select("user_id"),
      supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayIso),
      supabase.from("generations").select("ai_cost"),
    ]);

  if (generationsResult.error) throw generationsResult.error;
  if (usersResult.error) throw usersResult.error;
  if (todayResult.error) throw todayResult.error;
  if (costRows.error) throw costRows.error;

  const uniqueUsers = new Set(
    (usersResult.data ?? []).map((row) => row.user_id),
  ).size;

  const totalCostUsd = (costRows.data ?? []).reduce((sum, row) => {
    const cost = row.ai_cost as { totalUsd?: number } | null;
    return sum + (cost?.totalUsd ?? 0);
  }, 0);

  return {
    totalGenerations: generationsResult.count ?? 0,
    uniqueUsers,
    totalCostUsd,
    generationsToday: todayResult.count ?? 0,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  const baseStats = await getAdminStats();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekIso = weekStart.toISOString();

  const [
    totalUsersResult,
    usersTodayResult,
    usersWeekResult,
    blockedResult,
    recentGenerations,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayIso),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekIso),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "blocked"),
    supabase
      .from("generations")
      .select("created_at")
      .gte("created_at", weekIso)
      .order("created_at", { ascending: true }),
  ]);

  if (totalUsersResult.error) throw totalUsersResult.error;
  if (usersTodayResult.error) throw usersTodayResult.error;
  if (usersWeekResult.error) throw usersWeekResult.error;
  if (blockedResult.error) throw blockedResult.error;
  if (recentGenerations.error) throw recentGenerations.error;

  const dayCounts = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayCounts.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of recentGenerations.data ?? []) {
    const date = row.created_at.slice(0, 10);
    if (dayCounts.has(date)) {
      dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
    }
  }

  return {
    ...baseStats,
    totalUsers: totalUsersResult.count ?? 0,
    usersToday: usersTodayResult.count ?? 0,
    usersThisWeek: usersWeekResult.count ?? 0,
    blockedUsers: blockedResult.count ?? 0,
    generationsByDay: Array.from(dayCounts.entries()).map(([date, count]) => ({
      date,
      count,
    })),
  };
}

export function computeAdminStats(generations: StoredGeneration[]): AdminStats {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const users = new Set(generations.map((g) => g.userId));

  return {
    totalGenerations: generations.length,
    uniqueUsers: users.size,
    totalCostUsd: generations.reduce(
      (sum, g) => sum + (g.aiCost?.totalUsd ?? 0),
      0,
    ),
    generationsToday: generations.filter(
      (g) => new Date(g.createdAt) >= todayStart,
    ).length,
  };
}
