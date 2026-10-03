import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, LogOut } from "lucide-react";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/features/auth/hooks/useSessionUser";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { canTransact, transactionalBlockedReason } from "@/features/customer-shell/lib/route-access";
import { CUSTOMER_MORE_GROUPS } from "@/config/navigation";
import { englishNavLabel } from "@/components/navigation/CustomerSidebar";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const Route = createFileRoute("/app/more")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Plus — RFC" },
      { name: "description", content: "Accès aux services secondaires de votre espace client." },
    ],
  }),
  component: MoreRoute,
});

function MoreRoute() {
  const { language } = useLanguage();
  const en = language === "en";
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const signOut = useSignOut();
  const { summary } = useCustomerSummary();
  const transactional = summary ? canTransact(summary.lifecycleState) : false;
  const blockedReason = summary ? transactionalBlockedReason(summary.lifecycleState) : null;

  return (
    <BankingContentContainer width="narrow">
      <PageHeader title={en ? "More" : "Plus"} description={en ? "Your banking services, organised by topic." : "Tous les services de votre espace client, classés par rubrique."} />

      <PageSection className="grid gap-6 sm:grid-cols-2 sm:items-start">
        {CUSTOMER_MORE_GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`group-${group.title}`} className="min-w-0 space-y-2">
            <h2
              id={`group-${group.title}`}
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {en ? ({ Banque: "Banking", Documents: "Documents", Échanges: "Communication", "Mon compte": "My account" } as Record<string, string>)[group.title] ?? group.title : group.title}
            </h2>
            <ul className="native-list divide-y divide-border">
              {group.items.map((item) => {
                const Icon = item.icon;
                const blocked = Boolean(item.transactional) && !transactional;

                if (blocked) {
                  return (
                    <li key={item.label}>
                      <span
                        aria-disabled="true"
                        className="touch-target flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground"
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{en ? englishNavLabel(item.label) : item.label}</span>
                        <span className="max-w-28 text-right text-xs leading-tight">{blockedReason ?? (en ? "Unavailable" : "Indisponible")}</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      aria-current={pathname === item.to || pathname.startsWith(item.to + "/") ? "page" : undefined}
                      className="touch-target flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-foreground transition-colors hover:bg-surface-sunken aria-[current=page]:bg-brand/8 aria-[current=page]:font-medium"
                    >
                      <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{en ? englishNavLabel(item.label) : item.label}</span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <Button variant="outline" className="w-full sm:col-span-2" onClick={() => void signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          {en ? "Sign out" : "Se déconnecter"}
        </Button>
      </PageSection>
    </BankingContentContainer>
  );
}
