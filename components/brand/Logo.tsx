import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className }: LogoIconProps) {
  return (
    <Image
      src="/logo-icon.svg"
      alt="InstaAds"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}

interface LogoProps {
  height?: number;
  className?: string;
}

export function Logo({ height = 36, className }: LogoProps) {
  const width = Math.round(height * (188 / 48));

  return (
    <Image
      src="/logo.svg"
      alt="InstaAds"
      width={width}
      height={height}
      className={cn("mx-auto block h-auto w-auto", className)}
      priority
    />
  );
}
