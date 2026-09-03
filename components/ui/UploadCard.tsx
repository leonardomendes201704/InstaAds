"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  ArrowUp,
  Camera,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadCardProps {
  previewUrl: string | null;
  onSelect: (file: File) => void;
  className?: string;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) {
    return "Formato inválido. Use JPG, PNG ou WebP.";
  }
  if (file.size > MAX_SIZE) {
    return "Imagem muito grande. Máximo 10MB.";
  }
  return null;
}

export function UploadCard({ previewUrl, onSelect, className }: UploadCardProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    onSelect(file);
  };

  return (
    <div
      className={cn(
        "gradient-border gradient-border-dashed relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        {previewUrl ? (
          <div className="relative mb-3 h-36 w-full overflow-hidden rounded-2xl">
            <Image
              src={previewUrl}
              alt="Foto selecionada"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="relative mb-4">
            <Sparkles className="absolute -left-3 top-0 h-3 w-3 text-pink-400" />
            <Sparkles className="absolute -right-2 top-2 h-2.5 w-2.5 text-orange-400" />
            <Sparkles className="absolute -bottom-1 left-6 h-2 w-2 text-purple-400" />
            <div className="gradient-primary relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-md">
              <ImageIcon className="h-7 w-7 text-white" />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                <ArrowUp className="h-3.5 w-3.5 text-accent-purple" />
              </span>
            </div>
          </div>
        )}

        <p className="text-base font-semibold text-foreground">
          {previewUrl ? "Foto selecionada" : "Envie sua foto"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {previewUrl
            ? "1 imagem selecionada"
            : "Tire uma foto ou escolha da galeria"}
        </p>

        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-accent-purple"
          >
            <Camera className="h-4 w-4" />
            Câmera
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-accent-purple"
          >
            <ImageIcon className="h-4 w-4" />
            Galeria
          </button>
        </div>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
    </div>
  );
}
