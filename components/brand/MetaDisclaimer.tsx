import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

interface MetaDisclaimerProps {
  className?: string;
}

export function MetaDisclaimer({ className }: MetaDisclaimerProps) {
  return (
    <p className={cn("text-center text-xs leading-relaxed text-muted", className)}>
      {siteConfig.metaDisclaimer}
    </p>
  );
}
