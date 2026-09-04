import { NextResponse } from "next/server";
import { getUserBillingStatus } from "@/lib/billing/usage";
import { listGenerationsByUser } from "@/lib/db/generations";
import { formatPlanPrice } from "@/lib/db/plans";
import { getProfile } from "@/lib/db/profiles";
import { getUserSubscription } from "@/lib/db/subscriptions";
import { getPendingAccessRequest } from "@/lib/db/device-access-requests";
import { isUserDeviceWhitelisted } from "@/lib/device/limits";
import { getDeviceIdFromRequest } from "@/lib/device/request";
import { getStripePublishableKey } from "@/lib/stripe/client";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { userMediaUrl } from "@/lib/user/generation-media";
import { requireCurrentUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Perfil indisponível." }, { status: 503 });
    }

    const deviceId = getDeviceIdFromRequest(request);

    const [
      profile,
      billing,
      subscription,
      generations,
      publishableKey,
      deviceWhitelisted,
      pendingAccess,
    ] = await Promise.all([
      getProfile(user.id),
      getUserBillingStatus(user.id),
      getUserSubscription(user.id),
      listGenerationsByUser(user.id, 6),
      getStripePublishableKey(),
      isUserDeviceWhitelisted(user.id),
      deviceId
        ? getPendingAccessRequest(deviceId, user.id)
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      profile: {
        id: user.id,
        email: profile?.email ?? user.email ?? null,
        name: profile?.name ?? user.name ?? null,
        image: profile?.image ?? user.image ?? null,
        createdAt: profile?.createdAt ?? null,
        status: profile?.status ?? "active",
      },
      billing: {
        plan: billing.plan,
        usage: billing.usage,
        limit: billing.limit,
        remaining: billing.remaining,
        periodStart: billing.periodStart,
        priceLabel: formatPlanPrice(billing.plan),
      },
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      recentGenerations: generations.map((gen) => ({
        id: gen.id,
        headline: gen.headline,
        createdAt: gen.createdAt,
        adStyle: gen.adStyle,
        publishTarget: gen.publishTarget,
        feedUrl: userMediaUrl(gen.generatedArtUrl),
        storiesUrl: userMediaUrl(gen.generatedStoriesUrl),
        originalUrl: userMediaUrl(gen.originalPhotoUrl),
      })),
      deviceAccess: {
        whitelisted: deviceWhitelisted,
        pendingRequest: Boolean(pendingAccess),
      },
      stripeConfigured: Boolean(publishableKey),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro.";
    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 401 : 500 },
    );
  }
}
