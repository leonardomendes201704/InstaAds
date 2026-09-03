import { GoogleGenAI, Modality, Type } from "@google/genai";
import { buildAdArtPrompt } from "@/lib/ad-prompt";
import type {
  AdArtworkCopy,
  AdCategory,
  AdStyle,
  GeneratedAdCopy,
  PublishTarget,
} from "@/lib/types";
import {
  categoryLabels,
  publishLabels,
  styleLabels,
} from "@/lib/ad-styles";

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.6-flash";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";

function getApiKey(): string {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

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

export interface GeneratedAdImage {
  base64: string;
  mimeType: string;
}

export interface GeneratedAdResult {
  feedImage?: GeneratedAdImage;
  storiesImage?: GeneratedAdImage;
  headline: string;
  subheadline: string;
  tagline: string;
  benefits: [string, string, string];
  cta: string;
}

const artworkCopySchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    subheadline: { type: Type.STRING },
    benefits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    cta: { type: Type.STRING },
  },
  required: ["headline", "subheadline", "benefits", "cta"],
};

const defaultCta: Record<AdCategory, string> = {
  produto: "Envie uma mensagem",
  servico: "Chame no WhatsApp",
  promocao: "Peça o seu agora",
};

function normalizeBenefits(benefits: string[] | undefined): [string, string, string] {
  const items = (benefits ?? []).filter(Boolean).slice(0, 3);
  while (items.length < 3) {
    items.push(
      items.length === 0
        ? "Design exclusivo"
        : items.length === 1
          ? "Qualidade premium"
          : "Pronto para usar",
    );
  }
  return [items[0], items[1], items[2]];
}

export async function generateAdArtworkCopy(input: {
  photoBase64: string;
  photoMimeType: string;
  mainMessage: string;
  adStyle: AdStyle;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
}): Promise<AdArtworkCopy> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: input.photoMimeType,
              data: input.photoBase64,
            },
          },
          {
            text: `Você é copywriter brasileiro especialista em anúncios de Instagram/Facebook.

Analise o produto na foto e crie textos para uma arte publicitária em português do BRASIL (PT-BR).

REGRAS OBRIGATÓRIAS:
- APENAS português do Brasil correto, com acentuação
- PROIBIDO: inglês, espanhol, palavras inventadas, erros de ortografia
- headline: máximo 50 caracteres, impactante, CAIXA ALTA opcional
- subheadline: máximo 80 caracteres, benefício principal
- benefits: exatamente 3 itens curtos (máx. 35 caracteres cada), sem bullet na string
- cta: máximo 25 caracteres, ação clara (ex: "Envie uma mensagem")

Contexto:
- Mensagem do anunciante: "${input.mainMessage}"
- Categoria: ${categoryLabels[input.adCategory]}
- Estilo: ${styleLabels[input.adStyle]}
- Canal: ${publishLabels[input.publishTarget]}
- CTA sugerido: "${defaultCta[input.adCategory]}"`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: artworkCopySchema,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Resposta vazia ao gerar textos do anúncio.");
  }

  const parsed = JSON.parse(raw) as AdArtworkCopy;

  return {
    headline: parsed.headline?.trim() || input.mainMessage.toUpperCase(),
    subheadline: parsed.subheadline?.trim() || "",
    benefits: normalizeBenefits(parsed.benefits),
    cta: parsed.cta?.trim() || defaultCta[input.adCategory],
  };
}

function extractImageFromResponse(response: {
  data?: string;
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
  }>;
}): GeneratedAdImage | null {
  if (response.data) {
    const mimeType =
      response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)
        ?.inlineData?.mimeType ?? "image/png";
    return { base64: response.data, mimeType };
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }

  return null;
}

async function generateAdArtworkVariant(input: {
  photoBase64: string;
  photoMimeType: string;
  copy: AdArtworkCopy;
  adCategory: AdCategory;
  adStyle: AdStyle;
  publishTarget: PublishTarget;
  aspectRatio: "4:5" | "9:16";
}): Promise<GeneratedAdImage> {
  const ai = getClient();
  const prompt = buildAdArtPrompt({
    copy: input.copy,
    adCategory: input.adCategory,
    adStyle: input.adStyle,
    publishTarget: input.publishTarget,
    aspectRatio: input.aspectRatio,
  });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: input.photoMimeType,
              data: input.photoBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.IMAGE],
      imageConfig: {
        aspectRatio: input.aspectRatio,
        imageSize: "1K",
      },
    },
  });

  const image = extractImageFromResponse(response);
  if (!image) {
    const text = response.text?.trim();
    throw new Error(
      text
        ? `Gemini não retornou imagem: ${text}`
        : "Gemini não retornou a arte gerada. Tente novamente.",
    );
  }

  return image;
}

export async function generateAdArtworks(input: {
  photoBase64: string;
  photoMimeType: string;
  mainMessage: string;
  adStyle: AdStyle;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
}): Promise<GeneratedAdResult> {
  const copy = await generateAdArtworkCopy(input);

  const result: GeneratedAdResult = {
    headline: copy.headline,
    subheadline: copy.subheadline,
    tagline: copy.benefits.join(" • "),
    benefits: copy.benefits,
    cta: copy.cta,
  };

  const tasks: Array<Promise<void>> = [];

  if (input.publishTarget === "feed" || input.publishTarget === "both") {
    tasks.push(
      generateAdArtworkVariant({
        ...input,
        copy,
        aspectRatio: "4:5",
      }).then((image) => {
        result.feedImage = image;
      }),
    );
  }

  if (input.publishTarget === "stories" || input.publishTarget === "both") {
    tasks.push(
      generateAdArtworkVariant({
        ...input,
        copy,
        aspectRatio: "9:16",
      }).then((image) => {
        result.storiesImage = image;
      }),
    );
  }

  await Promise.all(tasks);

  return result;
}

export async function suggestAdMessage(input: {
  adStyle: AdStyle;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
}): Promise<string> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Você cria frases curtas de anúncio para Instagram em português do Brasil. Responda apenas com a frase, sem aspas. Use português correto, sem inglês ou espanhol.

Crie uma mensagem principal curta (máx. 60 caracteres) para anunciar um ${categoryLabels[input.adCategory]} com estilo ${styleLabels[input.adStyle]} para ${publishLabels[input.publishTarget]}.`,
    config: {
      temperature: 0.6,
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
    contents: `Gere copy para anúncio Instagram em português do Brasil. PROIBIDO inglês ou espanhol.
Mensagem principal: ${input.mainMessage}
Categoria: ${categoryLabels[input.adCategory]}
Estilo: ${styleLabels[input.adStyle]}
Formato: ${publishLabels[input.publishTarget]}

Retorne headline, subheadline, tagline, cta e layout (textAlign, overlayOpacity, accentColor, fontWeight).`,
    config: {
      temperature: 0.5,
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
