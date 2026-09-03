import { getSupabaseAdmin } from "@/lib/supabase/server";

export type DeviceAccessRequestStatus = "pending" | "approved" | "rejected";

export interface DeviceAccessRequest {
  id: string;
  deviceId: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  status: DeviceAccessRequestStatus;
  message: string;
  adminNote: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  otherUsersOnDevice: number;
}

interface RequestRow {
  id: string;
  device_id: string;
  user_id: string;
  user_email: string | null;
  status: DeviceAccessRequestStatus;
  message: string;
  admin_note: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  profiles?: { email: string | null; name: string | null } | null;
}

function mapRequest(row: RequestRow, otherUsersOnDevice = 0): DeviceAccessRequest {
  const profile = row.profiles;
  return {
    id: row.id,
    deviceId: row.device_id,
    userId: row.user_id,
    userEmail: row.user_email ?? profile?.email ?? null,
    userName: profile?.name ?? null,
    status: row.status,
    message: row.message,
    adminNote: row.admin_note,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    otherUsersOnDevice,
  };
}

export async function listDeviceAccessRequests(options?: {
  status?: DeviceAccessRequestStatus | "all";
}): Promise<DeviceAccessRequest[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("device_access_requests")
    .select("*, profiles(email, name)")
    .order("created_at", { ascending: false });

  const status = options?.status ?? "all";
  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as RequestRow[];
  const results: DeviceAccessRequest[] = [];

  for (const row of rows) {
    const { count } = await supabase
      .from("device_users")
      .select("user_id", { count: "exact", head: true })
      .eq("device_id", row.device_id)
      .neq("user_id", row.user_id);

    results.push(mapRequest(row, count ?? 0));
  }

  return results;
}

export async function getPendingAccessRequest(
  deviceId: string,
  userId: string,
): Promise<DeviceAccessRequest | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("device_access_requests")
    .select("*, profiles(email, name)")
    .eq("device_id", deviceId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw error;
  return data ? mapRequest(data as RequestRow) : null;
}

export async function createDeviceAccessRequest(input: {
  deviceId: string;
  userId: string;
  userEmail?: string;
  message?: string;
}): Promise<DeviceAccessRequest> {
  const supabase = getSupabaseAdmin();
  const existing = await getPendingAccessRequest(input.deviceId, input.userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("device_access_requests")
    .insert({
      device_id: input.deviceId,
      user_id: input.userId,
      user_email: input.userEmail ?? null,
      message: input.message?.trim() ?? "",
    })
    .select("*, profiles(email, name)")
    .single();

  if (error) throw error;
  return mapRequest(data as RequestRow);
}

export async function reviewDeviceAccessRequest(input: {
  id: string;
  status: "approved" | "rejected";
  adminNote?: string;
  reviewedBy?: string;
}): Promise<DeviceAccessRequest> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("device_access_requests")
    .update({
      status: input.status,
      admin_note: input.adminNote?.trim() ?? "",
      reviewed_at: now,
      reviewed_by: input.reviewedBy ?? "admin",
    })
    .eq("id", input.id)
    .select("*, profiles(email, name)")
    .single();

  if (error) throw error;
  return mapRequest(data as RequestRow);
}

export async function getDeviceAccessRequestById(
  id: string,
): Promise<DeviceAccessRequest | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("device_access_requests")
    .select("*, profiles(email, name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRequest(data as RequestRow) : null;
}
