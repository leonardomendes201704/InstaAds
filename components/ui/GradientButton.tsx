import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function GradientButton({
  children,
  className,
  disabled,
  loading,
  ...props
}: GradientButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "gradient-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white shadow-lg shadow-pink-200/50 transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </button>
  );
}
