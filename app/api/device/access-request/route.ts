import { NextResponse } from "next/server";
import { createDeviceAccessRequest, getPendingAccessRequest } from "@/lib/db/device-access-requests";
import { getDeviceIdFromRequest } from "@/lib/device/request";
import { registerDeviceUser } from "@/lib/device/limits";
import { isValidDeviceId } from "@/lib/device/constants";
import { requireCurrentUser } from "@/lib/user";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ pending: false });
    }

    const { searchParams } = new URL(request.url);
    let deviceId = getDeviceIdFromRequest(request);
    const queryDeviceId = searchParams.get("deviceId");
    if (!deviceId && isValidDeviceId(queryDeviceId)) {
      deviceId = queryDeviceId;
    }

    if (!deviceId) {
      return NextResponse.json({ pending: false });
    }

    const pending = await getPendingAccessRequest(deviceId, user.id);
    return NextResponse.json({ pending: Boolean(pending), request: pending });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não autorizado.";
    const status = message === "Não autorizado." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Recurso indisponível no momento." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { deviceId?: string; message?: string };
    let deviceId = getDeviceIdFromRequest(request);
    if (!deviceId && isValidDeviceId(body.deviceId)) {
      deviceId = body.deviceId;
    }

    if (!deviceId) {
      return NextResponse.json(
        { error: "Identificação do dispositivo ausente." },
        { status: 400 },
      );
    }

    await registerDeviceUser(deviceId, user.id);

    const accessRequest = await createDeviceAccessRequest({
      deviceId,
      userId: user.id,
      userEmail: user.email,
      message: body.message,
    });

    return NextResponse.json({
      ok: true,
      request: accessRequest,
      message: "Solicitação enviada. Aguarde aprovação do administrador.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao enviar solicitação.";
    const status = message === "Não autorizado." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
