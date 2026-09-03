/**
 * CLI wrapper — prefere migrar pelo admin em produção (/api/admin/migrate-blob).
 * Localmente exige BLOB_READ_WRITE_TOKEN (OIDC não funciona em dev).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { migrateBlobToSupabase } from "../lib/migrate-from-blob";

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
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
    if (value === "[SENSITIVE]") continue;
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.migrate");
loadEnvFile(".env.local");

async function main() {
  console.log("Iniciando migração Blob → Supabase...\n");

  const report = await migrateBlobToSupabase();

  console.log("\n--- Relatório ---");
  console.log(`No Blob:   ${report.totalInBlob}`);
  console.log(`Migrados:  ${report.migrated}`);
  console.log(`Ignorados: ${report.skipped}`);
  console.log(`Erros:     ${report.errors}`);
  console.log(`Legacy sessionId: ${report.legacySession}`);

  if (report.errorDetails.length > 0) {
    console.log("\nDetalhes dos erros:");
    for (const detail of report.errorDetails) {
      console.log(`  - ${detail}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
