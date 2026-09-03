"use client";

import { base64ToBlobUrl, preparePhotoForApi } from "@/lib/image-utils";
import type { GeneratedAd } from "@/lib/types";
import { create } from "zustand";
import type {
  AdCategory,
  AdStyle,
  PublishTarget,
  WizardStep,
} from "@/lib/types";

interface WizardState {
  step: WizardStep;
  photo: File | null;
  photoPreviewUrl: string | null;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
  adStyle: AdStyle;
  mainMessage: string;
  generatedAd: GeneratedAd | null;
  isGenerating: boolean;
  isSuggesting: boolean;
  error: string | null;

  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setPhoto: (file: File | null) => void;
  setAdCategory: (category: AdCategory) => void;
  setPublishTarget: (target: PublishTarget) => void;
  setAdStyle: (style: AdStyle) => void;
  setMainMessage: (message: string) => void;
  setGeneratedAd: (ad: GeneratedAd | null) => void;
  setIsGenerating: (value: boolean) => void;
  setIsSuggesting: (value: boolean) => void;
  setError: (error: string | null) => void;
  suggestText: () => Promise<void>;
  generateAd: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  step: 1 as WizardStep,
  photo: null,
  photoPreviewUrl: null,
  adCategory: "produto" as AdCategory,
  publishTarget: "both" as PublishTarget,
  adStyle: "moderno" as AdStyle,
  mainMessage: "",
  generatedAd: null,
  isGenerating: false,
  isSuggesting: false,
  error: null,
};

const defaultLayout = {
  textAlign: "left" as const,
  overlayOpacity: 0.35,
  accentColor: "#FF0066",
  fontWeight: "bold" as const,
};

function revokeGeneratedAd(ad: GeneratedAd | null) {
  if (!ad) return;
  if (ad.feedBlobUrl) URL.revokeObjectURL(ad.feedBlobUrl);
  if (ad.storiesBlobUrl) URL.revokeObjectURL(ad.storiesBlobUrl);
}

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => {
    const { step } = get();
    if (step < 3) set({ step: (step + 1) as WizardStep });
  },
  prevStep: () => {
    const { step } = get();
    if (step > 1) set({ step: (step - 1) as WizardStep });
  },

  setPhoto: (file) => {
    const prev = get().photoPreviewUrl;
    if (prev) URL.revokeObjectURL(prev);
    if (!file) {
      set({ photo: null, photoPreviewUrl: null });
      return;
    }
    set({ photo: file, photoPreviewUrl: URL.createObjectURL(file) });
  },

  setAdCategory: (adCategory) => set({ adCategory }),
  setPublishTarget: (publishTarget) => set({ publishTarget }),
  setAdStyle: (adStyle) => set({ adStyle }),
  setMainMessage: (mainMessage) => set({ mainMessage }),
  setGeneratedAd: (generatedAd) => set({ generatedAd }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsSuggesting: (isSuggesting) => set({ isSuggesting }),
  setError: (error) => set({ error }),

  suggestText: async () => {
    const { adStyle, adCategory, publishTarget } = get();
    set({ isSuggesting: true, error: null });

    try {
      const response = await fetch("/api/suggest-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adStyle, adCategory, publishTarget }),
      });

      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Erro ao sugerir texto.");
      if (data.message) set({ mainMessage: data.message });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro ao sugerir texto.",
      });
    } finally {
      set({ isSuggesting: false });
    }
  },

  generateAd: async () => {
    const {
      photo,
      mainMessage,
      adStyle,
      adCategory,
      publishTarget,
      generatedAd,
    } = get();

    if (!photo || !mainMessage.trim()) return;

    set({ isGenerating: true, error: null });

    try {
      const prepared = await preparePhotoForApi(photo);

      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainMessage,
          adStyle,
          adCategory,
          publishTarget,
          photoBase64: prepared.base64,
          photoMimeType: prepared.mimeType,
        }),
      });

      const data = (await response.json()) as {
        feedImage?: { base64: string; mimeType: string };
        storiesImage?: { base64: string; mimeType: string };
        headline?: string;
        subheadline?: string;
        tagline?: string;
        cta?: string;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Erro ao gerar anúncio.");

      revokeGeneratedAd(generatedAd);

      const nextAd: GeneratedAd = {
        headline: data.headline ?? mainMessage,
        subheadline: data.subheadline ?? "",
        tagline: data.tagline ?? "",
        cta: data.cta ?? "Envie uma mensagem",
        layout: defaultLayout,
        feedBlobUrl: data.feedImage
          ? base64ToBlobUrl(data.feedImage.base64, data.feedImage.mimeType)
          : undefined,
        storiesBlobUrl: data.storiesImage
          ? base64ToBlobUrl(data.storiesImage.base64, data.storiesImage.mimeType)
          : undefined,
      };

      set({
        generatedAd: nextAd,
        step: 3,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro ao gerar anúncio.",
      });
    } finally {
      set({ isGenerating: false });
    }
  },

  reset: () => {
    const prev = get().photoPreviewUrl;
    if (prev) URL.revokeObjectURL(prev);
    revokeGeneratedAd(get().generatedAd);
    set({ ...initialState });
  },
}));
