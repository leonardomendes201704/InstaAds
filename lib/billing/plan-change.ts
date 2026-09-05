import { getUserBillingStatus } from "@/lib/billing/usage";
import {
  estimateProrationCents,
  formatCents,
  formatDatePt,
  formatPlanPrice,
  nextQuotaResetIso,
} from "@/lib/billing/format";
import type {
  CheckoutReturnTo,
  PaywallProration,
  PaywallResponse,
  PaywallTargetPlan,
} from "@/lib/billing/paywall-types";
import { getPlanById, listPlans, type Plan } from "@/lib/db/plans";
import { getUserSubscription } from "@/lib/db/subscriptions";
import { isStripeConfigured } from "@/lib/db/settings";
import {
  createCheckoutSession,
  syncSubscriptionFromStripeObject,
} from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";

function hasActivePaidSubscription(status: string | undefined): boolean {
  return status === "active" || status === "trialing";
}

export async function getPaywallForUser(userId: string): Promise<PaywallResponse> {
  const [billing, plans, subscription, stripeConfigured] = await Promise.all([
    getUserBillingStatus(userId),
    listPlans({ activeOnly: true }),
    getUserSubscription(userId),
    isStripeConfigured(),
  ]);

  const quotaResetsAt = nextQuotaResetIso(billing.periodStart);
  const billingRenewsAt = subscription?.currentPeriodEnd ?? null;
  const paidActive = hasActivePaidSubscription(subscription?.status);

  const upgradeCandidates = plans
    .filter((plan) => plan.priceCents > billing.plan.priceCents && Boolean(plan.stripePriceId))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const targets: PaywallTargetPlan[] = [];

  for (const plan of upgradeCandidates) {
    const remainingAfterUpgrade = Math.max(0, plan.monthlyGenerationLimit - billing.usage);
    const mode = paidActive ? "upgrade" : "checkout";
    const proration =
      mode === "upgrade" && subscription
        ? await previewProration({
            currentPlan: billing.plan,
            targetPlan: plan,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            periodStartIso: subscription.currentPeriodStart,
            periodEndIso: subscription.currentPeriodEnd,
          })
        : null;

    targets.push({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      monthlyGenerationLimit: plan.monthlyGenerationLimit,
      priceCents: plan.priceCents,
      priceLabel: formatPlanPrice(plan),
      remainingAfterUpgrade,
      mode,
      proration,
      ctaLabel:
        mode === "checkout"
          ? `Assinar ${plan.name} e gerar este anúncio`
          : `Fazer upgrade para ${plan.name} e gerar agora`,
    });
  }

  return {
    billing: {
      plan: {
        id: billing.plan.id,
        slug: billing.plan.slug,
        name: billing.plan.name,
        monthlyGenerationLimit: billing.plan.monthlyGenerationLimit,
        priceCents: billing.plan.priceCents,
        isDefault: billing.plan.isDefault,
      },
      usage: billing.usage,
      limit: billing.limit,
      remaining: billing.remaining,
      periodStart: billing.periodStart,
      priceLabel: formatPlanPrice(billing.plan),
    },
    quotaResetsAt,
    quotaResetsAtLabel: formatDatePt(quotaResetsAt),
    billingRenewsAt,
    billingRenewsAtLabel: billingRenewsAt ? formatDatePt(billingRenewsAt) : null,
    stripeConfigured,
    needsPaymentUpdate: subscription?.status === "past_due",
    targets,
  };
}

