---
type: doc
area: app
tags: [instaads, doc, billing, stripe]
updated: 2026-09-04
---

# Billing e planos

## Planos (seed)

| Slug | Nome | Limite/mês | Preço |
|------|------|------------|-------|
| `free` | Free | 5 | R$ 0 |
| `pro` | Pro | 50 | R$ 49 |
| `business` | Business | 200 | R$ 149 |

Editáveis em `/admin/plans` (limites, preços, `stripe_price_id`).

## Quota por usuário

Módulo: [`lib/billing/usage.ts`](../../lib/billing/usage.ts)

- Período: mês calendário (`YYYY-MM-01`)
- Tabela: `usage_counters`
- `assertCanGenerate()` — lança `QuotaExceededError` se `usage >= limit`
- Após geração: `incrementGenerationUsage()`

UI: `UsageBadge` no wizard → link `/planos`.

## Stripe

| Peça | Arquivo |
|------|---------|
| Checkout | `lib/stripe/checkout.ts` → `POST /api/billing/checkout` |
| Portal | `POST /api/billing/portal` |
| Webhook | `app/api/stripe/webhook/route.ts` |

Eventos tratados: checkout completed, subscription updated/deleted, invoice payment failed.

Chaves: env **ou** `platform_settings` via `/admin/settings`.

## Promoções

Tabela `promotions` — cupons percent/fixed, validade, max redemptions.

Admin: `/admin/promotions`. Integração Stripe promotion codes opcional.

## Device limits (plano Free)

Módulo: [`lib/device/limits.ts`](../../lib/device/limits.ts)

Regras para usuários **Free não whitelist**:

1. **Uma conta por dispositivo** — segunda conta Google no mesmo aparelho bloqueada
2. **5 gerações/mês por dispositivo** — pool compartilhado no aparelho

Planos pagos: ignoram limite de device (só quota do plano).

### Whitelist e solicitações

- Usuário bloqueado → botão "Solicitar acesso" no wizard
- Admin → `/admin/device-access` → aprovar (entra na whitelist) ou rejeitar

Cookie/header: `instaads_did` (UUID v4).

Ver migration [[Migrations#003_device_limits.sql]].

## E-mails (Resend)

Opcional — [`lib/email/send.ts`](../../lib/email/send.ts):

- Boas-vindas no primeiro login
- Quota atingida
- Falha de pagamento

Log em `email_log` — visível em `/admin/emails`.

## Relacionado

- [[Fluxos-Principais#3. Upgrade de plano]]
- [[Rotas-Paginas#/planos]]
- [[Variaveis-Ambiente]]
