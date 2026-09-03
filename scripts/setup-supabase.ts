/**
 * Setup pós-criação do projeto Supabase:
 * - Verifica conexão
 * - Cria bucket privado "generations" se não existir
 *
 * Pré-requisitos:
 * 1. Rodar supabase/migrations/001_initial.sql no SQL Editor do Supabase
 * 2. Definir no .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=eyJ... (Settings → API → service_role)
 *
 * Uso: npm run setup:supabase
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const BUCKET = "generations";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} não definida no .env.local`);
  }
  return value;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  console.log("Verificando conexão com Supabase...");

  const { error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  if (profilesError) {
    console.error("\n✗ Tabela 'profiles' não encontrada ou sem acesso.");
    console.error("  Rode primeiro o SQL em supabase/migrations/001_initial.sql");
    console.error("  no Supabase Dashboard → SQL Editor → New query → Run\n");
    console.error("Detalhe:", profilesError.message);
    process.exit(1);
  }

  console.log("✓ Postgres OK (tabela profiles existe)");

  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("✗ Erro ao listar buckets:", listError.message);
    process.exit(1);
  }

  const exists = buckets?.some((b) => b.name === BUCKET);

  if (exists) {
    console.log(`✓ Bucket "${BUCKET}" já existe`);
  } else {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
    });

    if (createError) {
      console.error(`✗ Erro ao criar bucket "${BUCKET}":`, createError.message);
      process.exit(1);
    }

    console.log(`✓ Bucket "${BUCKET}" criado (privado)`);
  }

  console.log("\nSetup concluído. Próximos passos:");
  console.log("  1. Adicionar as mesmas env vars na Vercel (Production)");
  console.log("  2. Se tinha dados no Blob: npm run migrate:blob");
  console.log("  3. Testar login + geração + /admin\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
