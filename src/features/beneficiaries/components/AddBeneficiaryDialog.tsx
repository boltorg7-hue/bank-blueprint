import { useState } from "react";
import { AlertTriangle, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  useAddBeneficiary,
  useResolveDestination,
} from "@/features/beneficiaries/hooks/useBeneficiaries";
import type { ResolvedDestinationDto } from "@/features/beneficiaries/types/beneficiary";

/**
 * Two-step beneficiary registration (§12 – §16).
 * Step 1: the customer enters the destination account identifier.
 * Step 2: the server returns a MINIMAL confirmation payload (safe display name
 * + last digits). Nothing else about the recipient is ever revealed.
 */
export function AddBeneficiaryDialog({
  trigger,
  onAdded,
}: {
  trigger?: React.ReactNode;
  onAdded?: (reference: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [nickname, setNickname] = useState("");
  const [resolved, setResolved] = useState<ResolvedDestinationDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolve = useResolveDestination();
  const add = useAddBeneficiary();

  function reset() {
    setIdentifier("");
    setNickname("");
    setResolved(null);
    setError(null);
  }

  const normalized = identifier.replace(/\s+/g, "").toUpperCase();
  const identifierValid = /^[A-Z0-9-]{6,40}$/.test(normalized);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <UserPlus className="size-4" aria-hidden="true" />
            Ajouter un bénéficiaire
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="safe-pb max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
          <DialogDescription>
            Enregistrez un compte détenu chez nous à partir de son numéro de compte ou de son IBAN.
          </DialogDescription>
        </DialogHeader>

        {resolved === null ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiary-identifier">Numéro de compte ou IBAN</Label>
              <Input
                id="beneficiary-identifier"
                autoComplete="off"
                spellCheck={false}
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setError(null);
                }}
                placeholder="Ex. 0012345678 ou TT00RFC…"
                aria-invalid={error !== null || undefined}
              />
              <p className="text-caption text-muted-foreground">
                Nous vérifions le compte avant tout enregistrement. Aucun virement n'est déclenché à
                cette étape.
              </p>
            </div>

            {error ? (
              <p role="alert" className="text-caption flex items-start gap-2 text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={!identifierValid || resolve.isPending}
                onClick={() => {
                  setError(null);
                  resolve.mutate(normalized, {
                    onSuccess: (result) => {
                      if (!result) {
                        setError(
                          "Aucun compte actif ne correspond à cet identifiant. Vérifiez la saisie auprès du bénéficiaire.",
                        );
                        return;
                      }
                      setResolved(result);
                    },
                    onError: () =>
                      setError("La vérification n'a pas abouti. Vous pouvez réessayer."),
                  });
                }}
              >
                {resolve.isPending ? <Spinner className="size-4" /> : null}
                Vérifier le compte
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-sunken p-3">
              <p className="text-caption text-muted-foreground">Compte vérifié</p>
              <p className="text-sm font-semibold text-foreground">{resolved.displayName}</p>
              <p className="text-caption text-muted-foreground">
                Compte •••• {resolved.maskedNumber} · {resolved.currency}
              </p>
              {resolved.isOwnAccount ? (
                <p className="text-caption mt-2 text-info">
                  Ce compte vous appartient : il apparaîtra comme un virement entre vos comptes.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiary-nickname">Libellé (optionnel)</Label>
              <Input
                id="beneficiary-nickname"
                value={nickname}
                maxLength={60}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Ex. Loyer, Épargne famille"
              />
            </div>

            {error ? (
              <p role="alert" className="text-caption flex items-start gap-2 text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setResolved(null)}
              >
                Modifier la saisie
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={add.isPending}
                onClick={() =>
                  add.mutate(
                    { identifier: normalized, nickname: nickname.trim() || null },
                    {
                      onSuccess: (created) => {
                        toast.success("Bénéficiaire enregistré");
                        setOpen(false);
                        reset();
                        onAdded?.(created.reference);
                      },
                      onError: () =>
                        setError(
                          "L'enregistrement n'a pas abouti. Vérifiez le statut de votre compte, puis réessayez.",
                        ),
                    },
                  )
                }
              >
                {add.isPending ? <Spinner className="size-4" /> : null}
                Enregistrer le bénéficiaire
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
