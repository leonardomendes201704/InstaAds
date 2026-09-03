import { getSupabaseAdmin } from "@/lib/supabase/server";

export type PlatformSettingKey =
  | "stripe_secret_key"
  | "stripe_publishable_key"
  | "stripe_webhook_secret"
  | "resend_api_key"
  | "email_from";

const SECRET_KEYS: PlatformSettingKey[] = [
  "stripe_secret_key",
  "stripe_webhook_secret",
  "resend_api_key",
];

export interface PlatformSettings {
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  resendApiKey: string;
  emailFrom: string;
}

function envFallback(key: PlatformSettingKey): string {
  switch (key) {
    case "stripe_secret_key":
      return process.env.STRIPE_SECRET_KEY ?? "";
    case "stripe_publishable_key":
      return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    case "stripe_webhook_secret":
      return process.env.STRIPE_WEBHOOK_SECRET ?? "";
    case "resend_api_key":
      return process.env.RESEND_API_KEY ?? "";
    case "email_from":
      return process.env.EMAIL_FROM ?? "";
    default:
      return "";
  }
}

export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${"•".repeat(12)}${value.slice(-4)}`;
}

export async function getSetting(key: PlatformSettingKey): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) throw error;
    const dbValue = data?.value?.trim();
    if (dbValue) return dbValue;
  } catch {
    // fallback to env
  }

  return envFallback(key);
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const [stripeSecretKey, stripePublishableKey, stripeWebhookSecret, resendApiKey, emailFrom] =
    await Promise.all([
      getSetting("stripe_secret_key"),
      getSetting("stripe_publishable_key"),
      getSetting("stripe_webhook_secret"),
      getSetting("resend_api_key"),
      getSetting("email_from"),
    ]);

  return {
    stripeSecretKey,
    stripePublishableKey,
    stripeWebhookSecret,
    resendApiKey,
    emailFrom,
  };
}

export async function getPlatformSettingsForAdmin(): Promise<
  PlatformSettings & {
    masked: Record<PlatformSettingKey, string>;
    configured: Record<PlatformSettingKey, boolean>;
  }
> {
  const settings = await getPlatformSettings();
  const keys: PlatformSettingKey[] = [
    "stripe_secret_key",
    "stripe_publishable_key",
    "stripe_webhook_secret",
    "resend_api_key",
    "email_from",
  ];

  const raw: Record<PlatformSettingKey, string> = {
    stripe_secret_key: settings.stripeSecretKey,
    stripe_publishable_key: settings.stripePublishableKey,
    stripe_webhook_secret: settings.stripeWebhookSecret,
    resend_api_key: settings.resendApiKey,
    email_from: settings.emailFrom,
  };

  const masked = {} as Record<PlatformSettingKey, string>;
  const configured = {} as Record<PlatformSettingKey, boolean>;

  for (const key of keys) {
    const value = raw[key];
    configured[key] = Boolean(value);
    masked[key] = SECRET_KEYS.includes(key) ? maskSecret(value) : value;
  }

  return { ...settings, masked, configured };
}

export async function updatePlatformSettings(
  input: Partial<Record<PlatformSettingKey, string>>,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const trimmed = value.trim();

    if (!trimmed) {
      await supabase.from("platform_settings").delete().eq("key", key);
      continue;
    }

    const { error } = await supabase.from("platform_settings").upsert(
      { key, value: trimmed, updated_at: now },
      { onConflict: "key" },
    );

    if (error) throw error;
  }
}

export async function isStripeConfigured(): Promise<boolean> {
  const settings = await getPlatformSettings();
  return Boolean(settings.stripeSecretKey && settings.stripePublishableKey);
}

export async function isEmailConfigured(): Promise<boolean> {
  const settings = await getPlatformSettings();
  return Boolean(settings.resendApiKey && settings.emailFrom);
}
