import { NextResponse } from "next/server";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import { generateAdArtworks } from "@/lib/gemini";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mainMessage: string;
      adStyle: AdStyle;
      adCategory: AdCategory;
      publishTarget: PublishTarget;
      photoBase64: string;
      photoMimeType: string;
    };

    if (!body.photoBase64) {
      return NextResponse.json(
        { error: "Foto do produto é obrigatória." },
        { status: 400 },
      );
    }

    const result = await generateAdArtworks({
      photoBase64: body.photoBase64,
      photoMimeType: body.photoMimeType ?? "image/jpeg",
      mainMessage: body.mainMessage,
      adStyle: body.adStyle,
      adCategory: body.adCategory,
      publishTarget: body.publishTarget,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar anúncio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
