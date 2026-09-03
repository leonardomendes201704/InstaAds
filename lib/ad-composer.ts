import type { AdStyle, GeneratedAdCopy, PublishTarget } from "@/lib/types";
import { stylePresets } from "@/lib/ad-styles";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

function drawGradientOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number,
) {
  const gradient = ctx.createLinearGradient(0, height * 0.35, 0, height);
  gradient.addColorStop(0, `rgba(0,0,0,0)`);
  gradient.addColorStop(1, `rgba(0,0,0,${opacity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawTexts(
  ctx: CanvasRenderingContext2D,
  copy: GeneratedAdCopy,
  style: AdStyle,
  width: number,
  height: number,
) {
  const preset = stylePresets[style];
  const align = copy.layout.textAlign ?? preset.textAlign;
  const padding = width * 0.08;
  const x =
    align === "center"
      ? width / 2
      : align === "right"
        ? width - padding
        : padding;

  ctx.textAlign = align;
  ctx.fillStyle = "#ffffff";

  const baseY = height * 0.58;

  ctx.font = `${copy.layout.fontWeight === "bold" ? "700" : "500"} ${preset.headlineSize}px Inter, sans-serif`;
  ctx.fillText(copy.headline, x, baseY);

  if (copy.subheadline) {
    ctx.font = `700 ${preset.subheadlineSize}px Inter, sans-serif`;
    ctx.fillStyle = copy.layout.accentColor;
    ctx.fillText(copy.subheadline, x, baseY + preset.headlineSize * 0.9);
  }

  if (copy.tagline) {
    ctx.fillStyle = "#f3f4f6";
    ctx.font = `400 ${preset.taglineSize}px Inter, sans-serif`;
    ctx.fillText(copy.tagline, x, baseY + preset.headlineSize * 1.7);
  }
}

function drawCta(
  ctx: CanvasRenderingContext2D,
  copy: GeneratedAdCopy,
  width: number,
  height: number,
) {
  const buttonWidth = Math.min(width * 0.55, 420);
  const buttonHeight = 64;
  const x = (width - buttonWidth) / 2;
  const y = height * 0.78;

  const gradient = ctx.createLinearGradient(x, y, x + buttonWidth, y);
  gradient.addColorStop(0, "#FF0066");
  gradient.addColorStop(1, "#FF8C00");

  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, buttonWidth, buttonHeight, 999);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 24px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(copy.cta, x + buttonWidth / 2, y + buttonHeight / 2 + 8);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function compose(
  photoUrl: string,
  copy: GeneratedAdCopy,
  style: AdStyle,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado.");

  const img = await loadImage(photoUrl);
  drawCover(ctx, img, width, height);
  drawGradientOverlay(
    ctx,
    width,
    height,
    copy.layout.overlayOpacity ?? stylePresets[style].overlayOpacity,
  );
  drawTexts(ctx, copy, style, width, height);
  drawCta(ctx, copy, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao exportar imagem."))),
      "image/png",
      1,
    );
  });
}

export async function composeAdImages(
  photoUrl: string,
  copy: GeneratedAdCopy,
  style: AdStyle,
  publishTarget: PublishTarget,
): Promise<{ feedBlobUrl?: string; storiesBlobUrl?: string }> {
  const result: { feedBlobUrl?: string; storiesBlobUrl?: string } = {};

  if (publishTarget === "feed" || publishTarget === "both") {
    const feedBlob = await compose(photoUrl, copy, style, 1080, 1080);
    result.feedBlobUrl = URL.createObjectURL(feedBlob);
  }

  if (publishTarget === "stories" || publishTarget === "both") {
    const storiesBlob = await compose(photoUrl, copy, style, 1080, 1920);
    result.storiesBlobUrl = URL.createObjectURL(storiesBlob);
  }

  return result;
}

export function downloadBlobUrl(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
