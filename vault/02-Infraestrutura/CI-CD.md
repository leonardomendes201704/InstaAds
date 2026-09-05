---
type: doc
area: infra
tags: [instaads, doc, cicd, deploy]
updated: 2026-09-04
---

# CI/CD

## Pipeline

```mermaid
flowchart LR
  Dev[Push_main] --> GH[GitHub_Actions]
  GH --> Runner[Self_hosted_runner_VPS]
  Runner --> Script[deploy_deploy_sh]
  Script --> Rsync[rsync_opt_instaads]
  Rsync --> Build[docker_compose_build_app]
  Build --> Live[insta_ads_online]
```

## Workflow

Arquivo: [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)

| Config | Valor |
|--------|-------|
| Trigger | `push` na branch `main` |
| Concurrency | `production-deploy` (sem cancelamento) |
| Runner | `[self-hosted, linux, instaads]` |
| Steps | checkout → `bash deploy/deploy.sh` |

## Script de deploy

[`deploy/deploy.sh`](../../deploy/deploy.sh):

1. Valida existência de `/opt/instaads/deploy/.env`
2. **rsync** do código para `/opt/instaads` (exclui `node_modules`, `.git`, `.env`)
3. `docker compose up -d --build app` — rebuild **apenas** o container da aplicação

### O que NÃO é redeployado

- Postgres (dados persistem no volume)
- MinIO (arquivos persistem)
- Caddy (certificados persistem)
- PostgREST/nginx

Isso torna deploys rápidos (~1 min) e seguros para dados.

## Instalar o runner (one-time)

```bash
RUNNER_TOKEN=<token_do_github> bash deploy/install-runner.sh
```

Token obtido em: GitHub → Repo → Settings → Actions → Runners → New self-hosted runner.

## Deploy manual

Se o CI falhar, ver [[Deploy-Manual]].

## Relacionado

- [[VPS-Hostinger]] — paths e runner
- [[Docker-Compose]] — serviço `app`
