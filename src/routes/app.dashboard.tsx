import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownToLine, FileText, Send, Wallet } from "lucide-react";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/feedback";
import { APP_CONFIG } from "@/config/app";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Espace client" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardShell,
});

const QUICK_ACTIONS = [
  { label: "Envoyer de l'argent", icon: Send },
  { label: "Voir mes comptes", icon: Wallet },
  { label: "Télécharger un relevé", icon: FileText },
  { label: "Recevoir un paiement", icon: ArrowDownToLine },
];

function DashboardShell() {
  return (
    <BankingContentContainer width="wide">
      <PageHeader
        title="Bonjour"
        description={`Bienvenue dans votre espace ${APP_CONFIG.name}. Les services bancaires sont activés progressivement.`}
      />

      <section aria-labelledby="accounts-heading" className="space-y-3">
        <h2 id="accounts-heading" className="text-sm font-medium text-foreground">
          Mes comptes
        </h2>
        {/* No fabricated balances: the account service arrives in PROMPT 05. */}
        <EmptyState
          title="Aucune information de compte disponible"
          description="Vos comptes et vos soldes apparaîtront ici dès que le service de comptes sera connecté."
        />
      </section>

      <section aria-labelledby="quick-actions-heading" className="mt-8 space-y-3">
        <h2 id="quick-actions-heading" className="text-sm font-medium text-foreground">
          Actions rapides
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.label}>
                <span
                  aria-disabled="true"
                  className="flex h-full min-h-24 flex-col justify-between rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground"
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="mt-3 block leading-snug">{action.label}</span>
                  <span className="mt-1 text-xs">Bientôt disponible</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="activity-heading" className="mt-8 space-y-3">
        <h2 id="activity-heading" className="text-sm font-medium text-foreground">
          Activité récente
        </h2>
        <EmptyState
          title="Aucune opération à afficher"
          description="Vos opérations s'afficheront ici une fois le grand livre bancaire mis en service."
        />
      </section>
    </BankingContentContainer>
  );
}
