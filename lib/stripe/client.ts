import Stripe from "stripe";
import { getPlatformSettings } from "@/lib/db/settings";

let stripeClient: Stripe | null = null;
let stripeKeyUsed = "";

export async function getStripeClient(): Promise<Stripe | null> {
  const settings = await getPlatformSettings();
  const secretKey = settings.stripeSecretKey;

  if (!secretKey) return null;

  if (!stripeClient || stripeKeyUsed !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeKeyUsed = secretKey;
  }

  return stripeClient;
}

export async function getStripePublishableKey(): Promise<string> {
  const settings = await getPlatformSettings();
  return settings.stripePublishableKey;
}

export async function getStripeWebhookSecret(): Promise<string> {
  const settings = await getPlatformSettings();
  return settings.stripeWebhookSecret;
}
