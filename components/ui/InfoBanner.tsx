import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface InfoBannerProps {
  children: React.ReactNode;
  className?: string;
}

export function InfoBanner({ children, className }: InfoBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 text-xs text-muted",
        className,
      )}
    >
      <span className="gradient-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </span>
      <p className="leading-snug">{children}</p>
    </div>
  );
}
