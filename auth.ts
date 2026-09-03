import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { logActivity } from "@/lib/db/activity";
import { ensureUserDefaultPlan } from "@/lib/db/plans";
import { getProfile, upsertProfile } from "@/lib/db/profiles";
import { sendWelcomeEmail } from "@/lib/email/send";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return false;

      if (isSupabaseConfigured()) {
        const existing = await getProfile(user.id);
        if (existing?.status === "blocked") {
          return false;
        }

        const isNewUser = !existing;

        await upsertProfile({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        });

        await ensureUserDefaultPlan(user.id);

        await logActivity({
          userId: user.id,
          type: "user.sign_in",
          metadata: { email: user.email },
        });

        if (isNewUser && user.email) {
          void sendWelcomeEmail({
            userId: user.id,
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
