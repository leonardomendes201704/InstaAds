import { ProfilePage } from "@/components/profile/ProfilePage";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { DeviceSync } from "@/components/device/DeviceSync";
import { redirect } from "next/navigation";

export default async function PerfilRoutePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <SessionProvider session={session}>
      <DeviceSync />
      <ProfilePage />
    </SessionProvider>
  );
}
