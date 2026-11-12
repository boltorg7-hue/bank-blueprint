import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Search, Send, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import {
  useBeneficiaries,
  useRemoveBeneficiary,
} from "@/features/beneficiaries/hooks/useBeneficiaries";
import type { BeneficiaryDto } from "@/features/beneficiaries/types/beneficiary";
import { formatDate } from "@/lib/format/date";

function beneficiaryLabel(beneficiary: BeneficiaryDto): string {
  return beneficiary.nickname ?? beneficiary.displayName;
}

/**
 * Beneficiary list (§17 – §22). Only the safe display name and the last digits
 * of the destination account are shown — never the full account number.
 */
export function BeneficiaryList({ action }: { action?: React.ReactNode }) {
  const { language } = useLanguage();
  const en = language === "en";
  const { data, isPending, isError, refetch } = useBeneficiaries();
  const removeBeneficiary = useRemoveBeneficiary();
  const [pendingRemoval, setPendingRemoval] = useState<BeneficiaryDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (isPending) return <SkeletonBlock lines={4} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const beneficiaries = data ?? [];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredBeneficiaries = beneficiaries.filter((beneficiary) =>
    [beneficiary.nickname, beneficiary.displayName, beneficiary.maskedNumber, beneficiary.currency]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery)),
  );

  if (beneficiaries.length === 0) {
    return (
      <EmptyState
        title={en ? "No beneficiaries saved" : "Aucun bénéficiaire enregistré"}
        description={
          en
            ? "Save a recipient account to prepare transfers."
            : "Enregistrez un compte destinataire pour préparer vos virements."
        }
        action={action}
      />
    );
  }

  return (
    <>
      <section
        className="space-y-4"
        aria-label={en ? "Saved beneficiaries" : "Bénéficiaires enregistrés"}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {en ? "Your saved recipients" : "Vos destinataires enregistrés"}
            </p>
            <p className="text-caption text-muted-foreground">
              {en
                ? `${beneficiaries.length} saved recipient${beneficiaries.length === 1 ? "" : "s"}`
                : `${beneficiaries.length} bénéficiaire${beneficiaries.length > 1 ? "s" : ""} enregistré${beneficiaries.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                en
                  ? "Search a recipient or account"
                  : "Rechercher un bénéficiaire ou un compte"
              }
              aria-label={en ? "Search beneficiaries" : "Rechercher parmi les bénéficiaires"}
              className="h-11 pl-9 pr-10"
            />
            {searchQuery ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
                aria-label={en ? "Clear search" : "Effacer la recherche"}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>

        {filteredBeneficiaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-sunken/40 px-5 py-8 text-center">
            <Search className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-foreground">
              {en ? "No matching beneficiary" : "Aucun bénéficiaire correspondant"}
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              {en
                ? "Try another name, account suffix or currency."
                : "Essayez un autre nom, une fin de compte ou une devise."}
            </p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchQuery("")}>
              {en ? "Clear search" : "Effacer la recherche"}
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2" role="list">
            {filteredBeneficiaries.map((beneficiary) => (
              <li key={beneficiary.reference} className="min-w-0">
                <Card className="flex h-full min-w-0 flex-col gap-4 p-4 motion-safe:transition-[box-shadow,border-color,transform] motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary"
                    >
                      {beneficiaryLabel(beneficiary).trim().slice(0, 2).toLocaleUpperCase() || (
                        <UserRound className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {beneficiaryLabel(beneficiary)}
                      </p>
                      <p className="mt-1 truncate text-caption text-muted-foreground">
                        {en ? "Account" : "Compte"}{" "}•••• {beneficiary.maskedNumber}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-2 -mt-2 shrink-0"
                          aria-label={en ? "More actions" : "Autres actions"}
                        >
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setPendingRemoval(beneficiary)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                          {en ? "Delete" : "Supprimer"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-caption font-medium text-foreground">
                      {beneficiary.currency}
                    </span>
                    {beneficiary.lastUsedAt ? (
                      <span className="text-caption text-muted-foreground">
                        {en ? "Last transfer" : "Dernier virement"} · {formatDate(beneficiary.lastUsedAt)}
                      </span>
                    ) : (
                      <span className="text-caption text-muted-foreground">
                        {en ? "Ready for your next transfer" : "Prêt pour votre prochain virement"}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto border-t border-border/70 pt-3">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link
                        to="/app/transfers/new"
                        search={{ beneficiary: beneficiary.reference }}
                        aria-label={`${en ? "Send a transfer to" : "Envoyer un virement à"} ${beneficiaryLabel(beneficiary)}`}
                      >
                        <Send className="size-4" aria-hidden="true" />
                        {en ? "Send a transfer" : "Envoyer un virement"}
                      </Link>
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        title={en ? "Delete this beneficiary?" : "Supprimer ce bénéficiaire ?"}
        description={
          en
            ? "Transfers already executed to this beneficiary remain visible in your history."
            : "Les virements déjà exécutés vers ce bénéficiaire restent visibles dans votre historique."
        }
        confirmLabel={en ? "Delete" : "Supprimer"}
        tone="danger"
        loading={removeBeneficiary.isPending}
        onConfirm={() => {
          const target = pendingRemoval;
          if (!target) return;
          removeBeneficiary.mutate(target.reference, {
            onSuccess: () => {
              toast.success(en ? "Beneficiary deleted" : "Bénéficiaire supprimé");
              setPendingRemoval(null);
            },
            onError: () =>
              toast.error(
                en
                  ? "The beneficiary could not be deleted. Please try again."
                  : "La suppression n'a pas abouti. Vous pouvez réessayer.",
              ),
          });
        }}
      />
    </>
  );
}
