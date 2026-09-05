---
type: doc
area: infra
tags: [instaads, doc, env]
updated: 2026-09-04
---

# Variáveis de ambiente

> **Nunca** commitar valores reais. Use os exemplos versionados.

## Produção — `deploy/.env`

Template: [`deploy/.env.example`](../../deploy/.env.example)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `POSTGRES_PASSWORD` | Sim | Senha do Postgres |
| `JWT_SECRET` | Sim | Secret PostgREST (32+ chars) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | JWT service role (gerar com `deploy/generate-service-jwt.mjs`) |
| `S3_ACCESS_KEY` | Sim | MinIO access key |
| `S3_SECRET_KEY` | Sim | MinIO secret key |
| `AUTH_URL` | Sim | `https://insta-ads.online` |
| `AUTH_SECRET` | Sim | Secret Auth.js (`openssl rand -base64 32`) |
| `ADMIN_PASSWORD` | Sim | Senha do painel `/admin` |
| `AUTH_GOOGLE_ID` | Sim* | OAuth Google client ID |
| `AUTH_GOOGLE_SECRET` | Sim* | OAuth Google client secret |
| `GOOGLE_AI_API_KEY` | Sim* | Google AI Studio (Gemini) — ou via admin |
| `GEMINI_TEXT_MODEL` | Não | Padrão: `gemini-3.6-flash` — ou via admin |
| `GEMINI_IMAGE_MODEL` | Não | Padrão: `gemini-2.5-flash-image` — ou via admin |
| `STRIPE_SECRET_KEY` | Não | Stripe (ou via admin) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Não | Stripe publishable |
| `STRIPE_WEBHOOK_SECRET` | Não | Webhook Stripe |
| `RESEND_API_KEY` | Não | E-mails transacionais |
| `EMAIL_FROM` | Não | Remetente dos e-mails |

\*Obrigatório para funcionalidade completa em produção.

### Variáveis injetadas pelo Compose (app)

Definidas em `docker-compose.yml`, não no `.env`:

- `SUPABASE_URL=http://rest:3000`
- `S3_ENDPOINT=http://minio:9000`
- `S3_REGION=us-east-1`
- `NODE_ENV=production`

## Desenvolvimento — `.env.local`

Template: [`.env.local.example`](../../.env.local.example)

Diferenças típicas vs produção:

| Variável | Dev |
|----------|-----|
| `AUTH_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase cloud ou local |
| `SUPABASE_SERVICE_ROLE_KEY` | Key do projeto dev |

Redirect OAuth dev:

```
http://localhost:3000/api/auth/callback/google
```

## Configuração via admin

Chaves Stripe, Resend e Google AI também podem ser salvas em `platform_settings` pelo painel `/admin/settings`, sobrescrevendo env quando configuradas.

| Seção do admin | Chaves em `platform_settings` |
|----------------|-------------------------------|
| Stripe | `stripe_secret_key`, `stripe_publishable_key`, `stripe_webhook_secret` |
| E-mail (Resend) | `resend_api_key`, `email_from` |
| Google AI (Gemini) | `google_ai_api_key`, `gemini_text_model`, `gemini_image_model` |

Valores salvos no banco valem imediatamente, sem redeploy do container. Campo em branco no formulário mantém o valor atual.

## Gerar JWT service role

```bash
node deploy/generate-service-jwt.mjs
```

Usar output em `SUPABASE_SERVICE_ROLE_KEY` e alinhar `JWT_SECRET` com PostgREST.

## Relacionado

- [[Desenvolvimento-Local]]
- [[Docker-Compose]]
