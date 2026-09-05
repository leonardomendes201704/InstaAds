---
type: doc
area: operacoes
tags: [instaads, doc, dev]
updated: 2026-09-04
---

# Desenvolvimento local

## Pré-requisitos

- Node.js 20+
- npm
- Conta Google Cloud (OAuth) e Google AI Studio (Gemini)
- Postgres acessível (Supabase cloud recomendado para dev)

## Setup

```bash
git clone https://github.com/leonardomendes201704/InstaAds.git
cd InstaAds
npm install
cp .env.local.example .env.local
```

Edite `.env.local` — ver [[Variaveis-Ambiente]].

## Banco de dados

### Opção A — Supabase cloud

1. Crie projeto em supabase.com
2. Rode migrations em SQL Editor (`001`, `002`, `003`)
3. Ou: `npm run setup:supabase`
4. Configure `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

### Opção B — Docker local (stack completa)

```bash
cd deploy
cp .env.example .env
# preencher .env
docker compose up -d
```

App local apontando para containers — ajuste URLs no `.env.local`.

## OAuth Google (dev)

Google Cloud Console → OAuth Client:

- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- `AUTH_URL=http://localhost:3000`

## Rodar

```bash
npm run dev
```

Abra http://localhost:3000

## Admin local

Defina `ADMIN_PASSWORD` no `.env.local` → acesse http://localhost:3000/admin

## Scripts úteis

| Comando | Função |
|---------|--------|
| `npm run build` | Build produção |
| `npm run lint` | ESLint |
| `npm run setup:supabase` | Setup bucket/policies Supabase |
| `npm run migrate:blob` | Migração one-time Vercel Blob |
| `npm run vault:changelog` | Regenera histórico no Obsidian vault |

## Relacionado

- [[Onboarding-Dev]]
- [[Variaveis-Ambiente]]
- [[Troubleshooting]]
