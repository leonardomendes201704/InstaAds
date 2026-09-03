import { NextResponse } from "next/server";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import { suggestAdMessage } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      adStyle: AdStyle;
      adCategory: AdCategory;
      publishTarget: PublishTarget;
    };

    const message = await suggestAdMessage(body);
    return NextResponse.json({ message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao sugerir texto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
