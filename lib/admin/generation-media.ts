import type { StoredGeneration } from "@/lib/db/types";
import { pathnameFromBlobUrl } from "@/lib/storage";

export function generationMediaUrl(storagePath?: string): string | undefined {
  if (!storagePath) return undefined;

  let path = storagePath;
  if (storagePath.startsWith("http")) {
    const extracted = pathnameFromBlobUrl(storagePath);
    if (!extracted) return undefined;
    path = extracted.startsWith("generations/")
      ? extracted.slice("generations/".length)
      : extracted;
  }

  return `/api/admin/media?path=${encodeURIComponent(path)}`;
}

export function getGenerationMediaUrls(generation: StoredGeneration) {
  return {
    original: generationMediaUrl(generation.originalPhotoUrl),
    feed: generationMediaUrl(generation.generatedArtUrl),
    stories: generationMediaUrl(generation.generatedStoriesUrl),
  };
}
