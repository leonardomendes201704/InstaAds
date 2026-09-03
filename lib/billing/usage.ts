import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getUserPlan, type Plan } from "@/lib/db/plans";

export class QuotaExceededError extends Error {
  usage: number;
  limit: number;
  plan: Plan;

  constructor(usage: number, limit: number, plan: Plan) {
    super(
      `Limite mensal atingido (${usage}/${limit}). Faça upgrade do plano para continuar gerando.`,
    );
    this.name = "QuotaExceededError";
    this.usage = usage;
    this.limit = limit;
    this.plan = plan;
  }
}

function currentPeriodStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const periodStart = currentPeriodStart();

  const { data, error } = await supabase
    .from("usage_counters")
    .select("generation_count")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (error) throw error;
  return data?.generation_count ?? 0;
}

export async function getUserBillingStatus(userId: string): Promise<{
  plan: Plan;
  usage: number;
  limit: number;
  remaining: number;
  periodStart: string;
}> {
  const plan = (await getUserPlan(userId))!;
  const usage = await getMonthlyUsage(userId);
  const limit = plan.monthlyGenerationLimit;

  return {
    plan,
    usage,
    limit,
    remaining: Math.max(0, limit - usage),
    periodStart: currentPeriodStart(),
  };
}

export async function assertCanGenerate(userId: string): Promise<void> {
  const status = await getUserBillingStatus(userId);
  if (status.usage >= status.limit) {
    throw new QuotaExceededError(status.usage, status.limit, status.plan);
  }
}

export async function incrementGenerationUsage(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const periodStart = currentPeriodStart();
  const now = new Date().toISOString();

  const current = await getMonthlyUsage(userId);

  const { error } = await supabase.from("usage_counters").upsert(
    {
      user_id: userId,
      period_start: periodStart,
      generation_count: current + 1,
      updated_at: now,
    },
    { onConflict: "user_id,period_start" },
  );

  if (error) throw error;
}
