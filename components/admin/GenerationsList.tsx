import type { StoredGeneration } from "@/lib/storage";
import { pathnameFromBlobUrl } from "@/lib/storage";
import { categoryLabels, publishLabels } from "@/lib/ad-styles";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function truncateSession(sessionId: string): string {
  if (sessionId.length <= 12) return sessionId;
  return `${sessionId.slice(0, 4)}…${sessionId.slice(-4)}`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(value);
}

function mediaUrl(blobUrl?: string): string | undefined {
  if (!blobUrl) return undefined;
  const path = pathnameFromBlobUrl(blobUrl);
  if (!path) return undefined;
  return `/api/admin/media?path=${encodeURIComponent(path)}`;
}

function GenerationImages({ generation }: { generation: StoredGeneration }) {
  const original = mediaUrl(generation.originalPhotoUrl);
  const feed = mediaUrl(generation.generatedArtUrl);
  const stories = mediaUrl(generation.generatedStoriesUrl);

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {original ? (
        <figure className="overflow-hidden rounded-xl border border-black/10 bg-surface">
          <img src={original} alt="Foto original" className="aspect-square w-full object-cover" />
          <figcaption className="px-3 py-2 text-xs text-muted">Original</figcaption>
        </figure>
      ) : null}
      {feed ? (
        <figure className="overflow-hidden rounded-xl border border-black/10 bg-surface">
          <img src={feed} alt="Arte feed" className="aspect-[4/5] w-full object-cover" />
          <figcaption className="px-3 py-2 text-xs text-muted">Feed</figcaption>
        </figure>
      ) : null}
      {stories ? (
        <figure className="overflow-hidden rounded-xl border border-black/10 bg-surface">
          <img src={stories} alt="Arte stories" className="aspect-[9/16] w-full object-cover" />
          <figcaption className="px-3 py-2 text-xs text-muted">Stories</figcaption>
        </figure>
      ) : null}
    </div>
  );
}

function GenerationDetails({ generation }: { generation: StoredGeneration }) {
  return (
    <div className="mt-4 space-y-3 border-t border-black/10 pt-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground">Sessão:</span>{" "}
          <span className="font-mono text-xs text-muted">{generation.sessionId}</span>
        </p>
        <p>
          <span className="font-medium text-foreground">ID:</span>{" "}
          <span className="font-mono text-xs text-muted">{generation.id}</span>
        </p>
        <p>
          <span className="font-medium text-foreground">Mensagem:</span>{" "}
          {generation.mainMessage || "—"}
        </p>
        <p>
          <span className="font-medium text-foreground">Canal:</span>{" "}
          {publishLabels[generation.publishTarget]}
        </p>
      </div>

      <div>
        <p className="font-medium text-foreground">Copy</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
          <li>{generation.headline}</li>
          {generation.subheadline ? <li>{generation.subheadline}</li> : null}
          {generation.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
          <li>CTA: {generation.cta}</li>
        </ul>
      </div>

      {generation.aiCost ? (
        <div>
          <p className="font-medium text-foreground">
            Custo IA: {formatUsd(generation.aiCost.totalUsd)}
          </p>
          <ul className="mt-1 space-y-1 text-xs text-muted">
            {generation.aiCost.calls.map((call) => (
              <li key={`${call.purpose}-${call.model}`}>
                {call.purpose} · {call.model} · {call.totalTokens} tokens ·{" "}
                {formatUsd(call.costUsd)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <GenerationImages generation={generation} />
    </div>
  );
}

function Thumbnail({ src, label }: { src?: string; label: string }) {
  if (!src) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-[10px] text-muted">
        —
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      className="h-12 w-12 rounded-lg border border-black/10 object-cover"
    />
  );
}

function GenerationCard({ generation }: { generation: StoredGeneration }) {
  const original = mediaUrl(generation.originalPhotoUrl);
  const feed = mediaUrl(generation.generatedArtUrl);

  return (
    <details className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{generation.headline}</p>
            <p className="mt-1 text-xs text-muted">{formatDate(generation.createdAt)}</p>
            <p className="mt-1 text-xs text-muted">
              {categoryLabels[generation.adCategory]} · {generation.adStyle} ·{" "}
              {truncateSession(generation.sessionId)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Thumbnail src={original} label="Original" />
            <Thumbnail src={feed} label="Feed" />
          </div>
        </div>
        <p className="mt-2 text-xs font-medium text-accent-purple">
          {generation.aiCost ? formatUsd(generation.aiCost.totalUsd) : "—"}
        </p>
      </summary>
      <GenerationDetails generation={generation} />
    </details>
  );
}

function GenerationRow({ generation }: { generation: StoredGeneration }) {
  const original = mediaUrl(generation.originalPhotoUrl);
  const feed = mediaUrl(generation.generatedArtUrl);

  return (
    <details className="group border-b border-black/10 bg-white">
      <summary className="cursor-pointer list-none px-4 py-3 hover:bg-surface [&::-webkit-details-marker]:hidden">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_1.4fr_0.6fr_88px] items-center gap-3 text-sm">
          <span className="text-muted">{formatDate(generation.createdAt)}</span>
          <span className="font-mono text-xs text-muted" title={generation.sessionId}>
            {truncateSession(generation.sessionId)}
          </span>
          <span className="capitalize">{categoryLabels[generation.adCategory]}</span>
          <span className="capitalize">{generation.adStyle}</span>
          <span className="truncate font-medium text-foreground">{generation.headline}</span>
          <span className="text-muted">
            {generation.aiCost ? formatUsd(generation.aiCost.totalUsd) : "—"}
          </span>
          <div className="flex justify-end gap-2">
            <Thumbnail src={original} label="Original" />
            <Thumbnail src={feed} label="Feed" />
          </div>
        </div>
      </summary>
      <div className="border-t border-black/10 bg-surface px-4 py-4">
        <GenerationDetails generation={generation} />
      </div>
    </details>
  );
}

interface GenerationsListProps {
  generations: StoredGeneration[];
}

export function GenerationsList({ generations }: GenerationsListProps) {
  if (generations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-12 text-center">
        <p className="text-sm text-muted">Nenhuma geração encontrada ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-black/10 md:block">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_1.4fr_0.6fr_88px] gap-3 border-b border-black/10 bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Data</span>
          <span>Sessão</span>
          <span>Categoria</span>
          <span>Estilo</span>
          <span>Headline</span>
          <span>Custo IA</span>
          <span className="text-right">Imagens</span>
        </div>
        {generations.map((generation) => (
          <GenerationRow key={generation.id} generation={generation} />
        ))}
      </div>

      <div className="space-y-3 md:hidden">
        {generations.map((generation) => (
          <GenerationCard key={generation.id} generation={generation} />
        ))}
      </div>
    </>
  );
}
