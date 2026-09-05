"use client";

import { useEffect } from "react";
import { Step1Upload } from "@/components/wizard/Step1Upload";
import { Step2Personalize } from "@/components/wizard/Step2Personalize";
import { Step3Preview } from "@/components/wizard/Step3Preview";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useWizardStore } from "@/stores/wizard-store";

export function AdWizard() {
  const step = useWizardStore((state) => state.step);
  const isResuming = useWizardStore((state) => state.isResuming);
  const resumeFromCheckout = useWizardStore((state) => state.resumeFromCheckout);

  useEffect(() => {
    void resumeFromCheckout();
  }, [resumeFromCheckout]);

  if (isResuming) {
    return <LoadingOverlay message="Confirmando seu plano e gerando o anúncio..." />;
  }

  if (step === 1) return <Step1Upload />;
  if (step === 2) return <Step2Personalize />;
  return <Step3Preview />;
}
