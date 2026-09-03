import { NextResponse } from "next/server";
import { registerDeviceUser } from "@/lib/device/limits";
import { deviceCookieHeader, getDeviceIdFromRequest } from "@/lib/device/request";
import { isValidDeviceId } from "@/lib/device/constants";
import { requireCurrentUser } from "@/lib/user";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const body = (await request.json()) as { deviceId?: string };
    const deviceId =
      isValidDeviceId(body.deviceId) ? body.deviceId : getDeviceIdFromRequest(request);

    if (!deviceId) {
      return NextResponse.json(
        { error: "Identificador de dispositivo inválido." },
        { status: 400 },
      );
    }

    await registerDeviceUser(deviceId, user.id);

    const response = NextResponse.json({ ok: true, deviceId });
    response.headers.set("Set-Cookie", deviceCookieHeader(deviceId));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao sincronizar dispositivo.";
    const status = message === "Não autorizado." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
