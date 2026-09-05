---
type: doc
area: app
tags: [instaads, doc, auth]
updated: 2026-09-04
---

# Autenticação

## Usuários — Auth.js (next-auth v5)

Config: [`auth.ts`](../../auth.ts)

| Aspecto | Detalhe |
|---------|---------|
| Provider | Google OAuth |
| Sessão | JWT (`strategy: "jwt"`) |
| Página login | `/` (custom gate `GoogleSignInGate`) |
| ID do usuário | Google `sub` / `providerAccountId` |

### ID estável na VPS

Função `resolveOAuthUserId()` garante que `token.sub` e `session.user.id` usem sempre o **Google subject ID**, não um ID interno aleatório do Auth.js. Crítico para consistência de `profiles.id` após migração Vercel → VPS.

### Callbacks

1. **jwt** — define `sub` estável
2. **session** — expõe user id/email/name/image
3. **signIn** — upsert profile, plano Free default, welcome email, activity log

### Middleware

[`middleware.ts`](../../middleware.ts) — wrapper `auth()` protege APIs do wizard (401 se sem sessão).

### Variáveis

```env
AUTH_SECRET=...
AUTH_URL=https://insta-ads.online   # ou localhost em dev
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Redirect URIs no Google Cloud Console devem bater com `AUTH_URL`.

---

## Admin — cookie assinado

Módulo: [`lib/admin-auth.ts`](../../lib/admin-auth.ts)

| Aspecto | Detalhe |
|---------|---------|
| Cookie | `instaads_admin` |
| TTL | 7 dias |
| Assinatura | HMAC-SHA256 com `ADMIN_PASSWORD` |
| Login | `POST /api/admin/login` { password } |

`requireAdminSession()` usado em todas as rotas `/api/admin/*`.

**Separado** do login Google — admin é operacional interno.

---

## Usuário bloqueado

`profiles.status = 'blocked'` → `requireCurrentUser()` lança `UserBlockedError` → APIs retornam erro.

Admin bloqueia via `/admin/users/[id]`.

## Relacionado

- [[Fluxos-Principais#2. Login Google]]
- [[Variaveis-Ambiente]]
- [[Painel-Admin]]
