import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Send, ShieldCheck, Wallet } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { Stepper } from "@/components/ui/stepper";
import { StatusBadge } from "@/components/ui/status-badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Accordion } from "@/components/ui/accordion";
import {
  AccountCard,
  AmountText,
  BalanceDisplay,
  KpiCard,
  MaskedIdentifier,
  TransactionRow,
  TransferProgress,
  TransferSummaryCard,
} from "@/components/data-display";
import { FaqItem, FeatureCard, Metric, SecurityFeature, TrustBadge } from "@/components/marketing";
import { PrivacyModeToggle } from "@/components/providers/PrivacyModeProvider";

/**
 * Internal design-system reference (PROMPT 01 validation surface).
 * Not linked from any navigation and excluded from indexing.
 */
export const Route = createFileRoute("/dev/design-system")({
  head: () => ({
    meta: [
      { title: "Design system — référence interne" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Référence interne des composants du design system." },
    ],
  }),
  component: DesignSystemPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border py-8">
      <h2 className="text-heading-lg mb-4 text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function DesignSystemPage() {
  const [amount, setAmount] = useState("1250,00");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-display text-foreground">Design system</h1>
            <p className="text-body mt-2 text-muted-foreground">
              Référence visuelle des fondations, primitives financières et blocs publics.
            </p>
          </div>
          <PrivacyModeToggle />
        </header>

        <Section title="Typographie">
          <div className="space-y-2">
            <p className="text-display text-foreground">Display</p>
            <p className="text-heading-xl text-foreground">Heading XL</p>
            <p className="text-heading-md text-foreground">Heading MD</p>
            <p className="text-body text-foreground">Corps de texte lisible et sobre.</p>
            <p className="text-caption text-muted-foreground">Légende secondaire</p>
            <p className="text-numeric text-foreground">1 234 567,89 — chiffres tabulaires</p>
          </div>
        </Section>

        <Section title="Boutons & états">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Action principale</Button>
            <Button variant="brand">Marque</Button>
            <Button variant="outline">Secondaire</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="destructive">Irréversible</Button>
            <Button loading loadingLabel="Traitement…">Envoyer</Button>
            <Button disabled>Indisponible</Button>
            <Spinner label="Chargement" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge tone="success" label="Exécuté" />
            <StatusBadge tone="pending" label="En attente" />
            <StatusBadge tone="failed" label="Échoué" />
            <StatusBadge tone="info" label="En revue" />
            <StatusBadge tone="neutral" label="Brouillon" />
          </div>
        </Section>

        <Section title="Primitives financières">
          <div className="grid gap-4 sm:grid-cols-2">
            <AccountCard
              name="Compte courant"
              identifier="FR7630006000011234567890189"
              balance={4820.35}
              statusLabel="Actif"
            />
            <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
              <BalanceDisplay label="Solde total" amount={12984.4} hint="Mis à jour à l'instant" />
              <MaskedIdentifier label="IBAN" value="FR7630006000011234567890189" />
              <div className="flex items-center gap-3">
                <AmountText amount={250} direction="credit" />
                <AmountText amount={-89.9} direction="debit" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <KpiCard label="Entrées du mois" value="+ 3 210,00 €" icon={Wallet} trend={{ direction: "up", label: "+8,2 %" }} />
            <KpiCard label="Sorties du mois" value="- 1 940,20 €" icon={Send} trend={{ direction: "down", label: "-3,1 %", tone: "negative" }} />
            <KpiCard label="Virements en attente" value="2" icon={Lock} hint="Traitement sous 24 h" />
          </div>

          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface p-2">
            <TransactionRow
              title="Virement reçu — Salaire"
              subtitle="Vaultis SA"
              amount={2450}
              direction="credit"
              date={new Date()}
              statusLabel="Exécuté"
            />
            <TransactionRow
              title="Paiement — Abonnement"
              subtitle="Prélèvement"
              amount={12.99}
              direction="debit"
              date={Date.now() - 86_400_000}
              statusLabel="En attente"
              statusTone="pending"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TransferSummaryCard
              amount={1250}
              fromLabel="Compte courant"
              fromIdentifier="FR7630006000011234567890189"
              toLabel="Marie Lefèvre"
              toIdentifier="FR7630004000031234567890143"
              reference="Loyer août"
              rows={[{ label: "Frais", value: "0,00 €" }, { label: "Exécution", value: "Immédiate" }]}
            />
            <div className="rounded-xl border border-border bg-surface p-4">
              <TransferProgress
                stages={[
                  { id: "1", label: "Demande enregistrée", state: "done", timestamp: "14:32" },
                  { id: "2", label: "Contrôles de sécurité", state: "current" },
                  { id: "3", label: "Fonds crédités", state: "upcoming" },
                ]}
              />
            </div>
          </div>
        </Section>

        <Section title="Saisie & flux guidés">
          <div className="max-w-md space-y-4">
            <Stepper
              steps={[
                { id: "a", label: "Bénéficiaire" },
                { id: "b", label: "Montant" },
                { id: "c", label: "Confirmation" },
              ]}
              currentIndex={1}
            />
            <MoneyInput value={amount} onValueChange={(raw) => setAmount(raw)} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSheetOpen(true)}>
                Bottom sheet
              </Button>
              <Button onClick={() => setConfirmOpen(true)}>Confirmation</Button>
            </div>
          </div>
        </Section>

        <Section title="Blocs publics">
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={Wallet}
              title="Comptes clairs"
              description="Soldes, opérations et relevés présentés sans jargon."
            />
            <FeatureCard
              icon={Send}
              title="Virements suivis"
              description="Chaque étape d'un virement est visible, du dépôt à l'exécution."
            />
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <SecurityFeature
              icon={ShieldCheck}
              title="Chiffrement en transit et au repos"
              description="Les données sensibles ne sont jamais exposées côté client."
            />
            <SecurityFeature
              icon={Lock}
              title="Accès cloisonnés"
              description="Client et back-office disposent d'espaces strictement séparés."
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-6">
            <Metric value="24/7" label="Suivi des opérations" />
            <Metric value="2 min" label="Ouverture de dossier" />
            <TrustBadge label="Contrôles anti-fraude" />
          </div>
          <Accordion type="single" collapsible className="mt-6 max-w-2xl">
            <FaqItem
              value="q1"
              question="Comment sont calculés les soldes ?"
              answer="Les soldes sont une projection serveur du grand livre en partie double."
            />
          </Accordion>
        </Section>
      </div>

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Options du virement"
        description="Choix secondaires présentés au format natif mobile."
        footer={<Button size="block" onClick={() => setSheetOpen(false)}>Fermer</Button>}
      >
        <p className="text-body-sm text-muted-foreground">Contenu de la feuille.</p>
      </BottomSheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmer le virement ?"
        description="Cette opération ne peut pas être annulée une fois exécutée."
        summary={
          <TransferSummaryCard
            className="border-0 bg-transparent p-0"
            amount={1250}
            fromLabel="Compte courant"
            toLabel="Marie Lefèvre"
          />
        }
        confirmLabel="Confirmer"
        onConfirm={() => setConfirmOpen(false)}
      />
    </PublicLayout>
  );
}
