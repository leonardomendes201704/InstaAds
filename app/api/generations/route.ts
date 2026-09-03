import { NextResponse } from "next/server";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/session";
import { isStorageConfigured, listGenerationsBySession } from "@/lib/storage";

export async function GET() {
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Armazenamento não configurado.", generations: [] },
      { status: 503 },
    );
  }

  const { sessionId, isNew } = await getOrCreateSessionId();
  const generations = await listGenerationsBySession(sessionId);

  const response = NextResponse.json({ generations });
  attachSessionCookie(response, sessionId, isNew);
  return response;
}
