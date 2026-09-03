import { put } from "@vercel/blob";
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
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
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
    throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");
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
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  return record;
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

  const metadataBlobs = blobs.filter((blob) => blob.pathname.endsWith("/metadata.json"));

  const records = await Promise.all(
    metadataBlobs.map(async (blob) => {
      const response = await fetch(blob.url);
      if (!response.ok) return null;
      return (await response.json()) as StoredGeneration;
    }),
  );

  return records
    .filter((record): record is StoredGeneration => record !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
