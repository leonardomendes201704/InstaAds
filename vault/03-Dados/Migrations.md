---
type: doc
area: dados
tags: [instaads, doc, migrations]
updated: 2026-09-04
---

# Migrations SQL

Arquivos em [`supabase/migrations/`](../../supabase/migrations/)

## 001_initial.sql — Core

**Quando:** Fase Supabase (substitui metadata-only no Blob)

| Objeto | Descrição |
|--------|-----------|
| `profile_status` enum | `active`, `blocked` |
| `profiles` | id (Google sub), email, name, image, status, blocked_* |
| `generations` | Metadados completos da geração + paths storage + `ai_cost` JSONB |
| `activity_events` | type + metadata JSONB |

Índices em `generations.created_at` e `(user_id, created_at)`.

---

## 002_billing.sql — Planos e monetização

| Objeto | Descrição |
|--------|-----------|
| `profiles.plan_id` | FK → plans |
| `profiles.stripe_customer_id` | Cliente Stripe |
| `plans` | Slug, limites, preço, stripe_price_id |
| `subscriptions` | Estado Stripe |
| `usage_counters` | Contagem mensal por usuário |
| `promotions` / `promotion_redemptions` | Cupons |
| `platform_settings` | KV config (Stripe keys, etc.) |
| `email_log` | Auditoria de e-mails |

**Seed planos:**

| slug | Limite/mês | Preço |
|------|------------|-------|
| free | 5 | R$ 0 |
| pro | 50 | R$ 49 |
| business | 200 | R$ 149 |

---

## 003_device_limits.sql — Anti-abuso Free

| Objeto | Descrição |
|--------|-----------|
| `device_usage` | Gerações por device/mês |
| `device_users` | Mapeamento device ↔ contas |
| `device_whitelist` | Bypass por user_id |
| `device_access_requests` | Fila pending/approved/rejected |

Unique parcial: uma solicitação pending por (device_id, user_id).

---

## Aplicação das migrations

### Docker (primeira subida)

Montadas em `docker-entrypoint-initdb.d/` — rodam **uma vez** ao criar volume Postgres.

### Supabase cloud / manual

```bash
npm run setup:supabase
```

Ou colar SQL no Supabase SQL Editor.

### Migration incremental em DB existente

Rodar SQL manualmente no editor — init scripts Docker **não** reexecutam.

---

## PostgREST roles

[`deploy/postgres/init/99_postgrest_roles.sql`](../../deploy/postgres/init/99_postgrest_roles.sql):

- Role `anon` — leitura pública (não usada pelo app diretamente)
- Role `authenticator` — conexão PostgREST
- JWT alinhado com `JWT_SECRET` e `SUPABASE_SERVICE_ROLE_KEY`

## Relacionado

- [[Banco-Postgres]]
- [[Docker-Compose#Init do Postgres]]
