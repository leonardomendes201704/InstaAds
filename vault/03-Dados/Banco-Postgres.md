---
type: doc
area: dados
tags: [instaads, doc, postgres]
updated: 2026-09-04
---

# Banco PostgreSQL

## Acesso pela aplicação

O app **não** conecta ao Postgres via driver SQL direto. Usa:

1. **Supabase JS client** (`@supabase/supabase-js`) com **service role key**
2. URL aponta para **PostgREST** (API REST sobre Postgres)

Em produção: `SUPABASE_URL=http://rest:3000` (nginx → PostgREST → Postgres).

Código: [`lib/supabase/server.ts`](../../lib/supabase/server.ts)

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. O app usa **service role**, que bypassa RLS — acesso controlado no código da aplicação (Auth.js + admin cookie).

## Tabelas principais

### Core (migration 001)

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Usuários Google (id = sub OAuth) |
| `generations` | Metadados de cada geração de anúncio |
| `activity_events` | Log de login, geração, bloqueio |

### Billing (migration 002)

| Tabela | Descrição |
|--------|-----------|
| `plans` | Free, Pro, Business |
| `subscriptions` | Assinaturas Stripe |
| `usage_counters` | Gerações por user/mês |
| `promotions` | Cupons de desconto |
| `promotion_redemptions` | Uso de cupons |
| `platform_settings` | Chaves Stripe, Resend, etc. |
| `email_log` | Histórico de e-mails |

### Device limits (migration 003)

| Tabela | Descrição |
|--------|-----------|
| `device_usage` | Contador por device/mês |
| `device_users` | Contas associadas a um device |
| `device_whitelist` | Usuários isentos de limite device |
| `device_access_requests` | Solicitações de liberação |

## Camada de acesso (`lib/db/`)

| Módulo | Responsabilidade |
|--------|------------------|
| `profiles.ts` | CRUD perfis, bloqueio, signed URLs |
| `generations.ts` | Salvar/listar gerações, stats dashboard |
| `plans.ts` | Planos, assign default Free |
| `activity.ts` | Eventos de atividade |
| `settings.ts` | platform_settings |
| `promotions.ts` | Cupons |
| `device-*.ts` | Limites e whitelist |

## Índices relevantes

- `generations (user_id, created_at DESC)` — histórico por usuário
- `usage_counters (user_id, period_start)` PK — quota mensal
- `device_usage (device_id, period_start)` PK — quota device

Ver [[Migrations]] para DDL completo.

## Relacionado

- [[Storage-MinIO]] — binários (fotos/artes) fora do Postgres
- [[Migrations]]
