import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getPlatformSettingsForAdmin,
  updatePlatformSettings,
  type PlatformSettingKey,
} from "@/lib/db/settings";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  try {
    const settings = await getPlatformSettingsForAdmin();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    return NextResponse.json({ error: "Erro ao carregar configurações." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Partial<Record<PlatformSettingKey, string>>;

    const allowed: PlatformSettingKey[] = [
      "stripe_secret_key",
      "stripe_publishable_key",
      "stripe_webhook_secret",
      "resend_api_key",
      "email_from",
      "google_ai_api_key",
      "gemini_text_model",
      "gemini_image_model",
    ];

    const patch: Partial<Record<PlatformSettingKey, string>> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    await updatePlatformSettings(patch);
    const settings = await getPlatformSettingsForAdmin();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações." }, { status: 500 });
  }
}
