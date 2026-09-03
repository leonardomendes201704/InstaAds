import { NextResponse } from "next/server";
import { logActivity } from "@/lib/db/activity";
import {
  assertCanGenerate,
  incrementGenerationUsage,
  QuotaExceededError,
} from "@/lib/billing/usage";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";
import { sendQuotaReachedEmail } from "@/lib/email/send";
import { generateAdArtworks } from "@/lib/gemini";
import { isStorageConfigured, saveGeneration } from "@/lib/storage";
import { requireCurrentUser, UserBlockedError } from "@/lib/user";

export const maxDuration = 120;

export async function POST(request: Request) {
  let userId: string | undefined;
  let generationId: string | undefined;
  let userEmail: string | undefined;

  try {
    const user = await requireCurrentUser();
    userId = user.id;
    userEmail = user.email;

    await assertCanGenerate(user.id);

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

    generationId = crypto.randomUUID();

    const result = await generateAdArtworks({
      photoBase64: body.photoBase64,
      photoMimeType: body.photoMimeType ?? "image/jpeg",
      mainMessage: body.mainMessage,
      adStyle: body.adStyle,
      adCategory: body.adCategory,
      publishTarget: body.publishTarget,
    });

    await incrementGenerationUsage(user.id);

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
          error instanceof Error ? error.message : "Erro ao salvar geração.";
        console.error("Falha ao salvar geração:", error);
      }
    } else {
      storageError =
        "Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).";
    }

    return NextResponse.json({
      ...result,
      generationId,
      stored,
      storageError,
    });
  } catch (error) {
    if (userId && generationId && isStorageConfigured()) {
      await logActivity({
        userId,
        type: "generation.failed",
        metadata: {
          generationId,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
      });
    }

    if (error instanceof UserBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof QuotaExceededError) {
      if (userId && userEmail) {
        void sendQuotaReachedEmail({
          userId,
          email: userEmail,
          planName: error.plan.name,
          limit: error.limit,
        });
      }

      return NextResponse.json(
        {
          error: error.message,
          code: "QUOTA_EXCEEDED",
          usage: error.usage,
          limit: error.limit,
          planSlug: error.plan.slug,
        },
        { status: 402 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Erro ao gerar anúncio.";
    const status = message === "Não autorizado." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
