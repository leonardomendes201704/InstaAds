---
type: doc
area: operacoes
tags: [instaads, doc, deploy]
updated: 2026-09-04
---

# Deploy manual

Use quando CI/CD falhar ou for necessário deploy urgente fora do GitHub Actions.

## Pré-requisitos na VPS

- Docker + Docker Compose
- Código em `/opt/instaads` (ou sincronizar manualmente)
- `deploy/.env` configurado
- Runner GitHub opcional para CI

## Deploy via script (igual ao CI)

Na VPS, com código atualizado:

```bash
cd /opt/instaads
bash deploy/deploy.sh
```

O script:

1. rsync de `$SOURCE_DIR` → `/opt/instaads` (quando rodado pelo Actions, source é checkout)
2. `docker compose up -d --build app`

## Deploy manual passo a passo

```bash
# 1. Atualizar código
cd /opt/instaads
git pull origin main   # ou rsync/scp

# 2. Rebuild app
cd deploy
docker compose up -d --build app

# 3. Verificar
docker compose ps
docker compose logs -f app --tail 100
curl -I https://insta-ads.online
```

## Primeira instalação (stack completa)

```bash
cd /opt/instaads/deploy
cp .env.example .env
# editar .env — ver [[Variaveis-Ambiente]]

# Gerar JWT service role
node generate-service-jwt.mjs

docker compose up -d
```

## Instalar GitHub runner (one-time)

```bash
RUNNER_TOKEN=<token> bash deploy/install-runner.sh
```

## O que não precisa redeploy

- Postgres / MinIO / Caddy — sobem uma vez, dados persistem
- Apenas `app` rebuilda a cada deploy de código

## Rollback

```bash
cd /opt/instaads
git checkout <commit-anterior>
cd deploy
docker compose up -d --build app
```

## Relacionado

- [[CI-CD]]
- [[VPS-Hostinger]]
- [[Docker-Compose]]
