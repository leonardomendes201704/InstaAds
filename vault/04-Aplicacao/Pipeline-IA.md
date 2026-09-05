---
type: doc
area: app
tags: [instaads, doc, ia, gemini]
updated: 2026-09-04
---

# Pipeline de IA (Gemini)

## Visão geral

Geração em **duas etapas** para evitar textos inventados/errados na arte:

1. **Texto** — modelo de linguagem gera copy PT-BR estruturada
2. **Imagem** — modelo de imagem renderiza arte com textos **exatos** fornecidos

Código central: [`lib/gemini.ts`](../../lib/gemini.ts)

## Modelos

| Variável | Padrão | Etapa |
|----------|--------|-------|
| `GEMINI_TEXT_MODEL` | `gemini-3.6-flash` | Copy JSON |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` | Arte feed/stories |

API key: `GOOGLE_AI_API_KEY` (Google AI Studio).

## Etapa 1 — Copy

- Input: foto produto (base64) + estilo + mensagem opcional do usuário
- Output JSON: `headline`, `subheadline`, `benefits[3]`, `cta`
- Regras: apenas PT-BR, ortografia correta, limites de caracteres

## Etapa 2 — Arte

- Input: foto + prompt de [`lib/ad-prompt.ts`](../../lib/ad-prompt.ts) com textos fixos
- Output: imagem PNG (feed 4:5, stories 9:16 se aplicável)
- Proibido: labels "HEADLINE", inglês, textos inventados

## Pré-processamento

[`lib/image-utils.ts`](../../lib/image-utils.ts) — redimensiona/comprime foto antes do envio (limite payload).

## Custos

[`lib/ai-cost.ts`](../../lib/ai-cost.ts) — estima USD por tokens/chamada.

Salvo em `generations.ai_cost` JSONB:

```json
{
  "textUsd": 0.001,
  "imageUsd": 0.02,
  "totalUsd": 0.021
}
```

Visível no admin por geração e agregado no dashboard.

## API route

[`app/api/generate-ad/route.ts`](../../app/api/generate-ad/route.ts):

- `maxDuration = 120`
- Ordem: auth → device → quota → Gemini → storage → increment counters

## Sugestão parcial de texto

`POST /api/suggest-text` — usa só modelo de texto para autocomplete no passo 2.

## Relacionado

- [[Fluxos-Principais#1. Gerar anúncio]]
- [[Storage-MinIO]]
- [[Troubleshooting#Gemini timeout]]
