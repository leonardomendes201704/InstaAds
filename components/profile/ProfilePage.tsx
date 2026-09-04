"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { WizardShell } from "@/components/wizard/WizardShell";
import { GenerationArtLightbox } from "@/components/profile/GenerationArtLightbox";
import { siteConfig } from "@/lib/site";

interface ProfileData {
  profile: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: string | null;
    status: string;
  };
  billing: {
    plan: {
      id: string;
      slug: string;
      name: string;
      monthlyGenerationLimit: number;
      priceCents: number;
      isDefault: boolean;
    };
    usage: number;
    limit: number;
    remaining: number;
    periodStart: string;
    priceLabel: string;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  recentGenerations: Array<{
    id: string;
    headline: string;
    createdAt: string;
    feedUrl?: string;
    storiesUrl?: string;
    originalUrl?: string;
  }>;
  deviceAccess: {
    whitelisted: boolean;
    pendingRequest: boolean;
  };
  stripeConfigured: boolean;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function periodEndLabel(periodStart: string): string {
  const [year, month] = periodStart.split("-").map(Number);
  const end = new Date(year, month, 0);
  return formatDate(end.toISOString());
}

function subscriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Ativa",
    trialing: "Período de teste",
    past_due: "Pagamento pendente",
    canceled: "Cancelada",
  };
  return labels[status] ?? status;
}

