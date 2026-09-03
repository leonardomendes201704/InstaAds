"use client";

import { ArrowLeft, X } from "lucide-react";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { cn } from "@/lib/utils";

interface WizardShellProps {
  step: 1 | 2 | 3;
  title: React.ReactNode;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  showBack?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function WizardShell({
  step,
  title,
  subtitle,
  onBack,
  onClose,
  showBack = true,
  footer,
  children,
  className,
}: WizardShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <header className="shrink-0 px-4 pt-safe">
        <div className="flex items-center justify-between py-2">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="h-10 w-10" />
          )}

          <ProgressDots currentStep={step} />

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pb-3 pt-1 text-center">
          <h1 className="text-2xl font-bold leading-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-snug text-muted">{subtitle}</p>
          ) : null}
        </div>
      </header>

      <main
        className={cn(
          "min-h-0 flex-1 overflow-hidden px-4",
          className,
        )}
      >
        {children}
      </main>

      {footer ? (
        <footer className="shrink-0 space-y-3 px-4 pb-safe pt-2">{footer}</footer>
      ) : null}
    </div>
  );
}
