import OpenAI from "openai";
import type { AdCategory, AdStyle, GeneratedAdCopy, PublishTarget } from "@/lib/types";
import {
  categoryLabels,
  publishLabels,
  styleLabels,
} from "@/lib/ad-styles";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada.");
  }
  return new OpenAI({ apiKey });
}

export async function suggestAdMessage(input: {
  adStyle: AdStyle;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
}): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content:
          "Você cria frases curtas de anúncio para Instagram em português do Brasil. Responda apenas com a frase, sem aspas.",
      },
      {
        role: "user",
        content: `Crie uma mensagem principal curta (máx. 60 caracteres) para anunciar um ${categoryLabels[input.adCategory]} com estilo ${styleLabels[input.adStyle]} para ${publishLabels[input.publishTarget]}.`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "Nova coleção com até 30% OFF";
}

export async function generateAdCopy(input: {
  mainMessage: string;
  adStyle: AdStyle;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
}): Promise<GeneratedAdCopy> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Retorne JSON com: headline, subheadline, tagline, cta, layout.
layout deve conter textAlign ("left"|"center"|"right"), overlayOpacity (0.2-0.5), accentColor (hex), fontWeight ("normal"|"bold").
Textos em português do Brasil, curtos e prontos para anúncio Instagram.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          mainMessage: input.mainMessage,
          category: categoryLabels[input.adCategory],
          style: styleLabels[input.adStyle],
          publishTarget: publishLabels[input.publishTarget],
        }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Resposta vazia da OpenAI.");
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
