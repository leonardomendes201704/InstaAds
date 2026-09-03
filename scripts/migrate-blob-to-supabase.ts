/**
 * Migra gerações do Vercel Blob para Supabase (Postgres + Storage).
 *
 * Uso:
 *   BLOB_READ_WRITE_TOKEN=... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run migrate:blob
 *
 * Idempotente: pula gerações cujo id já existe no Postgres.
 */

import { get, list } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import type { AiCostEstimate } from "../lib/ai-cost";
import type { AdCategory, AdStyle, PublishTarget } from "../lib/types";

const BUCKET = "generations";

interface LegacyStoredGeneration {
  id: string;
  userId?: string;
  sessionId?: string;
  userEmail?: string;
  userName?: string;
  createdAt: string;
  status: "success" | "error";
  adCategory: AdCategory;
  adStyle: AdStyle;
  mainMessage: string;
  publishTarget: PublishTarget;
  headline: string;
  subheadline: string;
  benefits: [string, string, string];
  cta: string;
  originalPhotoUrl: string;
  generatedArtUrl?: string;
  generatedStoriesUrl?: string;
  errorMessage?: string;
  aiCost?: AiCostEstimate;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável ${name} não definida.`);
  }
  return value;
}

function pathnameFromBlobUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const normalized = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    return normalized.startsWith("generations/")
      ? normalized.slice("generations/".length)
      : normalized;
  } catch {
    return null;
  }
}

function normalizeUserId(record: LegacyStoredGeneration): string {
  return record.userId ?? record.sessionId ?? "unknown";
}

async function downloadBlobUrl(url: string): Promise<Buffer | null> {
  const pathname = pathnameFromBlobUrl(url);
  if (!pathname) return null;

  const fullPath = pathname.startsWith("generations/")
    ? pathname
    : `generations/${pathname}`;

  try {
    const result = await get(fullPath, {
      access: (process.env.BLOB_ACCESS ?? "private") as "public" | "private",
    });
    if (!result?.stream) return null;
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function uploadToSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  return !error;
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("BLOB_READ_WRITE_TOKEN");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let legacySession = 0;
  let cursor: string | undefined;

  console.log("Iniciando migração Blob → Supabase...\n");

  do {
    const result = await list({
      prefix: "generations/",
      cursor,
      limit: 1000,
    });

    const metadataBlobs = result.blobs.filter((blob) =>
      blob.pathname.endsWith("/metadata.json"),
    );

    for (const blob of metadataBlobs) {
      try {
        const jsonResult = await get(blob.pathname, {
          access: (process.env.BLOB_ACCESS ?? "private") as "public" | "private",
        });
        if (!jsonResult?.stream) {
          errors += 1;
          console.error(`✗ Sem stream: ${blob.pathname}`);
          continue;
        }

        const text = await new Response(jsonResult.stream).text();
        const record = JSON.parse(text) as LegacyStoredGeneration;
        const userId = normalizeUserId(record);

        if (record.sessionId && !record.userId) {
          legacySession += 1;
        }

        const { count } = await supabase
          .from("generations")
          .select("*", { count: "exact", head: true })
          .eq("id", record.id);

        if ((count ?? 0) > 0) {
          skipped += 1;
          continue;
        }

        await supabase.from("profiles").upsert(
          {
            id: userId,
            email: record.userEmail ?? null,
            name: record.userName ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        const originalPath = pathnameFromBlobUrl(record.originalPhotoUrl);
        if (!originalPath) {
          errors += 1;
          console.error(`✗ Path original inválido: ${record.id}`);
          continue;
        }

        const originalBuffer = await downloadBlobUrl(record.originalPhotoUrl);
        if (!originalBuffer) {
          errors += 1;
          console.error(`✗ Download original falhou: ${record.id}`);
          continue;
        }

        await uploadToSupabase(
          supabase,
          originalPath,
          originalBuffer,
          "image/jpeg",
        );

        let feedPath: string | null = null;
        if (record.generatedArtUrl) {
          feedPath = pathnameFromBlobUrl(record.generatedArtUrl);
          if (feedPath) {
            const buf = await downloadBlobUrl(record.generatedArtUrl);
            if (buf) {
              await uploadToSupabase(supabase, feedPath, buf, "image/jpeg");
            }
          }
        }

        let storiesPath: string | null = null;
        if (record.generatedStoriesUrl) {
          storiesPath = pathnameFromBlobUrl(record.generatedStoriesUrl);
          if (storiesPath) {
            const buf = await downloadBlobUrl(record.generatedStoriesUrl);
            if (buf) {
              await uploadToSupabase(supabase, storiesPath, buf, "image/jpeg");
            }
          }
        }

        const { error: insertError } = await supabase.from("generations").insert({
          id: record.id,
          user_id: userId,
          user_email: record.userEmail ?? null,
          user_name: record.userName ?? null,
          created_at: record.createdAt,
          status: record.status,
          ad_category: record.adCategory,
          ad_style: record.adStyle,
          main_message: record.mainMessage ?? "",
          publish_target: record.publishTarget,
          headline: record.headline,
          subheadline: record.subheadline ?? "",
          benefits: record.benefits,
          cta: record.cta,
          original_path: originalPath,
          feed_path: feedPath,
          stories_path: storiesPath,
          error_message: record.errorMessage ?? null,
          ai_cost: record.aiCost ?? null,
        });

        if (insertError) {
          errors += 1;
          console.error(`✗ Insert ${record.id}:`, insertError.message);
          continue;
        }

        migrated += 1;
        console.log(`✓ ${record.id} (${userId})`);
      } catch (error) {
        errors += 1;
        console.error(`✗ ${blob.pathname}:`, error);
      }
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  console.log("\n--- Relatório ---");
  console.log(`Migrados:  ${migrated}`);
  console.log(`Ignorados: ${skipped} (já existiam)`);
  console.log(`Erros:     ${errors}`);
  console.log(`Legacy sessionId: ${legacySession}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
