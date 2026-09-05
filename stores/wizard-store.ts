"use client";

import { base64ToBlobUrl, preparePhotoForApi } from "@/lib/image-utils";
import { getDeviceHeaders } from "@/lib/device/client";
import type { GeneratedAd } from "@/lib/types";
import {
  clearWizardDraft,
  draftToFile,
  loadWizardDraft,
  saveWizardDraft,
} from "@/lib/wizard-draft";
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
  quotaExceeded: boolean;
  deviceAccessBlocked: boolean;
  isResuming: boolean;

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
  setQuotaExceeded: (value: boolean) => void;
  persistDraftForCheckout: () => Promise<void>;
  resumeFromCheckout: () => Promise<void>;
  suggestText: () => Promise<void>;
  generateAd: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  step: 1 as WizardStep,
  photo: null,
  photoPreviewUrl: null,
  adCategory: "produto" as AdCategory,
  publishTarget: "feed" as PublishTarget,
  adStyle: "moderno" as AdStyle,
  mainMessage: "",
  generatedAd: null,
  isGenerating: false,
  isSuggesting: false,
  error: null,
  quotaExceeded: false,
  deviceAccessBlocked: false,
  isResuming: false,
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

async function waitForRemainingQuota(timeoutMs = 25000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch("/api/billing/usage");
      if (response.ok) {
        const data = (await response.json()) as { billing?: { remaining?: number } };
        if ((data.billing?.remaining ?? 0) > 0) return true;
      }
    } catch {
      // webhook can lag; keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return false;
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
  setError: (error) =>
    set(error ? { error } : { error: null, quotaExceeded: false, deviceAccessBlocked: false }),
  setQuotaExceeded: (quotaExceeded) => set({ quotaExceeded }),

  persistDraftForCheckout: async () => {
    const { photo, adCategory, publishTarget, adStyle, mainMessage } = get();
    if (!photo) throw new Error("Foto do produto é obrigatória.");
    const prepared = await preparePhotoForApi(photo);
    await saveWizardDraft({
      version: 1,
      adCategory,
      publishTarget,
      adStyle,
      mainMessage,
      photoBase64: prepared.base64,
      photoMimeType: prepared.mimeType,
      photoName: photo.name || "produto.jpg",
      savedAt: Date.now(),
    });
  },

  resumeFromCheckout: async () => {
    if (typeof window === "undefined") return;
    const resume = new URLSearchParams(window.location.search).get("resume");
    if (resume !== "1" && resume !== "canceled") return;

    window.history.replaceState({}, "", "/");
    set({ isResuming: true, error: null });

    try {
      const draft = await loadWizardDraft();
      if (draft) {
        const file = draftToFile(draft);
        get().setPhoto(file);
        set({
          step: 2,
          adCategory: draft.adCategory,
          publishTarget: draft.publishTarget,
          adStyle: draft.adStyle,
          mainMessage: draft.mainMessage,
          quotaExceeded: true,
        });
      }

      if (resume === "canceled") {
        set({ isResuming: false, quotaExceeded: true, step: 2 });
        return;
      }

      const ready = await waitForRemainingQuota();
      await clearWizardDraft();

      if (!ready) {
        set({
          isResuming: false,
          quotaExceeded: true,
          step: 2,
          error:
            "Assinatura ainda está sendo confirmada. Tente gerar de novo em instantes.",
        });
        return;
      }

      if (!get().photo) {
        set({ isResuming: false, quotaExceeded: false, error: null });
        return;
      }

      set({
        isResuming: false,
        quotaExceeded: false,
        error: null,
        isGenerating: true,
      });
      await get().generateAd();
    } catch (error) {
      set({
        isResuming: false,
        quotaExceeded: true,
        step: 2,
        error:
          error instanceof Error ? error.message : "Não foi possível retomar o anúncio.",
      });
    }
  },

  suggestText: async () => {
    const { adStyle, adCategory, publishTarget } = get();
    set({ isSuggesting: true, error: null, quotaExceeded: false, deviceAccessBlocked: false });

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

    if (!photo) return;

    set({ isGenerating: true, error: null, quotaExceeded: false, deviceAccessBlocked: false });

    try {
      const prepared = await preparePhotoForApi(photo);

      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getDeviceHeaders(),
        },
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
        benefits?: [string, string, string];
        cta?: string;
        stored?: boolean;
        storageError?: string;
        error?: string;
        code?: string;
        usage?: number;
        limit?: number;
        canRequestAccess?: boolean;
      };

      if (!response.ok) {
        if (response.status === 402 && data.code === "QUOTA_EXCEEDED") {
          set({
            quotaExceeded: true,
            deviceAccessBlocked: false,
            error: null,
          });
          return;
        }

        if (
          response.status === 403 &&
          (data.code === "DEVICE_LIMIT_EXCEEDED" || data.code === "DEVICE_MULTI_ACCOUNT")
        ) {
          set({
            quotaExceeded: false,
            deviceAccessBlocked: Boolean(data.canRequestAccess),
            error: data.error ?? "Acesso bloqueado neste dispositivo.",
          });
          return;
        }

        throw new Error(data.error ?? "Erro ao gerar anúncio.");
      }

      if (data.stored === false && data.storageError) {
        console.warn("[InstaAds] Storage:", data.storageError);
      }

      revokeGeneratedAd(generatedAd);

      const nextAd: GeneratedAd = {
        headline: data.headline ?? (mainMessage.trim() || "Destaque imperdível"),
        subheadline: data.subheadline ?? "",
        tagline: data.tagline ?? "",
        benefits: data.benefits,
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
