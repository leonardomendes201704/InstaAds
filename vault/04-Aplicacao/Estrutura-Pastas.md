---
type: doc
area: app
tags: [instaads, doc, codigo]
updated: 2026-09-04
---

# Estrutura de pastas

```
InstaAds/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home — wizard ou login
│   ├── layout.tsx          # Root layout
│   ├── perfil/             # Perfil do usuário
│   ├── planos/             # Upgrade Stripe
│   ├── admin/              # Painel admin (sub-rotas)
│   ├── termos/ privacidade/
│   └── api/                # Route Handlers REST
├── components/
│   ├── wizard/             # Passos 1–3
│   ├── admin/              # UI admin
│   ├── auth/               # Login Google, avatar
│   ├── billing/            # Planos, usage badge
│   ├── profile/            # Página perfil
│   ├── device/             # Sync device, solicitação
│   ├── preview/            # Mockups Instagram
│   ├── brand/ legal/ ui/
├── lib/
│   ├── db/                 # Acesso Postgres
│   ├── billing/            # Quotas
│   ├── device/             # Limites device
│   ├── stripe/             # Checkout, webhook
│   ├── email/              # Resend
│   ├── admin/              # Helpers admin media
│   ├── gemini.ts           # Pipeline IA
│   ├── storage.ts          # Persistência gerações
│   ├── object-storage.ts   # MinIO S3
│   ├── supabase/           # Cliente DB
│   └── admin-auth.ts       # Cookie admin
├── stores/
│   └── wizard-store.ts     # Estado Zustand
├── supabase/migrations/    # DDL SQL
├── deploy/                 # Docker, Caddy, scripts VPS
├── scripts/                # setup, migrate, vault changelog
├── public/                 # Assets estáticos
├── auth.ts                 # Config Auth.js
└── middleware.ts           # Proteção APIs
```

## Convenções

- **Server components** por padrão; `"use client"` onde há interatividade
- **Lógica de negócio** em `lib/`, não nos componentes
- **APIs** finas — validam auth, delegam para `lib/`
- **Tipos** compartilhados em `lib/types.ts`, `lib/db/types.ts`

## Entry points importantes

| Arquivo | Papel |
|---------|-------|
| `auth.ts` | NextAuth config, callbacks profile/plan |
| `middleware.ts` | Guard APIs do wizard |
| `app/api/generate-ad/route.ts` | Core do produto |
| `lib/gemini.ts` | Integração Gemini |

## Relacionado

- [[Rotas-Paginas]]
- [[APIs-Referencia]]
