---
type: doc
area: arquitetura
tags: [instaads, doc, produto]
updated: 2026-09-04
---

# Visão geral

## O que é

**InstaAds** é uma aplicação web **mobile-first** que permite a qualquer pessoa criar **artes publicitárias para Instagram** a partir de uma foto de produto. A IA (Google Gemini) gera copy em português e compõe a arte visual completa — fundo, textos, CTA e layout profissional.

## Para quem

- Criadores de conteúdo e pequenos negócios que anunciam no Instagram
- Usuários finais acessam via login Google; não há app nativo

## Fluxo do usuário (resumo)

1. **Login** com conta Google
2. **Passo 1** — upload da foto do produto
3. **Passo 2** — escolher estilo e mensagem opcional; IA sugere textos
4. **Passo 3** — preview no mockup Instagram, download da arte

## Planos e limites

| Plano | Preço | Gerações/mês |
|-------|-------|--------------|
| Free | R$ 0 | 5 (por dispositivo no Free) |
| Pro | R$ 49 | 50 |
| Business | R$ 149 | 200 |

Upgrade via Stripe em [[Rotas-Paginas#Planos|/planos]].

## Admin interno

Painel em `/admin` (sem link no app público): métricas, usuários, gerações, planos, configurações Stripe, whitelist de dispositivos. Ver [[Painel-Admin]].

## Ambientes

| Ambiente | URL | Hospedagem |
|----------|-----|------------|
| Produção | https://insta-ads.online | VPS Hostinger (Docker) |
| Desenvolvimento | http://localhost:3000 | máquina local |

## Repositório

- GitHub: https://github.com/leonardomendes201704/InstaAds
- Branch principal: `main` (deploy automático na VPS)

## Próximos passos na documentação

- [[Stack-Tecnologica]] — tecnologias usadas
- [[Diagrama-Sistema]] — componentes e integrações
- [[Fluxos-Principais]] — sequências detalhadas
