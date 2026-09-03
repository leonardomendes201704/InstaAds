import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  computeAdminStats,
  isStorageConfigured,
  listAllGenerations,
} from "@/lib/storage";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Armazenamento não configurado.", generations: [], stats: null },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const { generations, cursor: nextCursor, hasMore } =
    await listAllGenerations({ cursor });

  return NextResponse.json({
    generations,
    stats: computeAdminStats(generations),
    cursor: nextCursor,
    hasMore,
  });
}
