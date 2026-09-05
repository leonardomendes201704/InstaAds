---
type: doc
area: operacoes
tags: [instaads, doc, troubleshooting]
updated: 2026-09-04
---

# Troubleshooting

## OAuth Google

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `redirect_uri_mismatch` | URI não cadastrada | Adicionar `{AUTH_URL}/api/auth/callback/google` no Google Console |
| Login ok mas perfil vazio | Supabase não configurado | Verificar `SUPABASE_*` env |
| IDs de usuário inconsistentes | Auth.js ID vs Google sub | Já corrigido em `auth.ts` — usar `providerAccountId` |

## Geração de anúncio

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Timeout / 504 | Gemini lento (>60s) | VPS sem limite 10s da Vercel; verificar `maxDuration=120` |
| `GOOGLE_AI_API_KEY` inválida | Key ausente/errada | AI Studio → nova key → env/admin |
| Textos em inglês na arte | Pipeline antigo | Confirmar etapa copy antes de imagem ([[Pipeline-IA]]) |
| Quota exceeded | Limite mensal | Upgrade em `/planos` ou aguardar próximo mês |
| Device blocked | Multi-conta Free | Solicitar acesso ou whitelist admin |

## Storage

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Imagens não carregam admin | Path errado / MinIO down | `docker compose logs minio`; testar signed URL |
| Upload falha silencioso (legado Vercel) | Blob private vs public | Já migrado — usar MinIO/S3 |

## Stripe

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Checkout 503 | Stripe não configurado | `/admin/settings` ou env keys |
| Webhook não atualiza plano | URL/secret errados | Stripe Dashboard → webhook → `https://insta-ads.online/api/stripe/webhook` |
| Conta Stripe pendente verificação | KYC incompleto | Modo teste funciona; produção após verificação |

## Deploy / VPS

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| CI não dispara | Runner offline | `deploy/install-runner.sh`; verificar serviço runner |
| Build Docker falha | deps/node | Logs `docker compose build app` |
| 502 Bad Gateway | App container down | `docker compose ps`; `logs app` |
| Certificado TLS | Caddy/DNS | Verificar DNS → IP VPS; logs `docker compose logs caddy` |

## Postgres

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Tabela não existe | Migration não aplicada | Rodar SQL manual em DB existente |
| PostgREST 401 | JWT mismatch | Alinhar `JWT_SECRET` e service role key |

## Logs úteis

```bash
cd /opt/instaads/deploy
docker compose logs -f app
docker compose logs -f caddy
docker compose logs -f postgres
```

## Relacionado

- [[Desenvolvimento-Local]]
- [[Deploy-Manual]]
- [[CI-CD]]
