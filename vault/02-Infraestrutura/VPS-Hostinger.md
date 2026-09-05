---
type: doc
area: infra
tags: [instaads, doc, vps]
updated: 2026-09-04
---

# VPS Hostinger

## Visão geral

O InstaAds roda em **VPS self-hosted** (Hostinger), substituindo o deploy anterior na Vercel. Toda a stack (app + banco + storage + proxy) vive na mesma máquina via Docker Compose.

## Paths importantes

| Path | Conteúdo |
|------|----------|
| `/opt/instaads` | Código sincronizado do repositório (destino do deploy) |
| `/opt/instaads/deploy/.env` | Variáveis de produção (**não versionado**) |
| `/opt/actions-runner` | GitHub Actions self-hosted runner |

## GitHub Actions runner

Instalado via `deploy/install-runner.sh`:

- Usuário: `github-runner` (membro do grupo `docker`)
- Labels: `self-hosted`, `linux`, `instaads`
- Nome: `vps-instaads`
- Repo: `leonardomendes201704/InstaAds`

O workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) usa `runs-on: [self-hosted, linux, instaads]`.

## Domínio

- **Produção:** https://insta-ads.online (e www)
- TLS gerenciado pelo Caddy (Let's Encrypt automático)

## OAuth Google

Redirect URI de produção deve incluir:

```
https://insta-ads.online/api/auth/callback/google
```

Configurar em Google Cloud Console → OAuth Client (Web).

## Acesso SSH

Operações manuais (logs, debug) via SSH na VPS. Ver [[Deploy-Manual]] e [[Troubleshooting]].

## Relacionado

- [[Docker-Compose]] — serviços na VPS
- [[CI-CD]] — pipeline de deploy
- [[Variaveis-Ambiente]] — `deploy/.env`
