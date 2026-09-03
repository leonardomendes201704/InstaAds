import { GoogleGenAI, Type } from "@google/genai";
import type { AdCategory, AdStyle, GeneratedAdCopy, PublishTarget } from "@/lib/types";
import {
  categoryLabels,
  publishLabels,
  styleLabels,
} from "@/lib/ad-styles";

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.6-flash";

function getApiKey(): string {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY não configurada. Adicione sua chave do Google AI Studio.",
    );
  }

  return apiKey;
}

function getClient() {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

export async function suggestAdMessage(input: {
  adStyle: AdStyle;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
}): Promise<string> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Você cria frases curtas de anúncio para Instagram em português do Brasil. Responda apenas com a frase, sem aspas.

Crie uma mensagem principal curta (máx. 60 caracteres) para anunciar um ${categoryLabels[input.adCategory]} com estilo ${styleLabels[input.adStyle]} para ${publishLabels[input.publishTarget]}.`,
    config: {
      temperature: 0.8,
    },
  });

  return response.text?.trim() ?? "Nova coleção com até 30% OFF";
}

const adCopySchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    subheadline: { type: Type.STRING },
    tagline: { type: Type.STRING },
    cta: { type: Type.STRING },
    layout: {
      type: Type.OBJECT,
      properties: {
        textAlign: { type: Type.STRING },
        overlayOpacity: { type: Type.NUMBER },
        accentColor: { type: Type.STRING },
        fontWeight: { type: Type.STRING },
      },
      required: ["textAlign", "overlayOpacity", "accentColor", "fontWeight"],
    },
  },
  required: ["headline", "subheadline", "tagline", "cta", "layout"],
};

export async function generateAdCopy(input: {
  mainMessage: string;
  adStyle: AdStyle;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
}): Promise<GeneratedAdCopy> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Gere copy para anúncio Instagram em português do Brasil.
Mensagem principal: ${input.mainMessage}
Categoria: ${categoryLabels[input.adCategory]}
Estilo: ${styleLabels[input.adStyle]}
Formato: ${publishLabels[input.publishTarget]}

Retorne headline, subheadline, tagline, cta e layout (textAlign, overlayOpacity, accentColor, fontWeight).`,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: adCopySchema,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Resposta vazia do Gemini.");
  }

  const parsed = JSON.parse(raw) as GeneratedAdCopy;

  return {
    headline: parsed.headline || input.mainMessage,
    subheadline: parsed.subheadline || "",
    tagline: parsed.tagline || "Estilo que combina com você",
    cta: parsed.cta || "Compre agora",
    layout: {
      textAlign: parsed.layout?.textAlign ?? "left",
      overlayOpacity: parsed.layout?.overlayOpacity ?? 0.35,
      accentColor: parsed.layout?.accentColor ?? "#FF0066",
      fontWeight: parsed.layout?.fontWeight ?? "bold",
    },
  };
}
