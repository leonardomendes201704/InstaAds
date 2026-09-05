---
type: doc
area: arquitetura
tags: [instaads, doc, stack]
updated: 2026-09-04
---

# Stack tecnológica

## Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 16.x | App Router, SSR, API Routes |
| **React** | 19.x | UI |
| **Tailwind CSS** | 4.x | Estilos mobile-first |
| **Zustand** | 5.x | Estado do wizard (`stores/wizard-store.ts`) |
| **Chart.js** | 4.x | Gráficos do dashboard admin |
| **Lucide** | — | Ícones |

## Backend (dentro do Next.js)

| Tecnologia | Uso |
|------------|-----|
| **Next.js Route Handlers** | APIs em `app/api/` |
| **Auth.js (next-auth)** | OAuth Google, sessão JWT |
| **@supabase/supabase-js** | Cliente Postgres via PostgREST (service role) |
| **@aws-sdk/client-s3** | MinIO (S3-compatible) em produção |
| **Stripe** | Checkout, portal, webhooks |
| **@google/genai** | Gemini (texto + imagem) |

## Dados e storage

| Componente | Produção | Desenvolvimento típico |
|------------|----------|------------------------|
| **PostgreSQL 16** | Container Docker | Supabase cloud ou local |
| **PostgREST** | API REST compatível Supabase | Idem |
| **MinIO** | Object storage S3 | Supabase Storage ou Vercel Blob (legado) |

## Infraestrutura (produção)

| Componente | Função |
|------------|--------|
| **Docker Compose** | Orquestra todos os serviços na VPS |
| **Caddy** | TLS automático + reverse proxy |
| **GitHub Actions** | Deploy em push para `main` |
| **Self-hosted runner** | Executa deploy na própria VPS |

## IA

| Variável | Padrão | Função |
|----------|--------|--------|
| `GEMINI_TEXT_MODEL` | `gemini-3.6-flash` | Copy PT-BR (headline, benefícios, CTA) |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` | Arte publicitária com foto do produto |

Ver [[Pipeline-IA]].

## E-mail (opcional)

- **Resend** — boas-vindas, quota atingida, falha de pagamento
- Configurável via env ou `/admin/settings`

## Legado

- **@vercel/blob** — usado na fase Vercel; migração para Supabase/MinIO documentada em [[Migrations]]
- Scripts em `scripts/migrate-blob-to-supabase.ts` e painel admin

## Referências no código

- `package.json` — dependências
- `Dockerfile` — build multi-stage Next.js standalone
- `deploy/docker-compose.yml` — stack completa
