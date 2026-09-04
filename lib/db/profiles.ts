import {
  createPresignedObjectUrl,
  downloadObject,
  isObjectStorageConfigured,
  uploadObject,
} from "@/lib/object-storage";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, ProfileRow } from "@/lib/db/types";

export { isSupabaseConfigured };

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    status: row.status,
    blockedAt: row.blocked_at,
    blockedReason: row.blocked_reason,
    blockedBy: row.blocked_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSeenAt: row.last_seen_at,
  };
}

export async function upsertProfile(input: {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<Profile> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        email: input.email ?? existing.email,
        name: input.name ?? existing.name,
        image: input.image ?? existing.image,
        updated_at: now,
        last_seen_at: now,
      })
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) throw error;
    return mapProfile(data as ProfileRow);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: input.id,
      email: input.email ?? null,
      name: input.name ?? null,
      image: input.image ?? null,
      last_seen_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

/** Remove perfis antigos criados com UUID antes da correção do OAuth. */
export async function removeDuplicateProfilesForEmail(
  email: string,
  keepId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email);

  if (error) throw error;

  const staleIds = (data ?? [])
    .map((row) => row.id)
    .filter((id) => id !== keepId);

  if (staleIds.length === 0) return;

  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .in("id", staleIds);

  if (deleteError) throw deleteError;
}

export async function listProfiles(options?: {
  search?: string;
  status?: "active" | "blocked" | "all";
  offset?: number;
  limit?: number;
}): Promise<{ profiles: Profile[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 20;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`email.ilike.${term},name.ilike.${term},id.ilike.${term}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    profiles: (data as ProfileRow[]).map(mapProfile),
    total: count ?? 0,
  };
}

export async function blockProfile(
  userId: string,
  reason: string,
  blockedBy = "admin",
): Promise<Profile> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      status: "blocked",
      blocked_at: now,
      blocked_reason: reason,
      blocked_by: blockedBy,
      updated_at: now,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function unblockProfile(userId: string): Promise<Profile> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      status: "active",
      blocked_at: null,
      blocked_reason: null,
      blocked_by: null,
      updated_at: now,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function countProfiles(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function uploadGenerationFile(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  if (!isObjectStorageConfigured()) {
    throw new Error("Object storage não configurado.");
  }

  await uploadObject(path, buffer, contentType);
}

export async function downloadGenerationFile(path: string): Promise<{
  data: Blob;
  contentType: string;
} | null> {
  if (!isObjectStorageConfigured()) return null;
  return downloadObject(path);
}

export async function createSignedMediaUrl(
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  if (!isObjectStorageConfigured()) return null;
  return createPresignedObjectUrl(path, expiresIn);
}
