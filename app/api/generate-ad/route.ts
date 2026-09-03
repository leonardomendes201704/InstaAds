import { NextResponse } from "next/server";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import { generateAdCopy } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mainMessage: string;
      adStyle: AdStyle;
      adCategory: AdCategory;
      publishTarget: PublishTarget;
    };

    const copy = await generateAdCopy(body);
    return NextResponse.json(copy);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar anúncio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
