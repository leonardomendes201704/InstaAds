import type { AdStyle } from "@/lib/types";

export interface StylePreset {
  overlayOpacity: number;
  accentColor: string;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  headlineSize: number;
  subheadlineSize: number;
  taglineSize: number;
}

export const stylePresets: Record<AdStyle, StylePreset> = {
  moderno: {
    overlayOpacity: 0.35,
    accentColor: "#FF0066",
    fontWeight: "bold",
    textAlign: "left",
    headlineSize: 56,
    subheadlineSize: 40,
    taglineSize: 24,
  },
  vendas: {
    overlayOpacity: 0.45,
    accentColor: "#FF8C00",
    fontWeight: "bold",
    textAlign: "center",
    headlineSize: 60,
    subheadlineSize: 44,
    taglineSize: 22,
  },
  elegante: {
    overlayOpacity: 0.3,
    accentColor: "#7B1FA2",
    fontWeight: "normal",
    textAlign: "center",
    headlineSize: 48,
    subheadlineSize: 32,
    taglineSize: 22,
  },
  minimalista: {
    overlayOpacity: 0.25,
    accentColor: "#171717",
    fontWeight: "normal",
    textAlign: "left",
    headlineSize: 44,
    subheadlineSize: 28,
    taglineSize: 20,
  },
};

export const categoryLabels = {
  produto: "produto",
  servico: "serviço",
  promocao: "promoção",
} as const;

export const styleLabels = {
  moderno: "moderno e vibrante",
  vendas: "focado em vendas e conversão",
  elegante: "elegante e sofisticado",
  minimalista: "minimalista e clean",
} as const;

export const publishLabels = {
  feed: "Feed do Instagram",
  stories: "Stories do Instagram",
  both: "Feed e Stories do Instagram",
} as const;
