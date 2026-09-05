---
type: doc
area: infra
tags: [instaads, doc, docker]
updated: 2026-09-04
---

# Docker Compose

Arquivo: [`deploy/docker-compose.yml`](../../deploy/docker-compose.yml)

## Serviços

| Serviço | Imagem | Porta interna | Função |
|---------|--------|---------------|--------|
| `postgres` | postgres:16-alpine | 5432 | Banco principal |
| `postgrest` | postgrest/postgrest:v12.2.8 | 3000 | API REST → SQL |
| `rest` | nginx:1.27-alpine | 80 | Proxy HTTP para PostgREST |
| `minio` | minio/minio | 9000, 9001 | Object storage S3 |
| `minio-init` | minio/mc | — | Cria bucket `generations` (one-shot) |
| `app` | build local (`Dockerfile`) | 3000 | Next.js standalone |
| `caddy` | caddy:2-alpine | 80, 443 | TLS + reverse proxy público |

## Volumes persistentes

| Volume | Dados |
|--------|-------|
| `postgres_data` | Banco PostgreSQL |
| `minio_data` | Arquivos S3 (fotos, artes) |
| `caddy_data` / `caddy_config` | Certificados TLS |

## Init do Postgres

Scripts montados em `/docker-entrypoint-initdb.d/` **apenas na primeira inicialização**:

1. `01_initial.sql` — migration 001
2. `02_billing.sql` — migration 002
3. `03_device_limits.sql` — migration 003
4. `99_postgrest_roles.sql` — roles `anon`, `authenticator`, JWT

> **Atenção:** alterações em migrations existentes não reaplicam automaticamente em DB já criado. Migrations incrementais devem ser rodadas manualmente.

## Rede

Rede bridge `instaads` — comunicação interna entre containers.

## Variáveis do app

O serviço `app` recebe env de `deploy/.env`. Destaques:

- `SUPABASE_URL=http://rest:3000` — PostgREST via nginx interno
- `S3_ENDPOINT=http://minio:9000` — MinIO interno
- `AUTH_URL=https://insta-ads.online`

Lista completa: [[Variaveis-Ambiente]].

## Build da imagem app

[`Dockerfile`](../../Dockerfile):

1. **deps** — `npm ci`
2. **builder** — `npm run build` (Next.js standalone)
3. **runner** — `node server.js` como user `nextjs`

## Comandos úteis (na VPS)

```bash
cd /opt/instaads/deploy

# Status
docker compose ps

# Logs do app
docker compose logs -f app

# Rebuild só o app (igual ao deploy CI)
docker compose up -d --build app

# Stack completa
docker compose up -d
```

## Relacionado

- [[Caddy-TLS]] — entrada pública
- [[CI-CD]] — rebuild automatizado do `app`
