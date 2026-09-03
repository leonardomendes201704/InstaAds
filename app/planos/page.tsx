import { PlansPage } from "@/components/billing/PlansPage";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PlanosRoutePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <SessionProvider session={session}>
      <PlansPage />
    </SessionProvider>
  );
}
