import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { GoogleSignInGate } from "@/components/auth/GoogleSignInGate";
import { DeviceSync } from "@/components/device/DeviceSync";
import { AdWizard } from "@/components/wizard/AdWizard";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <GoogleSignInGate />;
  }

  return (
    <SessionProvider session={session}>
      <DeviceSync />
      <AdWizard />
    </SessionProvider>
  );
}
