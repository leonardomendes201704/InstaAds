import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  currentStep: 1 | 2 | 3;
}

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              step <= currentStep ? "gradient-primary" : "bg-gray-200",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted">Passo {currentStep} de 3</span>
    </div>
  );
}
