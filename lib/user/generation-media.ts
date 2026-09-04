import { pathnameFromBlobUrl } from "@/lib/storage";

export function userMediaUrl(storagePath?: string): string | undefined {
  if (!storagePath) return undefined;

  let path = storagePath;
  if (storagePath.startsWith("http")) {
    const extracted = pathnameFromBlobUrl(storagePath);
    if (!extracted) return undefined;
    path = extracted.startsWith("generations/")
      ? extracted.slice("generations/".length)
      : extracted;
  }

  return `/api/user/media?path=${encodeURIComponent(path)}`;
}

export function isMediaPathOwnedByUser(path: string, userId: string): boolean {
  if (path.includes("..")) return false;
  return path === userId || path.startsWith(`${userId}/`);
}
