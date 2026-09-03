import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/site";

interface LegalDocumentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function LegalDocumentLayout({
  title,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-dvh bg-white text-foreground">
      <header className="border-b border-black/10 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" aria-label="Voltar ao InstaAds">
            <Logo height={32} />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-accent-purple hover:underline"
          >
            Voltar ao app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          Última atualização: {siteConfig.lastUpdated}
        </p>
        <article className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-foreground sm:text-base">
          {children}
        </article>
      </main>

      <footer className="border-t border-black/10 px-4 py-6 text-center text-xs text-muted">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos
          reservados.
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/privacidade" className="hover:text-foreground">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="hover:text-foreground">
            Termos de Serviço
          </Link>
        </div>
      </footer>
    </div>
  );
}
