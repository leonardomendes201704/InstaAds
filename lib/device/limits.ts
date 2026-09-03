import { getSupabaseAdmin } from "@/lib/supabase/server";
import { currentPeriodStartDate } from "@/lib/device/constants";
import { getUserPlan } from "@/lib/db/plans";

export class DeviceLimitExceededError extends Error {
  readonly code = "DEVICE_LIMIT_EXCEEDED" as const;
  usage: number;
  limit: number;

  constructor(usage: number, limit: number) {
    super(
      `Este dispositivo já usou as ${limit} gerações gratuitas deste mês (${usage}/${limit}).`,
    );
    this.name = "DeviceLimitExceededError";
    this.usage = usage;
    this.limit = limit;
  }
}

export class DeviceMultiAccountError extends Error {
  readonly code = "DEVICE_MULTI_ACCOUNT" as const;
  otherUserCount: number;

  constructor(otherUserCount: number) {
    super(
      "Detectamos outra conta neste dispositivo. O plano gratuito permite uma conta por aparelho. Solicite acesso ou faça upgrade.",
    );
    this.name = "DeviceMultiAccountError";
    this.otherUserCount = otherUserCount;
  }
}

export class DeviceIdRequiredError extends Error {
  readonly code = "DEVICE_ID_REQUIRED" as const;

  constructor() {
    super("Identificação do dispositivo ausente. Recarregue a página e tente novamente.");
    this.name = "DeviceIdRequiredError";
  }
}

export async function isUserDeviceWhitelisted(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("device_whitelist")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function registerDeviceUser(
  deviceId: string,
  userId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { error } = await supabase.from("device_users").upsert(
    {
      device_id: deviceId,
      user_id: userId,
      last_seen_at: now,
    },
    { onConflict: "device_id,user_id" },
  );

  if (error) throw error;
}

export async function getDeviceMonthlyUsage(deviceId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const periodStart = currentPeriodStartDate();

  const { data, error } = await supabase
    .from("device_usage")
    .select("generation_count")
    .eq("device_id", deviceId)
    .eq("period_start", periodStart)
    .maybeSingle();

  if (error) throw error;
  return data?.generation_count ?? 0;
}

export async function getOtherUsersOnDevice(
  deviceId: string,
  userId: string,
): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("device_users")
    .select("user_id")
    .eq("device_id", deviceId)
    .neq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.user_id as string);
}

export async function incrementDeviceUsage(deviceId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const periodStart = currentPeriodStartDate();
  const now = new Date().toISOString();
  const current = await getDeviceMonthlyUsage(deviceId);

  const { error } = await supabase.from("device_usage").upsert(
    {
      device_id: deviceId,
      period_start: periodStart,
      generation_count: current + 1,
      updated_at: now,
    },
    { onConflict: "device_id,period_start" },
  );

  if (error) throw error;
}

export async function assertDeviceCanGenerate(
  userId: string,
  deviceId: string | null,
): Promise<void> {
  if (!deviceId) {
    throw new DeviceIdRequiredError();
  }

  if (await isUserDeviceWhitelisted(userId)) {
    return;
  }

  const plan = await getUserPlan(userId);
  if (!plan) return;

  if (plan.slug !== "free" || plan.priceCents > 0) {
    return;
  }

  const limit = plan.monthlyGenerationLimit;
  const otherUsers = await getOtherUsersOnDevice(deviceId, userId);

  if (otherUsers.length > 0) {
    throw new DeviceMultiAccountError(otherUsers.length);
  }

  const deviceUsage = await getDeviceMonthlyUsage(deviceId);
  if (deviceUsage >= limit) {
    throw new DeviceLimitExceededError(deviceUsage, limit);
  }
}

export async function shouldIncrementDeviceUsage(userId: string): Promise<boolean> {
  if (await isUserDeviceWhitelisted(userId)) {
    return false;
  }

  const plan = await getUserPlan(userId);
  if (!plan) return false;

  return plan.slug === "free" && plan.priceCents === 0;
}
