export default function LegalLayout({ children }: LayoutProps<"/privacidade" | "/termos">) {
  return <div className="h-dvh overflow-y-auto">{children}</div>;
}