export function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<
    ProfileData["recentGenerations"][number] | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile");
      const json = (await res.json()) as ProfileData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar perfil.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch
    void load();
  }, [load]);

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao abrir portal.");
      if (json.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao abrir portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  const initials =
    data?.profile.name
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "U";

  const usageRatio =
    data && data.billing.limit > 0 ? data.billing.usage / data.billing.limit : 0;

  const isPaidPlan = data ? !data.billing.plan.isDefault && data.billing.plan.priceCents > 0 : false;

  return (
    <WizardShell
      step={1}
      title="Meu perfil"
      subtitle="Conta, plano e histórico de gerações."
      showBack={false}
      showBrand
      scrollable
      footer={
        <Link
          href="/"
          className="block w-full rounded-2xl border border-black/10 bg-white py-3 text-center text-sm font-medium text-foreground"
        >
          Voltar ao app
        </Link>
      }
    >
      <div className="mx-auto max-w-lg space-y-5 pb-8">
        {loading ? (
          <p className="text-center text-sm text-muted">Carregando perfil...</p>
        ) : error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : data ? (
          <>
            {/* Conta */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center gap-4">
                {data.profile.image ? (
                  <img
                    src={data.profile.image}
                    alt={data.profile.name ?? "Usuário"}
                    className="h-16 w-16 rounded-full border border-black/10 object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-lg font-semibold text-foreground">
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-foreground">
                    {data.profile.name ?? "Usuário"}
                  </p>
                  <p className="truncate text-sm text-muted">{data.profile.email}</p>
                  {data.profile.createdAt ? (
                    <p className="mt-1 text-xs text-muted">
                      Membro desde {formatDate(data.profile.createdAt)}
                    </p>
                  ) : null}
                </div>
              </div>

              {data.profile.status === "blocked" ? (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  Conta bloqueada. Entre em contato:{" "}
                  <a href={`mailto:${siteConfig.contactEmail}`} className="underline">
                    {siteConfig.contactEmail}
                  </a>
                </p>
              ) : null}
            </section>

            {/* Plano e uso */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Plano atual
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {data.billing.plan.name}
                  </p>
                  <p className="text-sm text-muted">{data.billing.priceLabel}</p>
                </div>
                <p className="text-sm text-muted">
                  {data.billing.plan.monthlyGenerationLimit}/mês
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>
                    {data.billing.usage}/{data.billing.limit} gerações
                  </span>
                  <span>{data.billing.remaining} restantes</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usageRatio >= 1
                        ? "bg-red-500"
                        : usageRatio >= 0.8
                          ? "bg-amber-500"
                          : "bg-accent-purple"
                    }`}
                    style={{ width: `${Math.min(100, usageRatio * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Renova em {periodEndLabel(data.billing.periodStart)}
                </p>
              </div>

              <Link
                href="/planos"
                className="mt-4 block w-full rounded-xl bg-accent-purple py-2.5 text-center text-sm font-medium text-white"
              >
                Ver planos e fazer upgrade
              </Link>

              {isPaidPlan && data.stripeConfigured ? (
                <button
                  type="button"
                  disabled={portalLoading}
                  onClick={() => void handlePortal()}
                  className="mt-2 w-full rounded-xl border border-black/10 py-2.5 text-sm font-medium text-foreground disabled:opacity-60"
                >
                  {portalLoading ? "Abrindo..." : "Gerenciar assinatura"}
                </button>
              ) : null}
            </section>

            {/* Assinatura */}
            {data.subscription && isPaidPlan ? (
              <section className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Assinatura
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Status:{" "}
                  <span className="font-medium">
                    {subscriptionStatusLabel(data.subscription.status)}
                  </span>
                </p>
                {data.subscription.currentPeriodEnd ? (
                  <p className="mt-1 text-sm text-muted">
                    Próxima renovação:{" "}
                    {formatDate(data.subscription.currentPeriodEnd)}
                  </p>
                ) : null}
                {data.subscription.cancelAtPeriodEnd ? (
                  <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Assinatura será cancelada ao fim do período atual.
                  </p>
                ) : null}
              </section>
            ) : null}

            {/* Dispositivo */}
            {data.deviceAccess.pendingRequest ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Solicitação de acesso neste dispositivo aguardando aprovação do
                administrador.
              </p>
            ) : data.deviceAccess.whitelisted ? (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-800">
                Acesso liberado neste dispositivo.
              </p>
            ) : null}

            {/* Gerações recentes */}
            <section className="rounded-2xl border border-black/10 bg-white p-5">
              <p className="text-sm font-medium text-foreground">Gerações recentes</p>

              {data.recentGenerations.length === 0 ? (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted">Nenhuma geração ainda.</p>
                  <Link
                    href="/"
                    className="mt-2 inline-block text-sm font-medium text-accent-purple"
                  >
                    Criar anúncio →
                  </Link>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {data.recentGenerations.map((gen) => {
                    const previewUrl = gen.feedUrl ?? gen.storiesUrl;
                    const canOpen = Boolean(previewUrl);

                    return (
                      <div
                        key={gen.id}
                        className="overflow-hidden rounded-xl border border-black/10 bg-surface"
                      >
                        {canOpen ? (
                          <button
                            type="button"
                            onClick={() => setSelectedGeneration(gen)}
                            className="block w-full cursor-pointer text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple"
                            aria-label={`Abrir arte: ${gen.headline}`}
                          >
                            <img
                              src={previewUrl}
                              alt={gen.headline}
                              className="aspect-[4/5] w-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="flex aspect-[4/5] items-center justify-center text-xs text-muted">
                            Sem preview
                          </div>
                        )}
                        <div className="p-2">
                          <p className="truncate text-xs font-medium text-foreground">
                            {gen.headline}
                          </p>
                          <p className="text-[10px] text-muted">
                            {formatDateTime(gen.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Rodapé */}
            <section className="space-y-3 pt-2">
              <div className="flex justify-center gap-4 text-xs text-muted">
                <Link href="/termos" className="hover:text-foreground">
                  Termos
                </Link>
                <Link href="/privacidade" className="hover:text-foreground">
                  Privacidade
                </Link>
              </div>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-medium text-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </section>
          </>
        ) : null}
      </div>

      {selectedGeneration ? (
        <GenerationArtLightbox
          headline={selectedGeneration.headline}
          createdAtLabel={formatDateTime(selectedGeneration.createdAt)}
          feedUrl={selectedGeneration.feedUrl}
          storiesUrl={selectedGeneration.storiesUrl}
          onClose={() => setSelectedGeneration(null)}
        />
      ) : null}
    </WizardShell>
  );
}
