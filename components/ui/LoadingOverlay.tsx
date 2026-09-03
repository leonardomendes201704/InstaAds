"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({
  message = "Criando seu anúncio...",
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