async function previewProration(input: {
  currentPlan: Plan;
  targetPlan: Plan;
  stripeSubscriptionId: string | null;
  periodStartIso: string | null;
  periodEndIso: string | null;
}): Promise<PaywallProration> {
  const fallback = localProration(input.currentPlan, input.targetPlan, input.periodStartIso, input.periodEndIso);

  if (!input.stripeSubscriptionId || !input.targetPlan.stripePriceId) {
    return fallback;
  }

  const stripe = await getStripeClient();
  if (!stripe) return fallback;

  try {
    const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId, {
      expand: ["items.data"],
    });
    const item = subscription.items.data[0];
    if (!item) return fallback;

    const preview = await stripe.invoices.createPreview({
      customer: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      subscription: subscription.id,
      subscription_details: {
        items: [{ id: item.id, price: input.targetPlan.stripePriceId }],
        proration_behavior: "always_invoice",
      },
    });

    return {
      amountDueNowCents: preview.amount_due,
      amountDueNowLabel: formatCents(preview.amount_due, input.targetPlan.currency),
      nextInvoiceCents: input.targetPlan.priceCents,
      nextInvoiceLabel: formatPlanPrice(input.targetPlan),
    };
  } catch (error) {
    console.error("Falha ao pré-visualizar prorata Stripe:", error);
    return fallback;
  }
}

function localProration(
  currentPlan: Plan,
  targetPlan: Plan,
  periodStartIso: string | null,
  periodEndIso: string | null,
): PaywallProration {
  const periodStartMs = periodStartIso ? new Date(periodStartIso).getTime() : Date.now();
  const periodEndMs = periodEndIso
    ? new Date(periodEndIso).getTime()
    : periodStartMs + 30 * 24 * 60 * 60 * 1000;
  const amountDueNowCents = estimateProrationCents({
    currentPriceCents: currentPlan.priceCents,
    nextPriceCents: targetPlan.priceCents,
    periodStartMs,
    periodEndMs,
  });

  return {
    amountDueNowCents,
    amountDueNowLabel: formatCents(amountDueNowCents, targetPlan.currency),
    nextInvoiceCents: targetPlan.priceCents,
    nextInvoiceLabel: formatPlanPrice(targetPlan),
  };
}

export async function subscribeToPlan(input: {
  userId: string;
  email?: string;
  planId: string;
  origin: string;
  returnTo: CheckoutReturnTo;
}): Promise<{ url?: string; upgraded?: boolean; remaining?: number }> {
  const plan = await getPlanById(input.planId);
  if (!plan || !plan.isActive) throw new Error("Plano inválido.");
  if (plan.priceCents === 0) throw new Error("Plano gratuito não requer checkout.");

  const [billing, subscription] = await Promise.all([
    getUserBillingStatus(input.userId),
    getUserSubscription(input.userId),
  ]);

  if (plan.priceCents <= billing.plan.priceCents) {
    throw new Error("Você já está neste plano ou em um plano superior.");
  }

  if (hasActivePaidSubscription(subscription?.status)) {
    await upgradeSubscriptionPlan({
      userId: input.userId,
      plan,
      stripeSubscriptionId: subscription?.stripeSubscriptionId ?? null,
    });
    const next = await getUserBillingStatus(input.userId);
    return { upgraded: true, remaining: next.remaining };
  }

  const url = await createCheckoutSession({
    userId: input.userId,
    email: input.email,
    planId: plan.id,
    origin: input.origin,
    returnTo: input.returnTo,
  });

  return { url: url.url };
}

export async function upgradeSubscriptionPlan(input: {
  userId: string;
  plan: Plan;
  stripeSubscriptionId: string | null;
}): Promise<void> {
  if (!input.plan.stripePriceId) {
    throw new Error("Plano sem stripe_price_id. Configure no admin.");
  }
  if (!input.stripeSubscriptionId) {
    throw new Error("Assinatura Stripe não encontrada. Use o checkout.");
  }

  const stripe = await getStripeClient();
  if (!stripe) throw new Error("Stripe não configurado.");

  const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId, {
    expand: ["items.data"],
  });
  const item = subscription.items.data[0];
  if (!item) throw new Error("Assinatura sem item de preço.");

  const updated = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, price: input.plan.stripePriceId }],
    proration_behavior: "always_invoice",
    cancel_at_period_end: false,
    metadata: {
      userId: input.userId,
      planId: input.plan.id,
    },
  });

  await syncSubscriptionFromStripeObject(updated);
}
