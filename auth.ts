import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { logActivity } from "@/lib/db/activity";
import { ensureUserDefaultPlan } from "@/lib/db/plans";
import {
  getProfile,
  removeDuplicateProfilesForEmail,
  upsertProfile,
} from "@/lib/db/profiles";
import { sendWelcomeEmail } from "@/lib/email/send";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function resolveOAuthUserId(input: {
  account?: { providerAccountId?: string | null } | null;
  profile?: unknown;
  user?: { id?: string | null } | null;
}): string | null {
  if (input.account?.providerAccountId) {
    return input.account.providerAccountId;
  }

  if (
    input.profile &&
    typeof input.profile === "object" &&
    "sub" in input.profile &&
    typeof input.profile.sub === "string"
  ) {
    return input.profile.sub;
  }

  return input.user?.id ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    jwt({ token, user, account, profile }) {
      const stableId = resolveOAuthUserId({ account, profile, user });
      if (stableId) {
        token.sub = stableId;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      const userId = resolveOAuthUserId({ account, profile, user });
      if (!userId) return false;

      if (isSupabaseConfigured()) {
        if (user.email) {
          await removeDuplicateProfilesForEmail(user.email, userId);
        }

        const existing = await getProfile(userId);
        if (existing?.status === "blocked") {
          return false;
        }

        const isNewUser = !existing;

        await upsertProfile({
          id: userId,
          email: user.email,
          name: user.name,
          image: user.image,
        });

        await ensureUserDefaultPlan(userId);

        await logActivity({
          userId,
          type: "user.sign_in",
          metadata: { email: user.email },
        });

        if (isNewUser && user.email) {
          void sendWelcomeEmail({
            userId,
            email: user.email,
            name: user.name ?? undefined,
          });
        }
      }

      return true;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  trustHost: true,
});
