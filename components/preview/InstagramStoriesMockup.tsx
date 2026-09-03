"use client";

import Image from "next/image";
import type { GeneratedAd } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InstagramStoriesMockupProps {
  ad: GeneratedAd;
  imageUrl: string;
  className?: string;
}

export function InstagramStoriesMockup({
  imageUrl,
  className,
}: InstagramStoriesMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-2xl border border-gray-100 bg-black",
        className,
      )}
    >
      <Image src={imageUrl} alt="Prévia Stories" fill className="object-cover" unoptimized />
      <div className="absolute inset-x-0 top-2 flex justify-center gap-1 px-3">
        <span className="h-0.5 flex-1 rounded-full bg-white/80" />
        <span className="h-0.5 flex-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
