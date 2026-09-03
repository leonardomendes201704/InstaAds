import { NextResponse } from "next/server";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import { generateAdArtworks } from "@/lib/gemini";
import { attachSessionCookie, getOrCreateSessionId } from "@/lib/session";
import { isStorageConfigured, saveGeneration } from "@/lib/storage";

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

    const { sessionId, isNew } = await getOrCreateSessionId();
    const generationId = crypto.randomUUID();

    const result = await generateAdArtworks({
      photoBase64: body.photoBase64,
      photoMimeType: body.photoMimeType ?? "image/jpeg",
      mainMessage: body.mainMessage,
      adStyle: body.adStyle,
      adCategory: body.adCategory,
      publishTarget: body.publishTarget,
    });

    let stored = false;
    let storageError: string | undefined;

    if (isStorageConfigured()) {
      try {
        await saveGeneration({
          sessionId,
          generationId,
          photoBase64: body.photoBase64,
          photoMimeType: body.photoMimeType ?? "image/jpeg",
          feedImage: result.feedImage,
          storiesImage: result.storiesImage,
          metadata: {
            status: "success",
            adCategory: body.adCategory,
            adStyle: body.adStyle,
            mainMessage: body.mainMessage ?? "",
            publishTarget: body.publishTarget,
            headline: result.headline,
            subheadline: result.subheadline,
            benefits: result.benefits,
            cta: result.cta,
          },
        });
        stored = true;
      } catch (error) {
        storageError =
          error instanceof Error ? error.message : "Erro ao salvar no Blob.";
        console.error("Falha ao salvar geração no Blob:", error);
      }
    } else {
      storageError = "BLOB_READ_WRITE_TOKEN não configurado.";
    }

    const response = NextResponse.json({
      ...result,
      generationId,
      stored,
      storageError,
    });

    attachSessionCookie(response, sessionId, isNew);
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar anúncio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
