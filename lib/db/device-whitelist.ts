import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface DeviceWhitelistEntry {
  userId: string;
  email: string | null;
  name: string | null;
  note: string;
  createdBy: string;
  createdAt: string;
}

export async function listDeviceWhitelist(): Promise<DeviceWhitelistEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("device_whitelist")
    .select("user_id, note, created_by, created_at, profiles(email, name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profiles = row.profiles as
      | { email: string | null; name: string | null }
      | { email: string | null; name: string | null }[]
      | null;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      userId: row.user_id as string,
      email: profile?.email ?? null,
      name: profile?.name ?? null,
      note: row.note as string,
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
    };
  });
}

export async function addDeviceWhitelist(input: {
  userId: string;
  note?: string;
  createdBy?: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("device_whitelist").upsert(
    {
      user_id: input.userId,
      note: input.note?.trim() ?? "",
      created_by: input.createdBy ?? "admin",
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

export async function removeDeviceWhitelist(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("device_whitelist")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email.trim())
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}
