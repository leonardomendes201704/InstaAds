import { logActivity } from "@/lib/db/activity";
import {
  getGenerationOwnerLabel,
  insertGeneration,
  listAllGenerations as listAllFromDb,
  listGenerationsByUser as listByUserFromDb,
  computeAdminStats,
  rowToStoredGeneration,
} from "@/lib/db/generations";
import type { AdminStats, StoredGeneration } from "@/lib/db/types";
import { upsertProfile, uploadGenerationFile } from "@/lib/db/profiles";
import {
  GENERATIONS_BUCKET,
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export type { AdminStats, StoredGeneration };
export {
  getGenerationOwnerLabel,
  computeAdminStats,
  listAllFromDb as listAllGenerations,
  listByUserFromDb as listGenerationsByUser,
};

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured();
}

function storagePath(userId: string, generationId: string, filename: string) {
  return `${userId}/${generationId}/${filename}`;
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

async function uploadBase64Image(
  path: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  await uploadGenerationFile(path, buffer, mimeType);
  return path;
}

export function isValidGenerationPath(path: string): boolean {
  if (path.includes("..")) return false;
  const parts = path.split("/");
  if (parts.length !== 3) return false;
  return parts.every((part) => part.length > 0);
}

export async function getPrivateBlob(pathname: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(GENERATIONS_BUCKET)
    .download(pathname);

  if (error || !data) return null;

  return {
    stream: data.stream(),
    blob: { contentType: data.type || "application/octet-stream" },
    statusCode: 200 as const,
  };
}

export async function saveGeneration(input: {
  userId: string;
  userEmail?: string;
  userName?: string;
  generationId: string;
  photoBase64: string;
  photoMimeType: string;
  feedImage?: { base64: string; mimeType: string };
  storiesImage?: { base64: string; mimeType: string };
  metadata: Omit<
    StoredGeneration,
    | "id"
    | "userId"
    | "userEmail"
    | "userName"
    | "createdAt"
    | "originalPhotoUrl"
    | "generatedArtUrl"
    | "generatedStoriesUrl"
  >;
}): Promise<StoredGeneration> {
  if (!isStorageConfigured()) {
    throw new Error(
      "Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  await upsertProfile({
    id: input.userId,
    email: input.userEmail,
    name: input.userName,
  });

  const photoExt = extensionForMime(input.photoMimeType);
  const originalPath = await uploadBase64Image(
    storagePath(input.userId, input.generationId, `original.${photoExt}`),
    input.photoBase64,
    input.photoMimeType,
  );

  let feedPath: string | undefined;
  if (input.feedImage) {
    feedPath = await uploadBase64Image(
      storagePath(
        input.userId,
        input.generationId,
        `art-feed.${extensionForMime(input.feedImage.mimeType)}`,
      ),
      input.feedImage.base64,
      input.feedImage.mimeType,
    );
  }

  let storiesPath: string | undefined;
  if (input.storiesImage) {
    storiesPath = await uploadBase64Image(
      storagePath(
        input.userId,
        input.generationId,
        `art-stories.${extensionForMime(input.storiesImage.mimeType)}`,
      ),
      input.storiesImage.base64,
      input.storiesImage.mimeType,
    );
  }

  const record = await insertGeneration({
    id: input.generationId,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    status: input.metadata.status,
    adCategory: input.metadata.adCategory,
    adStyle: input.metadata.adStyle,
    mainMessage: input.metadata.mainMessage,
    publishTarget: input.metadata.publishTarget,
    headline: input.metadata.headline,
    subheadline: input.metadata.subheadline,
    benefits: input.metadata.benefits,
    cta: input.metadata.cta,
    originalPath,
    feedPath,
    storiesPath,
    errorMessage: input.metadata.errorMessage,
    aiCost: input.metadata.aiCost,
  });

  await logActivity({
    userId: input.userId,
    type: "generation.completed",
    metadata: {
      generationId: input.generationId,
      adCategory: input.metadata.adCategory,
      adStyle: input.metadata.adStyle,
      aiCostUsd: input.metadata.aiCost?.totalUsd,
    },
  });

  return record;
}

export function pathnameFromBlobUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname.startsWith("/") ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
}

export async function generationExists(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("id", id);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export { rowToStoredGeneration };
