"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { InstagramFeedMockup } from "@/components/preview/InstagramFeedMockup";
import { InstagramStoriesMockup } from "@/components/preview/InstagramStoriesMockup";
import { WizardShell } from "@/components/wizard/WizardShell";
import { downloadBlobUrl } from "@/lib/ad-composer";
import type { PreviewFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/stores/wizard-store";

export function Step3Preview() {
  const {
    generatedAd,
    publishTarget,
    isGenerating,
    prevStep,
    reset,
    generateAd,
  } = useWizardStore();

  const defaultFormat: PreviewFormat =
    publishTarget === "stories" ? "stories" : "feed";

  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>(defaultFormat);

  const previewUrl = useMemo(() => {
    if (!generatedAd) return null;
    if (previewFormat === "stories") {
      return generatedAd.storiesBlobUrl ?? generatedAd.feedBlobUrl ?? null;
    }
    return generatedAd.feedBlobUrl ?? generatedAd.storiesBlobUrl ?? null;
  }, [generatedAd, previewFormat]);

  const canToggleStories = Boolean(generatedAd?.storiesBlobUrl);
  const canToggleFeed = Boolean(generatedAd?.feedBlobUrl);

  const handleDownload = () => {
    if (!generatedAd) return;

    if (previewFormat === "feed" && generatedAd.feedBlobUrl) {
      downloadBlobUrl(generatedAd.feedBlobUrl, "instaads-feed.png");
      return;
    }

    if (previewFormat === "stories" && generatedAd.storiesBlobUrl) {
      downloadBlobUrl(generatedAd.storiesBlobUrl, "instaads-stories.png");
      return;
    }

    const fallback = generatedAd.feedBlobUrl ?? generatedAd.storiesBlobUrl;
    if (fallback) downloadBlobUrl(fallback, "instaads-anuncio.png");
  };

  if (!generatedAd || !previewUrl) {
    return null;
  }

  return (
    <>
      {isGenerating ? <LoadingOverlay message="Gerando nova variação..." /> : null}
      <WizardShell
      step={3}
      title="Seu anúncio está pronto"
      subtitle="Revise a arte criada pela IA e escolha o que fazer agora."
      onBack={prevStep}
      footer={
        <>
          <InfoBanner>
            Você pode baixar, publicar ou criar novas versões.
          </InfoBanner>
          <GradientButton onClick={handleDownload}>
            <Download className="h-5 w-5" />
            Baixar anúncio
          </GradientButton>
        </>
      }
    >
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Prévia gerada</p>
            <div className="flex rounded-full border border-gray-200 p-0.5 text-xs">
              <button
                type="button"
                disabled={!canToggleFeed}
                onClick={() => setPreviewFormat("feed")}
                className={cn(
                  "rounded-full px-3 py-1",
                  previewFormat === "feed" && "option-selected text-accent-purple",
                )}
              >
                Feed
              </button>
              <button
                type="button"
                disabled={!canToggleStories}
                onClick={() => setPreviewFormat("stories")}
                className={cn(
                  "rounded-full px-3 py-1",
                  previewFormat === "stories" && "option-selected text-accent-purple",
                )}
              >
                Stories
              </button>
            </div>
          </div>

          {previewFormat === "feed" ? (
            <InstagramFeedMockup ad={generatedAd} imageUrl={previewUrl} />
          ) : (
            <InstagramStoriesMockup ad={generatedAd} imageUrl={previewUrl} />
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs">
              <Sparkles className="h-4 w-4 text-pink-500" />
              1 variação gerada
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-accent-purple" />
              Pronto para Instagram
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => useWizardStore.getState().setStep(2)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-accent-purple px-3 py-3 text-sm font-medium text-accent-purple"
          >
            <Pencil className="h-4 w-4" />
            Editar texto
          </button>
          <button
            type="button"
            onClick={() => generateAd()}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 rounded-2xl border border-accent-purple px-3 py-3 text-sm font-medium text-accent-purple disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
            Gerar outra
          </button>
        </div>
      </div>
    </WizardShell>
    </>
  );
}
