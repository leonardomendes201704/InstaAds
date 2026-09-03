"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { StoredGeneration } from "@/lib/db/types";
import { getGenerationMediaUrls } from "@/lib/admin/generation-media";

interface CompareTarget {
  url: string;
  label: string;
}

interface ImageCompareLightboxProps {
  originalUrl?: string;
  generated: CompareTarget;
  headline?: string;
  onClose: () => void;
}

function ImageCompareLightbox({
  originalUrl,
  generated,
  headline,
  onClose,
}: ImageCompareLightboxProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Comparar imagens"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div className="min-w-0 pr-4">
            <p className="text-sm font-semibold text-foreground">Comparar geração</p>
            {headline ? (
              <p className="mt-0.5 truncate text-xs text-muted">{headline}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-2">
          {originalUrl ? (
            <figure className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-surface">
              <div className="flex min-h-[240px] flex-1 items-center justify-center bg-black/[0.03] p-3">
                <img
                  src={originalUrl}
                  alt="Foto original"
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              <figcaption className="border-t border-black/10 px-4 py-2.5 text-sm font-medium text-foreground">
                Original
              </figcaption>
            </figure>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-black/15 bg-surface text-sm text-muted">
              Foto original indisponível
            </div>
          )}

          <figure className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-surface">
            <div className="flex min-h-[240px] flex-1 items-center justify-center bg-black/[0.03] p-3">
              <img
                src={generated.url}
                alt={generated.label}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
            <figcaption className="border-t border-black/10 px-4 py-2.5 text-sm font-medium text-foreground">
              {generated.label}
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}

interface GenerationImagesGalleryProps {
  generation: StoredGeneration;
}

export function GenerationImagesGallery({ generation }: GenerationImagesGalleryProps) {
  const { original, feed, stories } = getGenerationMediaUrls(generation);
  const [lightbox, setLightbox] = useState<CompareTarget | null>(null);

  function openCompare(target: CompareTarget) {
    setLightbox(target);
  }

  function openFromOriginal() {
    if (feed) {
      openCompare({ url: feed, label: "Arte gerada — Feed" });
      return;
    }
    if (stories) {
      openCompare({ url: stories, label: "Arte gerada — Stories" });
    }
  }

  const clickableClass =
    "cursor-zoom-in transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple";

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {original ? (
          <figure className="overflow-hidden rounded-xl border border-black/10 bg-surface">
            <button
              type="button"
              onClick={openFromOriginal}
              className={`block w-full ${clickableClass}`}
              aria-label="Ampliar original e comparar com arte gerada"
            >
              <img
                src={original}
                alt="Foto original"
                className="aspect-square w-full object-cover"
              />
            </button>
            <figcaption className="px-3 py-2 text-xs text-muted">Original</figcaption>
          </figure>
        ) : null}

        {feed ? (
          <figure className="overflow-hidden rounded-xl border border-black/10 bg-surface">
            <button
              type="button"
              onClick={() => openCompare({ url: feed, label: "Arte gerada — Feed" })}
              className={`block w-full ${clickableClass}`}
              aria-label="Ampliar feed e comparar com original"
            >
              <img src={feed} alt="Arte feed" className="aspect-[4/5] w-full object-cover" />
            </button>
            <figcaption className="px-3 py-2 text-xs text-muted">Feed</figcaption>
          </figure>
        ) : null}

        {stories ? (
          <figure className="overflow-hidden rounded-xl border border-black/10 bg-surface">
            <button
              type="button"
              onClick={() =>
                openCompare({ url: stories, label: "Arte gerada — Stories" })
              }
              className={`block w-full ${clickableClass}`}
              aria-label="Ampliar stories e comparar com original"
            >
              <img
                src={stories}
                alt="Arte stories"
                className="aspect-[9/16] w-full object-cover"
              />
            </button>
            <figcaption className="px-3 py-2 text-xs text-muted">Stories</figcaption>
          </figure>
        ) : null}
      </div>

      {lightbox ? (
        <ImageCompareLightbox
          originalUrl={original}
          generated={lightbox}
          headline={generation.headline}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </>
  );
}
