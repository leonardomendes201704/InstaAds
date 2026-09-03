import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getPlanById } from "@/lib/db/plans";
import { sendEmail } from "@/lib/email/send";
import { getStripeClient } from "@/lib/stripe/client";
import { siteConfig } from "@/lib/site";
import type Stripe from "stripe";

export function getSubscriptionBillingPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: number;
  currentPeriodEnd: number;
} {
  const item = subscription.items.data[0];
  if (item) {
    return {
      currentPeriodStart: item.current_period_start,
      currentPeriodEnd: item.current_period_end,
    };
  }

  return {
    currentPeriodStart: subscription.created,
    currentPeriodEnd: subscription.created,
  };
}

export async function syncSubscriptionFromStripeObject(
  subscription: Stripe.Subscription,
): Promise<void> {
  const { currentPeriodStart, currentPeriodEnd } =
    getSubscriptionBillingPeriod(subscription);

  await syncSubscriptionFromStripe({
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    metadata: subscription.metadata as { userId?: string; planId?: string },
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
}

export async function getOrCreateStripeCustomer(userId: string, email?: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("Stripe não configurado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, name")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: email ?? profile?.email ?? undefined,
    name: profile?.name ?? undefined,
    metadata: { userId },
  });

  await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return customer.id;
}

export async function createCheckoutSession(input: {
  userId: string;
  email?: string;
  planId: string;
  promotionCode?: string;
}): Promise<{ url: string }> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("Stripe não configurado. Configure as chaves no admin.");

  const plan = await getPlanById(input.planId);
  if (!plan || !plan.isActive) throw new Error("Plano inválido.");
  if (!plan.stripePriceId) {
    throw new Error("Plano sem stripe_price_id. Configure no admin.");
  }
  if (plan.priceCents === 0) throw new Error("Plano gratuito não requer checkout.");

  const customerId = await getOrCreateStripeCustomer(input.userId, input.email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${siteConfig.url}/planos?success=1`,
    cancel_url: `${siteConfig.url}/planos?canceled=1`,
    metadata: {
      userId: input.userId,
      planId: plan.id,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        planId: plan.id,
      },
    },
    allow_promotion_codes: true,
    ...(input.promotionCode
      ? { discounts: [{ promotion_code: input.promotionCode }] }
      : {}),
  });

  if (!session.url) throw new Error("Falha ao criar sessão de checkout.");
  return { url: session.url };
}

export async function createBillingPortalSession(userId: string): Promise<{ url: string }> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("Stripe não configurado.");

  const customerId = await getOrCreateStripeCustomer(userId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteConfig.url}/planos`,
  });

  return { url: session.url };
}

export async function syncSubscriptionFromStripe(subscription: {
  id: string;
  customer: string | { id: string };
  status: string;
  metadata: { userId?: string; planId?: string };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId;

  if (!userId || !planId) return;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const now = new Date().toISOString();

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: now,
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (["active", "trialing"].includes(subscription.status)) {
    await supabase
      .from("profiles")
      .update({ plan_id: planId, stripe_customer_id: customerId, updated_at: now })
      .eq("id", userId);
  }
}

export async function handleSubscriptionDeleted(stripeSubscriptionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (!sub?.user_id) return;

  const { data: freePlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();

  if (freePlan) {
    await supabase
      .from("profiles")
      .update({ plan_id: freePlan.id, updated_at: new Date().toISOString() })
      .eq("id", sub.user_id);
  }

  await supabase
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", stripeSubscriptionId);
}

export async function notifyPaymentFailed(userId: string, email?: string): Promise<void> {
  if (!email) return;
  await sendEmail({
    userId,
    to: email,
    template: "payment_failed",
    subject: "Falha no pagamento — InstaAds",
    html: `<p>Houve um problema com o pagamento da sua assinatura InstaAds.</p><p>Atualize seu método de pagamento em <a href="${siteConfig.url}/planos">Planos</a>.</p>`,
  });
}

export async function notifySubscriptionActive(input: {
  userId: string;
  email: string;
  planName: string;
}): Promise<void> {
  await sendEmail({
    userId: input.userId,
    to: input.email,
    template: "subscription_active",
    subject: "Assinatura ativa — InstaAds",
    html: `<p>Sua assinatura do plano <strong>${input.planName}</strong> está ativa. Bons anúncios!</p>`,
    metadata: { planName: input.planName },
  });
}
