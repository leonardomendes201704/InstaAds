"use client";

import { Step1Upload } from "@/components/wizard/Step1Upload";
import { Step2Personalize } from "@/components/wizard/Step2Personalize";
import { Step3Preview } from "@/components/wizard/Step3Preview";
import { useWizardStore } from "@/stores/wizard-store";

export function AdWizard() {
  const step = useWizardStore((state) => state.step);

  if (step === 1) return <Step1Upload />;
  if (step === 2) return <Step2Personalize />;
  return <Step3Preview />;
}
