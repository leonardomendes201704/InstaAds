import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPlanById } from "@/lib/db/plans";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe/client";
import {
  handleSubscriptionDeleted,
  notifyPaymentFailed,
  notifySubscriptionActive,
  syncSubscriptionFromStripeObject,
} from "@/lib/stripe/checkout";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const webhookSecret = await getStripeWebhookSecret();
  const stripe = await getStripeClient();

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assinatura inválida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            String(session.subscription),
            { expand: ["items.data"] },
          );
          await syncSubscriptionFromStripeObject(subscription);

          const userId = subscription.metadata.userId;
          const planId = subscription.metadata.planId;
          if (userId && planId) {
            const supabase = getSupabaseAdmin();
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", userId)
              .maybeSingle();
            const plan = await getPlanById(planId);
            if (profile?.email && plan) {
              await notifySubscriptionActive({
                userId,
                email: profile.email,
                planName: plan.name,
              });
            }
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionFromStripeObject(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription.id);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const supabase = getSupabaseAdmin();
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          if (profile) {
            await notifyPaymentFailed(profile.id, profile.email ?? undefined);
          }
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Stripe:", error);
    return NextResponse.json({ error: "Erro ao processar webhook." }, { status: 500 });
  }
}
