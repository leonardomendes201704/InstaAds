import { get, put, type PutCommandOptions } from "@vercel/blob";
import type { AiCostEstimate } from "@/lib/ai-cost";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";

export interface StoredGeneration {
  id: string;
  userId: string;
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

export interface AdminStats {
  totalGenerations: number;
  uniqueUsers: number;
  totalCostUsd: number;
  generationsToday: number;
}

const blobAccess = (process.env.BLOB_ACCESS ?? "private") as "public" | "private";

const putOptions = {
  access: blobAccess,
  addRandomSuffix: false,
} satisfies Pick<PutCommandOptions, "access" | "addRandomSuffix">;

type LegacyStoredGeneration = StoredGeneration & { sessionId?: string };

function normalizeStoredGeneration(
  record: LegacyStoredGeneration | null,
): StoredGeneration | null {
  if (!record) return null;

  return {
    ...record,
    userId: record.userId ?? record.sessionId ?? "unknown",
  };
}

export function getGenerationOwnerLabel(generation: StoredGeneration): string {
  return generation.userEmail ?? generation.userName ?? generation.userId;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
}

function basePath(userId: string, generationId: string) {
  return `generations/${userId}/${generationId}`;
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

async function uploadBase64Image(
  pathname: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const blob = await put(pathname, buffer, {
    ...putOptions,
    contentType: mimeType,
  });
  return blob.url;
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
      "Vercel Blob não configurado (BLOB_STORE_ID ou BLOB_READ_WRITE_TOKEN).",
    );
  }

  const prefix = basePath(input.userId, input.generationId);
  const photoExt = extensionForMime(input.photoMimeType);

  const originalPhotoUrl = await uploadBase64Image(
    `${prefix}/original.${photoExt}`,
    input.photoBase64,
    input.photoMimeType,
  );

  let generatedArtUrl: string | undefined;
  if (input.feedImage) {
    generatedArtUrl = await uploadBase64Image(
      `${prefix}/art-feed.${extensionForMime(input.feedImage.mimeType)}`,
      input.feedImage.base64,
      input.feedImage.mimeType,
    );
  }

  let generatedStoriesUrl: string | undefined;
  if (input.storiesImage) {
    generatedStoriesUrl = await uploadBase64Image(
      `${prefix}/art-stories.${extensionForMime(input.storiesImage.mimeType)}`,
      input.storiesImage.base64,
      input.storiesImage.mimeType,
    );
  }

  const record: StoredGeneration = {
    id: input.generationId,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    createdAt: new Date().toISOString(),
    originalPhotoUrl,
    generatedArtUrl,
    generatedStoriesUrl,
    ...input.metadata,
  };

  await put(`${prefix}/metadata.json`, JSON.stringify(record), {
    ...putOptions,
    contentType: "application/json",
  });

  return record;
}

async function readPrivateJson(pathname: string): Promise<StoredGeneration | null> {
  try {
    const result = await get(pathname, { access: blobAccess });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return normalizeStoredGeneration(JSON.parse(text) as LegacyStoredGeneration);
  } catch {
    return null;
  }
}

export function pathnameFromBlobUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname.startsWith("/") ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
}

export function isValidGenerationPath(path: string): boolean {
  if (!path.startsWith("generations/")) return false;
  if (path.includes("..")) return false;
  return true;
}

export async function getPrivateBlob(pathname: string) {
  return get(pathname, { access: blobAccess });
}

export function computeAdminStats(generations: StoredGeneration[]): AdminStats {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const users = new Set(generations.map((g) => g.userId));

  return {
    totalGenerations: generations.length,
    uniqueUsers: users.size,
    totalCostUsd: generations.reduce(
      (sum, g) => sum + (g.aiCost?.totalUsd ?? 0),
      0,
    ),
    generationsToday: generations.filter(
      (g) => new Date(g.createdAt) >= todayStart,
    ).length,
  };
}

export async function listAllGenerations(options?: {
  cursor?: string;
  limit?: number;
}): Promise<{
  generations: StoredGeneration[];
  cursor?: string;
  hasMore: boolean;
}> {
  if (!isStorageConfigured()) {
    return { generations: [], hasMore: false };
  }

  const pageSize = options?.limit ?? 20;
  const { list } = await import("@vercel/blob");

  const result = await list({
    prefix: "generations/",
    cursor: options?.cursor,
    limit: 1000,
  });

  const metadataBlobs = result.blobs.filter((blob) =>
    blob.pathname.endsWith("/metadata.json"),
  );

  const records = await Promise.all(
    metadataBlobs.map((blob) => readPrivateJson(blob.pathname)),
  );

  const generations = records
    .filter((record): record is StoredGeneration => record !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, pageSize);

  return {
    generations,
    cursor: result.cursor,
    hasMore: Boolean(result.hasMore && result.cursor),
  };
}

export async function listGenerationsByUser(
  userId: string,
): Promise<StoredGeneration[]> {
  if (!isStorageConfigured()) {
    return [];
  }

  const { list } = await import("@vercel/blob");
  const { blobs } = await list({
    prefix: `generations/${userId}/`,
  });

  const metadataBlobs = blobs.filter((blob) =>
    blob.pathname.endsWith("/metadata.json"),
  );

  const records = await Promise.all(
    metadataBlobs.map((blob) => readPrivateJson(blob.pathname)),
  );

  return records
    .filter((record): record is StoredGeneration => record !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
