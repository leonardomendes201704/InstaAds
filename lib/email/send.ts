import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getPlatformSettings, isEmailConfigured } from "@/lib/db/settings";

export type EmailTemplate =
  | "welcome"
  | "subscription_active"
  | "quota_reached"
  | "payment_failed";

interface SendEmailInput {
  userId?: string;
  to: string;
  template: EmailTemplate;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}

export async function logEmail(input: {
  userId?: string;
  toEmail: string;
  template: EmailTemplate;
  subject: string;
  status: "pending" | "sent" | "failed" | "skipped";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("email_log").insert({
    user_id: input.userId ?? null,
    to_email: input.toEmail,
    template: input.template,
    subject: input.subject,
    status: input.status,
    error_message: input.errorMessage ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function listEmailLog(options?: {
  offset?: number;
  limit?: number;
}): Promise<{
  emails: Array<{
    id: string;
    userId: string | null;
    toEmail: string;
    template: string;
    subject: string;
    status: string;
    errorMessage: string | null;
    createdAt: string;
  }>;
  total: number;
}> {
  const supabase = getSupabaseAdmin();
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 30;

  const { data, error, count } = await supabase
    .from("email_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    emails: (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      toEmail: row.to_email,
      template: row.template,
      subject: row.subject,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
  };
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const configured = await isEmailConfigured();

  if (!configured) {
    await logEmail({
      userId: input.userId,
      toEmail: input.to,
      template: input.template,
      subject: input.subject,
      status: "skipped",
      errorMessage: "Resend não configurado.",
      metadata: input.metadata,
    });
    return false;
  }

  const settings = await getPlatformSettings();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: settings.emailFrom,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `HTTP ${response.status}`);
    }

    await logEmail({
      userId: input.userId,
      toEmail: input.to,
      template: input.template,
      subject: input.subject,
      status: "sent",
      metadata: input.metadata,
    });

    return true;
  } catch (error) {
    await logEmail({
      userId: input.userId,
      toEmail: input.to,
      template: input.template,
      subject: input.subject,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
      metadata: input.metadata,
    });
    return false;
  }
}

export async function sendWelcomeEmail(input: {
  userId: string;
  email: string;
  name?: string;
}): Promise<void> {
  await sendEmail({
    userId: input.userId,
    to: input.email,
    template: "welcome",
    subject: "Bem-vindo ao InstaAds",
    html: `<p>Olá${input.name ? ` ${input.name}` : ""},</p><p>Sua conta InstaAds está pronta. Comece a criar anúncios para Instagram com IA.</p>`,
  });
}

export async function sendQuotaReachedEmail(input: {
  userId: string;
  email: string;
  planName: string;
  limit: number;
}): Promise<void> {
  await sendEmail({
    userId: input.userId,
    to: input.email,
    template: "quota_reached",
    subject: "Limite mensal atingido — InstaAds",
    html: `<p>Você atingiu o limite de ${input.limit} gerações do plano ${input.planName}.</p><p>Faça upgrade em <a href="https://insta-ads.vercel.app/planos">insta-ads.vercel.app/planos</a>.</p>`,
    metadata: { planName: input.planName, limit: input.limit },
  });
}
