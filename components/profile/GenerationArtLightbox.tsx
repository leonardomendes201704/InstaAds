"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { downloadMediaUrl } from "@/lib/ad-composer";
import { cn } from "@/lib/utils";

export type ArtFormat = "feed" | "stories";

export interface GenerationArtLightboxProps {
  headline: string;
  createdAtLabel: string;
  feedUrl?: string;
  storiesUrl?: string;
  onClose: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function defaultFormat(feedUrl?: string, storiesUrl?: string): ArtFormat {
  if (feedUrl) return "feed";
  if (storiesUrl) return "stories";
  return "feed";
}

export function GenerationArtLightbox({
  headline,
  createdAtLabel,
  feedUrl,
  storiesUrl,
  onClose,
}: GenerationArtLightboxProps) {
  const [format, setFormat] = useState<ArtFormat>(() =>
    defaultFormat(feedUrl, storiesUrl),
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const imageUrl = format === "feed" ? feedUrl : storiesUrl;
  const hasBoth = Boolean(feedUrl && storiesUrl);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  async function handleDownload() {
    if (!imageUrl) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const slug = slugify(headline) || "anuncio";
      await downloadMediaUrl(imageUrl, `instaads-${slug}-${format}.png`);
    } catch {
      setDownloadError("Não foi possível baixar. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 pb-safe pt-safe backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Visualizar arte gerada"
      onClick={onClose}
    >
      <div
        className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{headline}</p>
            <p className="text-xs text-white/70">{createdAtLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {hasBoth ? (
          <div className="mb-3 flex shrink-0 gap-2">
            {feedUrl ? (
              <button
                type="button"
                onClick={() => setFormat("feed")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  format === "feed"
                    ? "bg-white text-foreground"
                    : "bg-white/15 text-white hover:bg-white/25",
                )}
              >
                Feed
              </button>
            ) : null}
            {storiesUrl ? (
              <button
                type="button"
                onClick={() => setFormat("stories")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  format === "stories"
                    ? "bg-white text-foreground"
                    : "bg-white/15 text-white hover:bg-white/25",
                )}
              >
                Stories
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={headline}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : (
            <p className="text-sm text-white/70">Preview indisponível.</p>
          )}
        </div>

        {downloadError ? (
          <p className="mt-2 shrink-0 text-center text-xs text-red-300">{downloadError}</p>
        ) : null}

        <button
          type="button"
          disabled={!imageUrl || downloading}
          onClick={() => void handleDownload()}
          className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-medium text-foreground disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Baixando..." : "Baixar arte"}
        </button>
      </div>
    </div>
  );
}
