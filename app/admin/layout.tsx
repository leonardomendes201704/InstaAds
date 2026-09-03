import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InstaAds Admin",
  description: "Painel administrativo de gerações InstaAds.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="h-dvh overflow-y-auto bg-surface text-foreground">
      {children}
    </div>
  );
}
