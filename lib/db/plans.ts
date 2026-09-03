import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyGenerationLimit: number;
  priceCents: number;
  currency: string;
  stripePriceId: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthly_generation_limit: number;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function mapPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    monthlyGenerationLimit: row.monthly_generation_limit,
    priceCents: row.price_cents,
    currency: row.currency,
    stripePriceId: row.stripe_price_id,
    isActive: row.is_active,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPlans(options?: {
  activeOnly?: boolean;
}): Promise<Plan[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("plans").select("*").order("sort_order", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as PlanRow[]).map(mapPlan);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapPlan(data as PlanRow) : null;
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("plans").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapPlan(data as PlanRow) : null;
}

export async function getDefaultPlan(): Promise<Plan | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_default", true)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapPlan(data as PlanRow);

  const { data: freePlan } = await supabase
    .from("plans")
    .select("*")
    .eq("slug", "free")
    .maybeSingle();

  return freePlan ? mapPlan(freePlan as PlanRow) : null;
}

export async function createPlan(input: {
  slug: string;
  name: string;
  description?: string;
  monthlyGenerationLimit: number;
  priceCents: number;
  currency?: string;
  stripePriceId?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}): Promise<Plan> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (input.isDefault) {
    await supabase.from("plans").update({ is_default: false, updated_at: now }).eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("plans")
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description ?? "",
      monthly_generation_limit: input.monthlyGenerationLimit,
      price_cents: input.priceCents,
      currency: input.currency ?? "brl",
      stripe_price_id: input.stripePriceId ?? null,
      is_active: input.isActive ?? true,
      is_default: input.isDefault ?? false,
      sort_order: input.sortOrder ?? 0,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapPlan(data as PlanRow);
}

export async function updatePlan(
  id: string,
  input: Partial<{
    slug: string;
    name: string;
    description: string;
    monthlyGenerationLimit: number;
    priceCents: number;
    currency: string;
    stripePriceId: string | null;
    isActive: boolean;
    isDefault: boolean;
    sortOrder: number;
  }>,
): Promise<Plan> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (input.isDefault) {
    await supabase.from("plans").update({ is_default: false, updated_at: now }).eq("is_default", true);
  }

  const patch: Record<string, unknown> = { updated_at: now };
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.monthlyGenerationLimit !== undefined) {
    patch.monthly_generation_limit = input.monthlyGenerationLimit;
  }
  if (input.priceCents !== undefined) patch.price_cents = input.priceCents;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.stripePriceId !== undefined) patch.stripe_price_id = input.stripePriceId;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.isDefault !== undefined) patch.is_default = input.isDefault;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase.from("plans").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return mapPlan(data as PlanRow);
}

export async function deletePlan(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const plan = await getPlanById(id);
  if (plan?.isDefault) {
    throw new Error("Não é possível excluir o plano padrão.");
  }

  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
}

export async function ensureUserDefaultPlan(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.plan_id) return;

  const defaultPlan = await getDefaultPlan();
  if (!defaultPlan) return;

  await supabase
    .from("profiles")
    .update({ plan_id: defaultPlan.id, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function getUserPlan(userId: string): Promise<Plan | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("plan_id, plans(*)")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  const plans = data?.plans as PlanRow | PlanRow[] | null;
  const row = Array.isArray(plans) ? plans[0] : plans;
  if (row) return mapPlan(row);

  await ensureUserDefaultPlan(userId);
  return getDefaultPlan();
}

export { formatPlanPrice } from "@/lib/billing/format";