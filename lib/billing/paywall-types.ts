export type CheckoutReturnTo = "wizard" | "planos";

export type PaywallPlanMode = "checkout" | "upgrade";

export interface PaywallProration {
  amountDueNowCents: number;
  amountDueNowLabel: string;
  nextInvoiceCents: number;
  nextInvoiceLabel: string;
}

export interface PaywallTargetPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyGenerationLimit: number;
  priceCents: number;
  priceLabel: string;
  remainingAfterUpgrade: number;
  mode: PaywallPlanMode;
  proration: PaywallProration | null;
  ctaLabel: string;
}

export interface PaywallResponse {
  billing: {
    plan: {
      id: string;
      slug: string;
      name: string;
      monthlyGenerationLimit: number;
      priceCents: number;
      isDefault: boolean;
    };
    usage: number;
    limit: number;
    remaining: number;
    periodStart: string;
    priceLabel: string;
  };
  quotaResetsAt: string;
  quotaResetsAtLabel: string;
  billingRenewsAt: string | null;
  billingRenewsAtLabel: string | null;
  stripeConfigured: boolean;
  needsPaymentUpdate: boolean;
  targets: PaywallTargetPlan[];
}

export interface SubscribeResponse {
  url?: string;
  upgraded?: boolean;
  remaining?: number;
  error?: string;
}
