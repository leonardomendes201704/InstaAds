import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed_cents";
  discountValue: number;
  planIds: string[] | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  stripePromotionCodeId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromotionRow {
  id: string;
  code: string;
  description: string;
  discount_type: "percent" | "fixed_cents";
  discount_value: number;
  plan_ids: string[] | null;
  max_redemptions: number | null;
  redemption_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  stripe_promotion_code_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapPromotion(row: PromotionRow): Promotion {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    planIds: row.plan_ids,
    maxRedemptions: row.max_redemptions,
    redemptionCount: row.redemption_count,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    isActive: row.is_active,
    stripePromotionCodeId: row.stripe_promotion_code_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPromotions(): Promise<Promotion[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as PromotionRow[]).map(mapPromotion);
}

export async function getPromotionByCode(code: string): Promise<Promotion | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .ilike("code", code.trim())
    .maybeSingle();

  if (error) throw error;
  return data ? mapPromotion(data as PromotionRow) : null;
}

export async function createPromotion(input: {
  code: string;
  description?: string;
  discountType: "percent" | "fixed_cents";
  discountValue: number;
  planIds?: string[] | null;
  maxRedemptions?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
  stripePromotionCodeId?: string | null;
}): Promise<Promotion> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("promotions")
    .insert({
      code: input.code.trim().toUpperCase(),
      description: input.description ?? "",
      discount_type: input.discountType,
      discount_value: input.discountValue,
      plan_ids: input.planIds ?? null,
      max_redemptions: input.maxRedemptions ?? null,
      valid_from: input.validFrom ?? null,
      valid_until: input.validUntil ?? null,
      is_active: input.isActive ?? true,
      stripe_promotion_code_id: input.stripePromotionCodeId ?? null,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapPromotion(data as PromotionRow);
}

export async function updatePromotion(
  id: string,
  input: Partial<{
    code: string;
    description: string;
    discountType: "percent" | "fixed_cents";
    discountValue: number;
    planIds: string[] | null;
    maxRedemptions: number | null;
    validFrom: string | null;
    validUntil: string | null;
    isActive: boolean;
    stripePromotionCodeId: string | null;
  }>,
): Promise<Promotion> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (input.code !== undefined) patch.code = input.code.trim().toUpperCase();
  if (input.description !== undefined) patch.description = input.description;
  if (input.discountType !== undefined) patch.discount_type = input.discountType;
  if (input.discountValue !== undefined) patch.discount_value = input.discountValue;
  if (input.planIds !== undefined) patch.plan_ids = input.planIds;
  if (input.maxRedemptions !== undefined) patch.max_redemptions = input.maxRedemptions;
  if (input.validFrom !== undefined) patch.valid_from = input.validFrom;
  if (input.validUntil !== undefined) patch.valid_until = input.validUntil;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.stripePromotionCodeId !== undefined) {
    patch.stripe_promotion_code_id = input.stripePromotionCodeId;
  }

  const { data, error } = await supabase
    .from("promotions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapPromotion(data as PromotionRow);
}

export async function deletePromotion(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw error;
}

export function validatePromotion(
  promotion: Promotion,
  planId: string,
): string | null {
  if (!promotion.isActive) return "Promoção inativa.";
  const now = Date.now();

  if (promotion.validFrom && new Date(promotion.validFrom).getTime() > now) {
    return "Promoção ainda não válida.";
  }
  if (promotion.validUntil && new Date(promotion.validUntil).getTime() < now) {
    return "Promoção expirada.";
  }
  if (
    promotion.maxRedemptions !== null &&
    promotion.redemptionCount >= promotion.maxRedemptions
  ) {
    return "Promoção esgotada.";
  }
  if (promotion.planIds?.length && !promotion.planIds.includes(planId)) {
    return "Promoção não válida para este plano.";
  }

  return null;
}
