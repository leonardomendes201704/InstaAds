"use client";

import Image from "next/image";
import Link from "next/link";
import { Diamond, Sparkles, Square, Tag } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { OptionCard } from "@/components/ui/OptionCard";
import { WizardShell } from "@/components/wizard/WizardShell";
import type { AdStyle } from "@/lib/types";
import { useWizardStore } from "@/stores/wizard-store";

const styleOptions: Array<{
  id: AdStyle;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "moderno", label: "Moderno", icon: <Sparkles className="h-5 w-5" /> },
  { id: "vendas", label: "Vendas", icon: <Tag className="h-5 w-5" /> },
  { id: "elegante", label: "Elegante", icon: <Diamond className="h-5 w-5" /> },
  {
    id: "minimalista",
    label: "Minimalista",
    icon: <Square className="h-5 w-5" />,
  },
];

export function Step2Personalize() {
  const {
    photoPreviewUrl,
    adStyle,
    mainMessage,
    isGenerating,
    isSuggesting,
    error,
    quotaExceeded,
    setAdStyle,
    setMainMessage,
    setStep,
    prevStep,
    generateAd,
  } = useWizardStore();

  const handleSuggestText = async () => {
    await useWizardStore.getState().suggestText();
  };

  return (
    <>
      {isGenerating ? (
        <LoadingOverlay message="A IA está criando sua arte publicitária..." />
      ) : null}
      <WizardShell
        step={2}
        title="Personalize seu anúncio"
        onBack={prevStep}
        footer={
          <GradientButton
            loading={isGenerating}
            disabled={isGenerating}
            onClick={() => generateAd()}
          >
            Continuar →
          </GradientButton>
        }
      >
        <div className="flex h-full flex-col gap-3 overflow-hidden">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-pink-50">
              {photoPreviewUrl ? (
                <Image
                  src={photoPreviewUrl}
                  alt="Sua foto"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Sua foto</p>
              <p className="text-xs text-muted">1 imagem selecionada</p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm font-medium text-accent-purple"
            >
              Trocar
            </button>
          </div>

          <section>
            <p className="mb-2 text-sm font-medium">Estilo do anúncio</p>
            <div className="grid grid-cols-2 gap-2">
              {styleOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  icon={option.icon}
                  selected={adStyle === option.id}
                  onClick={() => setAdStyle(option.id)}
                />
              ))}
            </div>
          </section>

          <section className="min-h-0 flex-1">
            <p className="mb-2 text-sm font-medium">
              Mensagem principal{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </p>
            <input
              type="text"
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              placeholder="Nova coleção com até 30% OFF"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-accent-purple"
            />
            <button
              type="button"
              onClick={handleSuggestText}
              disabled={isSuggesting}
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-accent-purple disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isSuggesting ? "Gerando sugestão..." : "Sugerir texto com IA"}
            </button>
          </section>

          <InfoBanner>
            A IA vai gerar layout, texto e chamada para ação automaticamente.
          </InfoBanner>

          {error ? (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              <p>{error}</p>
              {quotaExceeded ? (
                <Link
                  href="/planos"
                  className="mt-1 inline-block font-medium text-accent-purple underline"
                >
                  Ver planos e fazer upgrade
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </WizardShell>
    </>
  );
}
