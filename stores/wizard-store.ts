"use client";

import { composeAdImages } from "@/lib/ad-composer";
import type { GeneratedAd, GeneratedAdCopy } from "@/lib/types";
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
      photoPreviewUrl,
      mainMessage,
      adStyle,
      adCategory,
      publishTarget,
      generatedAd,
    } = get();

    if (!photoPreviewUrl || !mainMessage.trim()) return;

    set({ isGenerating: true, error: null });

    try {
      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainMessage,
          adStyle,
          adCategory,
          publishTarget,
        }),
      });

      const copy = (await response.json()) as GeneratedAdCopy & { error?: string };
      if (!response.ok) throw new Error(copy.error ?? "Erro ao gerar anúncio.");

      revokeGeneratedAd(generatedAd);
      const blobs = await composeAdImages(
        photoPreviewUrl,
        copy,
        adStyle,
        publishTarget,
      );

      set({
        generatedAd: { ...copy, ...blobs },
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
