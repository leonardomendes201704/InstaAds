# Vault Obsidian — InstaAds

Esta pasta é um **vault Obsidian** dedicado à documentação do InstaAds.

## Abrir no Obsidian

1. Obsidian → **Open folder as vault**
2. Selecione `D:\Leonardo\InstaAds\vault` (ou o caminho equivalente no seu ambiente)
3. Comece por **[[InstaAds]]**

A pasta `.obsidian/` contém configuração local do editor (temas, plugins, layout).

## Estrutura

| Pasta | Conteúdo | Atualização |
|-------|----------|-------------|
| `01-Arquitetura/` | Visão geral, stack, diagramas, fluxos | Manual |
| `02-Infraestrutura/` | VPS, Docker, Caddy, CI/CD, env vars | Manual |
| `03-Dados/` | Postgres, migrations, MinIO | Manual |
| `04-Aplicacao/` | Código, rotas, APIs, auth, IA, billing | Manual |
| `05-Operacoes/` | Dev local, deploy, troubleshooting | Manual |
| `Historico/` | Commits, fases, timeline | **Script** |

## Regenerar changelog

Após novos commits no repositório:

```bash
npm run vault:changelog
```

O script **só** atualiza `Historico/Commits/`, `Historico/Fases/` e `Historico/Timeline.md`.  
Não altera documentação em `01`–`05` nem `.obsidian/`.

## Plugins úteis (opcional)

- **Dataview** — consultar frontmatter (`type: commit`, `type: doc`)
- **Graph view** — visualizar links entre notas

## Segurança

Nenhuma nota deve conter secrets (`.env`, chaves API). Use referências a `deploy/.env.example` e `.env.local.example`.
