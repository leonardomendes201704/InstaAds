import { NextResponse } from "next/server";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import { generateAdArtworks } from "@/lib/gemini";
import { isStorageConfigured, saveGeneration } from "@/lib/storage";
import { requireCurrentUser } from "@/lib/user";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

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
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
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
            aiCost: result.aiCost,
          },
        });
        stored = true;
      } catch (error) {
        storageError =
          error instanceof Error ? error.message : "Erro ao salvar no Blob.";
        console.error("Falha ao salvar geração no Blob:", error);
      }
    } else {
      storageError = "Vercel Blob não configurado (BLOB_STORE_ID ou BLOB_READ_WRITE_TOKEN).";
    }

    return NextResponse.json({
      ...result,
      generationId,
      stored,
      storageError,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar anúncio.";
    const status = message === "Não autorizado." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
