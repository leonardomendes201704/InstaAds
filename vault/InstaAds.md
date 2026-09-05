---
type: moc
tags: [instaads, home]
updated: 2026-09-04
---

# InstaAds — Documentação de Engenharia

Vault Obsidian do projeto **InstaAds**: gerador mobile-first de artes publicitárias para Instagram com IA (Google Gemini).

| | |
|---|---|
| **Produção** | https://insta-ads.online |
| **Repositório** | https://github.com/leonardomendes201704/InstaAds |
| **Stack** | Next.js 16 · Auth.js · Postgres · MinIO · Docker · Caddy |

---

## Comece aqui

- [[Onboarding-Dev]] — checklist para novo desenvolvedor
- [[Visao-Geral]] — o que é o produto e para quem

---

## 01 — Arquitetura

- [[Visao-Geral]]
- [[Stack-Tecnologica]]
- [[Diagrama-Sistema]]
- [[Fluxos-Principais]]

---

## 02 — Infraestrutura

- [[VPS-Hostinger]]
- [[Docker-Compose]]
- [[Caddy-TLS]]
- [[CI-CD]]
- [[Variaveis-Ambiente]]

---

## 03 — Dados

- [[Banco-Postgres]]
- [[Migrations]]
- [[Storage-MinIO]]

---

## 04 — Aplicação

- [[Estrutura-Pastas]]
- [[Rotas-Paginas]]
- [[APIs-Referencia]]
- [[Autenticacao]]
- [[Pipeline-IA]]
- [[Billing-Planos]]
- [[Painel-Admin]]

---

## 05 — Operações

- [[Desenvolvimento-Local]]
- [[Deploy-Manual]]
- [[Troubleshooting]]

---

## Histórico

- [[Timeline]] — linha do tempo de commits (25 no repositório)
- **Fases:** [[01-mvp-wizard]] · [[02-gemini-ia]] · [[03-armazenamento]] · [[04-admin-auth]] · [[05-supabase]] · [[06-billing]] · [[07-perfil-usuario]] · [[08-vps-deploy]]

> Commits individuais em `Historico/Commits/` (ex.: `001-bdc97fa`). Regenerar com `npm run vault:changelog`.

---

## Manutenção deste vault

| Tipo | Como atualizar |
|------|----------------|
| Docs de engenharia (`01`–`05`) | Editar `.md` manualmente no Obsidian |
| Changelog (`Historico/`) | `npm run vault:changelog` |

Ver [[README]].
