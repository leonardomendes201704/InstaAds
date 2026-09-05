---
type: doc
area: operacoes
tags: [instaads, doc, onboarding]
updated: 2026-09-04
---

# Onboarding — novo desenvolvedor

Checklist para entender e rodar o InstaAds do zero.

## 1. Contexto do produto (15 min)

- [ ] Ler [[Visao-Geral]]
- [ ] Ver [[Diagrama-Sistema]]
- [ ] Percorrer [[Fluxos-Principais]] — especialmente "Gerar anúncio"

## 2. Stack (10 min)

- [ ] [[Stack-Tecnologica]]
- [ ] [[Estrutura-Pastas]] — onde encontrar código

## 3. Ambiente local (30 min)

- [ ] Clonar repo e `npm install`
- [ ] Copiar `.env.local.example` → `.env.local`
- [ ] Configurar Google OAuth + Gemini + Supabase
- [ ] Seguir [[Desenvolvimento-Local]]
- [ ] `npm run dev` → login → gerar um anúncio teste

## 4. Admin e dados (15 min)

- [ ] Acessar `/admin` com `ADMIN_PASSWORD`
- [ ] Ler [[Painel-Admin]]
- [ ] [[Banco-Postgres]] + [[Migrations]]
- [ ] [[Storage-MinIO]]

## 5. Infra produção (20 min)

- [ ] [[VPS-Hostinger]]
- [ ] [[Docker-Compose]]
- [ ] [[CI-CD]] — como deploy funciona
- [ ] [[Variaveis-Ambiente]]

## 6. Domínios que você vai mexer

| Tarefa | Onde olhar |
|--------|------------|
| UI wizard | `components/wizard/`, `stores/wizard-store.ts` |
| API geração | `app/api/generate-ad/`, `lib/gemini.ts` |
| Auth | `auth.ts`, `middleware.ts` |
| Billing | `lib/billing/`, `lib/stripe/` |
| Admin | `components/admin/`, `app/api/admin/` |
| Deploy | `deploy/`, `.github/workflows/` |

## 7. Histórico (opcional)

- [ ] [[Timeline]] — evolução do projeto
- [ ] Fases em `Historico/Fases/`

## 8. Quando travar

- [ ] [[Troubleshooting]]
- [ ] [[APIs-Referencia]] — contratos das rotas

---

**Vault home:** [[InstaAds]]

**Produção:** https://insta-ads.online
