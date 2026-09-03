"use client";

import { CategoryPills } from "@/components/ui/CategoryPills";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientText } from "@/components/ui/GradientText";
import { InfoBanner } from "@/components/ui/InfoBanner";
import { UploadCard } from "@/components/ui/UploadCard";
import { WizardShell } from "@/components/wizard/WizardShell";
import { useWizardStore } from "@/stores/wizard-store";

export function Step1Upload() {
  const {
    photoPreviewUrl,
    adCategory,
    setPhoto,
    setAdCategory,
    nextStep,
  } = useWizardStore();

  const canContinue = Boolean(photoPreviewUrl);

  return (
    <WizardShell
      step={1}
      title={
        <>
          Crie seu anúncio com <GradientText>IA</GradientText>
        </>
      }
      subtitle="Envie uma foto e a IA transforma em um anúncio para Instagram."
      onBack={() => undefined}
      showBack={false}
      showBrand
      footer={
        <GradientButton disabled={!canContinue} onClick={nextStep}>
          Continuar →
        </GradientButton>
      }
    >
      <div className="flex h-full flex-col gap-4">
        <UploadCard
          previewUrl={photoPreviewUrl}
          onSelect={(file) => setPhoto(file)}
        />
        <CategoryPills value={adCategory} onChange={setAdCategory} />
        <InfoBanner>A IA cria artes para Feed e Stories em segundos</InfoBanner>
      </div>
    </WizardShell>
  );
}
