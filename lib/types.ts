export type WizardStep = 1 | 2 | 3;

export type AdCategory = "produto" | "servico" | "promocao";

export type PublishTarget = "feed" | "stories" | "both";

export type AdStyle = "moderno" | "vendas" | "elegante" | "minimalista";

export type PreviewFormat = "feed" | "stories";

export interface AdLayout {
  textAlign: "left" | "center" | "right";
  overlayOpacity: number;
  accentColor: string;
  fontWeight: "normal" | "bold";
}

export interface GeneratedAdCopy {
  headline: string;
  subheadline: string;
  tagline: string;
  cta: string;
  layout: AdLayout;
}

export interface GeneratedAd extends GeneratedAdCopy {
  feedBlobUrl?: string;
  storiesBlobUrl?: string;
}
