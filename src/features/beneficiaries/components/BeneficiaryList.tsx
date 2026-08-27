import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Send, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const { data, isPending, isError, refetch } = useBeneficiaries();
  const removeBeneficiary = useRemoveBeneficiary();
  const [pendingRemoval, setPendingRemoval] = useState<BeneficiaryDto | null>(null);

  if (isPending) return <SkeletonBlock lines={4} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const beneficiaries = data ?? [];

  if (beneficiaries.length === 0) {
    return (
      <EmptyState
        title="Aucun bénéficiaire enregistré"
        description="Enregistrez un compte destinataire pour préparer vos virements."
        action={action}
      />
    );
  }

  return (
    <>
      <ul className="space-y-3" role="list">
        {beneficiaries.map((beneficiary) => (
          <li key={beneficiary.reference}>
            <Card className="flex items-center gap-3 p-4">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-muted-foreground"
              >
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {beneficiaryLabel(beneficiary)}
                </p>
                <p className="text-caption truncate text-muted-foreground">
                  Compte •••• {beneficiary.maskedNumber} · {beneficiary.currency}
                </p>
                {beneficiary.lastUsedAt ? (
                  <p className="text-caption truncate text-muted-foreground">
                    Dernier virement le {formatDate(beneficiary.lastUsedAt)}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/app/transfers/new"
                    search={{ beneficiary: beneficiary.reference }}
                    aria-label={`Envoyer un virement à ${beneficiaryLabel(beneficiary)}`}
                  >
                    <Send className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Envoyer</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Autres actions">
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setPendingRemoval(beneficiary)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        title="Supprimer ce bénéficiaire ?"
        description="Les virements déjà exécutés vers ce bénéficiaire restent visibles dans votre historique."
        confirmLabel="Supprimer"
        tone="danger"
        loading={removeBeneficiary.isPending}
        onConfirm={() => {
          const target = pendingRemoval;
          if (!target) return;
          removeBeneficiary.mutate(target.reference, {
            onSuccess: () => {
              toast.success("Bénéficiaire supprimé");
              setPendingRemoval(null);
            },
            onError: () => toast.error("La suppression n'a pas abouti"),
          });
        }}
      />
    </>
  );
}
