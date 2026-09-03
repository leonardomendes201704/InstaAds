"use client";

import Image from "next/image";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Send,
  ShoppingBag,
} from "lucide-react";
import type { GeneratedAd } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InstagramFeedMockupProps {
  ad: GeneratedAd;
  imageUrl: string;
  className?: string;
}

export function InstagramFeedMockup({
  ad,
  imageUrl,
  className,
}: InstagramFeedMockupProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-100 bg-white", className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="gradient-primary flex h-7 w-7 items-center justify-center rounded-full">
          <ShoppingBag className="h-3.5 w-3.5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">loja.exemplo</p>
          <p className="text-[10px] text-muted">Patrocinado</p>
        </div>
      </div>

      <div className="relative aspect-[4/5] w-full bg-gray-100">
        <Image src={imageUrl} alt="Prévia do anúncio" fill className="object-cover" unoptimized />
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3 text-gray-800">
          <Heart className="h-4 w-4" />
          <MessageCircle className="h-4 w-4" />
          <Send className="h-4 w-4" />
        </div>
        <Bookmark className="h-4 w-4 text-gray-800" />
      </div>

      <div className="px-3 pb-3 text-[10px] text-muted">
        <span className="font-semibold text-foreground">loja.exemplo</span>{" "}
        {ad.headline} {ad.subheadline}
      </div>
    </div>
  );
}
