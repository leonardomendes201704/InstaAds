import { get, list } from "@vercel/blob";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiCostEstimate } from "@/lib/ai-cost";
import { GENERATIONS_BUCKET, getSupabaseAdmin } from "@/lib/supabase/server";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";

export interface BlobMigrationReport {
  migrated: number;
  skipped: number;
  errors: number;
  legacySession: number;
  totalInBlob: number;
  errorDetails: string[];
}

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

const blobAccess = (process.env.BLOB_ACCESS ?? "private") as "public" | "private";

export function isBlobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
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

async function downloadBlobPath(fullPath: string): Promise<Buffer | null> {
  try {
    const result = await get(fullPath, { access: blobAccess });
    if (!result?.stream) return null;
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function downloadBlobUrl(url: string): Promise<Buffer | null> {
  const pathname = pathnameFromBlobUrl(url);
  if (!pathname) return null;

  const fullPath = pathname.startsWith("generations/")
    ? pathname
    : `generations/${pathname}`;

  return downloadBlobPath(fullPath);
}

async function uploadToSupabase(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(GENERATIONS_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  return !error;
}

export async function migrateBlobToSupabase(): Promise<BlobMigrationReport> {
  if (!isBlobConfigured()) {
    throw new Error("Vercel Blob não configurado (BLOB_STORE_ID ou BLOB_READ_WRITE_TOKEN).");
  }

  const supabase = getSupabaseAdmin();
  const report: BlobMigrationReport = {
    migrated: 0,
    skipped: 0,
    errors: 0,
    legacySession: 0,
    totalInBlob: 0,
    errorDetails: [],
  };

  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: "generations/",
      cursor,
      limit: 1000,
    });

    const metadataBlobs = result.blobs.filter((blob) =>
      blob.pathname.endsWith("/metadata.json"),
    );

    report.totalInBlob += metadataBlobs.length;

    for (const blob of metadataBlobs) {
      try {
        const jsonResult = await get(blob.pathname, { access: blobAccess });
        if (!jsonResult?.stream) {
          report.errors += 1;
          report.errorDetails.push(`Sem stream: ${blob.pathname}`);
          continue;
        }

        const text = await new Response(jsonResult.stream).text();
        const record = JSON.parse(text) as LegacyStoredGeneration;
        const userId = normalizeUserId(record);

        if (record.sessionId && !record.userId) {
          report.legacySession += 1;
        }

        const { count } = await supabase
          .from("generations")
          .select("*", { count: "exact", head: true })
          .eq("id", record.id);

        if ((count ?? 0) > 0) {
          report.skipped += 1;
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
          report.errors += 1;
          report.errorDetails.push(`Path original inválido: ${record.id}`);
          continue;
        }

        const originalBuffer = await downloadBlobUrl(record.originalPhotoUrl);
        if (!originalBuffer) {
          report.errors += 1;
          report.errorDetails.push(`Download original falhou: ${record.id}`);
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
          report.errors += 1;
          report.errorDetails.push(`Insert ${record.id}: ${insertError.message}`);
          continue;
        }

        report.migrated += 1;
      } catch (error) {
        report.errors += 1;
        report.errorDetails.push(
          `${blob.pathname}: ${error instanceof Error ? error.message : "erro"}`,
        );
      }
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return report;
}
