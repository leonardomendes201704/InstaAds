---
type: doc
area: arquitetura
tags: [instaads, doc, diagrama]
updated: 2026-09-04
---

# Diagrama do sistema

## Visão de produção (VPS)

```mermaid
flowchart TB
  subgraph client [Cliente]
    Browser[Browser_Mobile]
  end

  subgraph vps [VPS_Hostinger]
    Caddy[Caddy_TLS_443]
    App[Nextjs_App_3000]

    subgraph data [Camada_de_Dados]
      REST[nginx_rest]
      PGR[PostgREST]
      PG[(Postgres_16)]
      MinIO[(MinIO_S3)]
    end
  end

  subgraph external [Servicos_Externos]
    Google[Google_OAuth_e_Gemini]
    Stripe[Stripe]
    Resend[Resend]
  end

  Browser -->|HTTPS| Caddy
  Caddy --> App
  App -->|SUPABASE_URL| REST
  REST --> PGR
  PGR --> PG
  App -->|S3_ENDPOINT| MinIO
  App --> Google
  App --> Stripe
  App --> Resend
```

## Camadas lógicas

```mermaid
flowchart LR
  subgraph presentation [Apresentacao]
    Pages[app_pages]
    Components[components]
  end

  subgraph api [API_Routes]
    UserAPI[user_billing_device]
    AdminAPI[admin]
    Webhook[stripe_webhook]
  end

  subgraph domain [Dominio_lib]
    Gemini[lib_gemini]
    Billing[lib_billing]
    Device[lib_device]
    DB[lib_db]
    Storage[lib_storage]
  end

  Pages --> UserAPI
  Pages --> AdminAPI
  UserAPI --> domain
  AdminAPI --> domain
  Webhook --> Billing
```

## Onde cada dado vive

| Dado | Armazenamento | Acesso |
|------|---------------|--------|
| Perfis, planos, gerações (metadata) | Postgres | `lib/db/*` via Supabase client |
| Fotos e artes (binários) | MinIO bucket `generations` | `lib/object-storage.ts` |
| Sessão usuário | Cookie JWT (Auth.js) | `auth.ts` |
| Sessão admin | Cookie assinado HMAC | `lib/admin-auth.ts` |
| Config Stripe/Resend | `platform_settings` ou env | `lib/db/settings.ts` |

## Rede Docker

Todos os serviços compartilham a rede bridge `instaads`. Apenas **Caddy** expõe portas 80/443 para a internet. O app Next.js **não** é exposto diretamente.

Ver [[Docker-Compose]] e [[Caddy-TLS]].
