import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, LogOut } from "lucide-react";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/features/auth/hooks/useSessionUser";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { canTransact, transactionalBlockedReason } from "@/features/customer-shell/lib/route-access";
import { CUSTOMER_MORE_GROUPS } from "@/config/navigation";

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
  const signOut = useSignOut();
  const { summary } = useCustomerSummary();
  const transactional = summary ? canTransact(summary.lifecycleState) : false;
  const blockedReason = summary ? transactionalBlockedReason(summary.lifecycleState) : null;

  return (
    <BankingContentContainer width="narrow">
      <PageHeader title="Plus" description="Tous les services de votre espace client." />

      <div className="space-y-6">
        {CUSTOMER_MORE_GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`group-${group.title}`} className="space-y-2">
            <h2
              id={`group-${group.title}`}
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {group.title}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
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
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <span className="text-xs">{blockedReason ?? "Indisponible"}</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="touch-target flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-sunken"
                    >
                      <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
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

        <Button variant="outline" className="w-full" onClick={() => void signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          Se déconnecter
        </Button>
      </div>
    </BankingContentContainer>
  );
}
