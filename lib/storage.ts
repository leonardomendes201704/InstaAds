import { get, put, type PutCommandOptions } from "@vercel/blob";
import type { AiCostEstimate } from "@/lib/ai-cost";
import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";

export interface StoredGeneration {
  id: string;
  sessionId: string;
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

const putOptions = {
  access: blobAccess,
  addRandomSuffix: false,
} satisfies Pick<PutCommandOptions, "access" | "addRandomSuffix">;

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
}

function basePath(sessionId: string, generationId: string) {
  return `generations/${sessionId}/${generationId}`;
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
  sessionId: string;
  generationId: string;
  photoBase64: string;
  photoMimeType: string;
  feedImage?: { base64: string; mimeType: string };
  storiesImage?: { base64: string; mimeType: string };
  metadata: Omit<
    StoredGeneration,
    | "id"
    | "sessionId"
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

  const prefix = basePath(input.sessionId, input.generationId);
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
    sessionId: input.sessionId,
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
    if (!result) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as StoredGeneration;
  } catch {
    return null;
  }
}

export async function listGenerationsBySession(
  sessionId: string,
): Promise<StoredGeneration[]> {
  if (!isStorageConfigured()) {
    return [];
  }

  const { list } = await import("@vercel/blob");
  const { blobs } = await list({
    prefix: `generations/${sessionId}/`,
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
