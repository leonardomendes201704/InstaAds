import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GENERATIONS_BUCKET } from "@/lib/object-storage";

let adminClient: SupabaseClient | null = null;

function getDatabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = getDatabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Banco não configurado (SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
    });
  }

  return adminClient;
}

export { GENERATIONS_BUCKET };
