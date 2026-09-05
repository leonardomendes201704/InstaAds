---
type: doc
area: app
tags: [instaads, doc, rotas]
updated: 2026-09-04
---

# Rotas e páginas

## Públicas / usuário autenticado

| Rota | Auth | Descrição |
|------|------|-----------|
| `/` | Google | Wizard 3 passos ou tela de login |
| `/perfil` | Google | Plano, uso, gerações recentes, lightbox |
| `/planos` | Google | Comparar planos, checkout Stripe |
| `/termos` | Não | Termos de serviço |
| `/privacidade` | Não | Política de privacidade |

## Admin (senha, não Google)

| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard + stats + charts |
| `/admin/users` | Lista usuários |
| `/admin/users/[id]` | Detalhe + bloquear |
| `/admin/generations` | Todas as gerações + lightbox |
| `/admin/activity` | Feed de eventos |
| `/admin/plans` | CRUD planos |
| `/admin/promotions` | Cupons |
| `/admin/settings` | Chaves Stripe, Resend, Gemini |
| `/admin/emails` | Log de e-mails |
| `/admin/device-access` | Whitelist + solicitações |

> Nenhum link para `/admin` no app público — acesso por URL direta.

## Layouts

- `app/layout.tsx` — fontes, metadata, Meta disclaimer
- `app/admin/layout.tsx` — sidebar fixa, scroll independente
- Wizard usa `WizardShell` — header com logo, usage badge, avatar

## Navegação do usuário

- Avatar no header → link para `/perfil`
- `UsageBadge` → link para `/planos` quando quota alta
- Logout via botão no header (perfil e wizard)

## Relacionado

- [[APIs-Referencia]]
- [[Painel-Admin]]
- [[Autenticacao]]
