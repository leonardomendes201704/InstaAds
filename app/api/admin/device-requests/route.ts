import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getDeviceAccessRequestById,
  listDeviceAccessRequests,
  reviewDeviceAccessRequest,
} from "@/lib/db/device-access-requests";
import { addDeviceWhitelist } from "@/lib/db/device-whitelist";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [] }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status =
    (searchParams.get("status") as "pending" | "approved" | "rejected" | "all" | null) ??
    "pending";

  try {
    const requests = await listDeviceAccessRequests({ status });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Erro ao listar solicitações:", error);
    return NextResponse.json({ error: "Erro ao carregar solicitações." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = (await request.json()) as {
      id: string;
      action: "approve" | "reject";
      adminNote?: string;
    };

    if (!body.id || !body.action) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const existing = await getDeviceAccessRequestById(body.id);
    if (!existing) {
      return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
    }

    if (existing.status !== "pending") {
      return NextResponse.json({ error: "Solicitação já revisada." }, { status: 400 });
    }

    if (body.action === "approve") {
      await addDeviceWhitelist({
        userId: existing.userId,
        note: body.adminNote?.trim() || `Aprovado via solicitação ${existing.id.slice(0, 8)}`,
        createdBy: "admin",
      });
    }

    const requestRow = await reviewDeviceAccessRequest({
      id: body.id,
      status: body.action === "approve" ? "approved" : "rejected",
      adminNote: body.adminNote,
    });

    return NextResponse.json({ request: requestRow });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao revisar solicitação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
