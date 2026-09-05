---
type: doc
area: app
tags: [instaads, doc, api]
updated: 2026-09-04
---

# Referência de APIs

Base: `/api`. Formato JSON salvo indicação.

## Auth

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| * | `/api/auth/[...nextauth]` | — | Auth.js handlers (Google OAuth) |

## Wizard e gerações

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/generate-ad` | Google | Gera arte (Gemini + storage) |
| POST | `/api/suggest-text` | Google | Sugere copy parcial |
| GET | `/api/generations` | Google | Histórico do usuário logado |

## Usuário

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/user/profile` | Google | Perfil + billing + gerações recentes |
| GET | `/api/user/media?path=` | Google | Proxy mídia própria |

## Billing

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/billing/usage` | Google | Plano, uso, lista planos |
| POST | `/api/billing/checkout` | Google | Cria sessão Stripe |
| POST | `/api/billing/portal` | Google | Portal Stripe (gerenciar assinatura) |

## Device

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/device/sync` | Google | Registra device_id |
| GET/POST | `/api/device/access-request` | Google | Solicitar/liberar acesso |

Header/cookie: `x-device-id` ou `instaads_did`.

## Stripe

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/stripe/webhook` | Stripe signature | Eventos subscription/payment |

## Admin

Todas exigem cookie `instaads_admin` (exceto login).

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/admin/login` | Autentica admin |
| POST | `/api/admin/logout` | Remove cookie |
| GET | `/api/admin/stats` | Dashboard KPIs |
| GET | `/api/admin/generations` | Lista paginada |
| GET | `/api/admin/media?path=` | Proxy mídia privada |
| GET | `/api/admin/users` | Lista usuários |
| GET | `/api/admin/users/[id]` | Detalhe usuário |
| POST | `/api/admin/users/[id]/block` | Bloquear |
| POST | `/api/admin/users/[id]/unblock` | Desbloquear |
| GET | `/api/admin/activity` | Eventos |
| POST | `/api/admin/backfill-activity` | Reconstruir eventos |
| GET/POST | `/api/admin/plans` | CRUD planos |
| GET/POST | `/api/admin/promotions` | CRUD promoções |
| GET/PATCH | `/api/admin/settings` | Config plataforma |
| GET | `/api/admin/emails` | Log e-mails |
| GET/PATCH | `/api/admin/device-requests` | Solicitações device |
| GET/POST/DELETE | `/api/admin/device-whitelist` | Whitelist |
| POST | `/api/admin/migrate-blob` | Migração Vercel Blob |

## Middleware protegido

[`middleware.ts`](../../middleware.ts) exige sessão Google em:

- `/api/generate-ad`
- `/api/generations`
- `/api/suggest-text`
- `/api/device/sync`
- `/api/device/access-request`

## Relacionado

- [[Autenticacao]]
- [[Painel-Admin]]
- [[Fluxos-Principais]]
