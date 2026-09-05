---
type: doc
area: dados
tags: [instaads, doc, minio, s3]
updated: 2026-09-04
---

# Storage MinIO (S3)

## Visão geral

Em produção, fotos originais e artes geradas ficam no **MinIO** — storage S3-compatible rodando em Docker.

Código: [`lib/object-storage.ts`](../../lib/object-storage.ts)

## Configuração

| Variável | Produção (Compose) |
|----------|-------------------|
| `S3_ENDPOINT` | `http://minio:9000` |
| `S3_ACCESS_KEY` | de `deploy/.env` |
| `S3_SECRET_KEY` | de `deploy/.env` |
| `S3_REGION` | `us-east-1` |

Bucket: **`generations`** (criado por `minio-init` no compose).

## Estrutura de paths

```
generations/{userId}/{generationId}/original.{ext}
generations/{userId}/{generationId}/feed.png
generations/{userId}/{generationId}/stories.png  (opcional)
```

Metadados (headline, custo IA, etc.) ficam na tabela `generations` no Postgres — ver [[Banco-Postgres]].

## API

- **Upload:** `PutObjectCommand` via AWS SDK
- **Download admin/user:** URLs assinadas (`getSignedUrl`) — expiração curta
- **Proxy:** `/api/admin/media` e `/api/user/media` servem arquivos com auth

## Abstração unificada

[`lib/storage.ts`](../../lib/storage.ts) escolhe backend:

- MinIO/S3 se `S3_*` configurado
- Supabase Storage se URL Supabase cloud
- Fallback legado Vercel Blob (migração)

## Migração Vercel Blob → MinIO/Supabase

- Script: `npm run migrate:blob`
- Painel admin: `/admin` → painel "Migrar Blob"
- API: `POST /api/admin/migrate-blob`

Histórico: fase Vercel usava `@vercel/blob`; commit `6c9d6e7` migrou metadata para Postgres.

## Volume Docker

Dados persistem em `minio_data`. Backup = snapshot deste volume + Postgres.

## Relacionado

- [[Docker-Compose]]
- [[Pipeline-IA]] — output binário da geração
