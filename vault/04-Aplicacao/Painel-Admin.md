---
type: doc
area: app
tags: [instaads, doc, admin]
updated: 2026-09-04
---

# Painel Admin

## Acesso

- URL: `/admin` (sem link no app público)
- Auth: senha `ADMIN_PASSWORD` → cookie 7 dias
- Layout: sidebar fixa + área principal com scroll independente

## Módulos

### Dashboard (`/admin`)

- KPIs: usuários, gerações, custo IA, hoje, bloqueados
- Gráficos Chart.js: gerações 7 dias, usuários vs gerações
- Atividade recente (com backfill automático)
- Painel migração Vercel Blob (legado)

### Usuários (`/admin/users`)

- Lista paginada, filtros status
- Detalhe: perfil, plano, gerações, bloquear/desbloquear

### Gerações (`/admin/generations`)

- Tabela desktop / cards mobile
- Expandir: copy, custo IA, imagens
- **Lightbox** comparativo original × arte (clique nas miniaturas)

### Atividade (`/admin/activity`)

- Feed de `activity_events`
- Filtro por tipo
- Botão "Reconstruir a partir das gerações"

### Planos (`/admin/plans`)

- CRUD: nome, limite, preço, stripe_price_id, ativo

### Promoções (`/admin/promotions`)

- CRUD cupons

### Configurações (`/admin/settings`)

- Chaves Stripe (secret, publishable, webhook)
- Resend API key, EMAIL_FROM
- Permite operar billing sem redeploy

### E-mails (`/admin/emails`)

- Log de envios (sent/failed/skipped)

### Acesso dispositivo (`/admin/device-access`)

- Solicitações pending → aprovar/rejeitar
- Whitelist manual por e-mail

## APIs

Todas em `/api/admin/*` — ver [[APIs-Referencia#Admin]].

## Mídia privada

Imagens não são URLs públicas. Proxy autenticado:

```
GET /api/admin/media?path={storagePath}
```

Helper: [`lib/admin/generation-media.ts`](../../lib/admin/generation-media.ts)

## Relacionado

- [[Autenticacao#Admin]]
- [[Fluxos-Principais#4. Acesso admin]]
