export type AiCallPurpose = "copy" | "feed-image" | "stories-image";

export interface AiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface AiUsageCall {
  model: string;
  purpose: AiCallPurpose;
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface AiCostEstimate {
  currency: "USD";
  totalUsd: number;
  calls: AiUsageCall[];
  /** Indica que valores são aproximados com base na tabela pública do Google AI. */
  isEstimate: true;
  pricingReference: string;
}

interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

/** Preços aproximados Google AI Studio (USD por 1M tokens). */
const MODEL_PRICING: Record<string, ModelPricing> = {
  "gemini-3.6-flash": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gemini-2.5-flash": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gemini-2.5-flash-image": { inputPer1M: 0.15, outputPer1M: 30 },
};

const DEFAULT_TEXT_PRICING: ModelPricing = {
  inputPer1M: 0.15,
  outputPer1M: 0.6,
};

const DEFAULT_IMAGE_PRICING: ModelPricing = {
  inputPer1M: 0.15,
  outputPer1M: 30,
};

function pricingForModel(model: string): ModelPricing {
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }

  if (model.includes("image")) {
    return DEFAULT_IMAGE_PRICING;
  }

  return DEFAULT_TEXT_PRICING;
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function extractUsageMetadata(response: unknown): AiUsageMetadata | null {
  const usage = (response as { usageMetadata?: AiUsageMetadata }).usageMetadata;
  if (!usage) return null;
  return usage;
}

export function estimateCallCost(input: {
  model: string;
  purpose: AiCallPurpose;
  usage: AiUsageMetadata | null;
}): AiUsageCall {
  const promptTokens = input.usage?.promptTokenCount ?? 0;
  const outputTokens = input.usage?.candidatesTokenCount ?? 0;
  const totalTokens =
    input.usage?.totalTokenCount ?? promptTokens + outputTokens;

  const pricing = pricingForModel(input.model);
  const costUsd = roundUsd(
    (promptTokens / 1_000_000) * pricing.inputPer1M +
      (outputTokens / 1_000_000) * pricing.outputPer1M,
  );

  return {
    model: input.model,
    purpose: input.purpose,
    promptTokens,
    outputTokens,
    totalTokens,
    costUsd,
  };
}

export function buildAiCostEstimate(calls: AiUsageCall[]): AiCostEstimate {
  const totalUsd = roundUsd(
    calls.reduce((sum, call) => sum + call.costUsd, 0),
  );

  return {
    currency: "USD",
    totalUsd,
    calls,
    isEstimate: true,
    pricingReference: "Google AI Studio (aprox., set/2025)",
  };
}
