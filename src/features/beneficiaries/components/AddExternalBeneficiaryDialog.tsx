import { useMemo, useState } from "react";
import { AlertTriangle, Landmark } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  useAddExternalBeneficiary,
  useSupportedDestinations,
} from "@/features/beneficiaries/hooks/useBeneficiaries";

const ERRORS: Record<string, string> = {
  DESTINATION_IS_INTERNAL:
    "Ce compte est détenu chez nous : enregistrez-le comme bénéficiaire de notre banque, le virement sera immédiat et sans frais.",
  DESTINATION_NOT_SUPPORTED:
    "Nous ne desservons pas encore cette destination. Aucun bénéficiaire n'a été enregistré.",
  INVALID_DESTINATION: "Les coordonnées saisies ne sont pas valides. Vérifiez-les auprès du bénéficiaire.",
  ACCOUNT_RESTRICTED:
    "Votre compte ne permet pas d'ajouter un bénéficiaire pour le moment.",
};

/**
 * External beneficiary registration (PROMPT 08 §61 – §64).
 *
 * The customer only picks a destination the bank can actually reach, and is
 * told plainly that an external transfer is not instantaneous. Nothing is
 * created client-side: the server refuses an account held with us.
 */
export function AddExternalBeneficiaryDialog({
  trigger,
  onAdded,
}: {
  trigger?: React.ReactNode;
  onAdded?: (reference: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [railCode, setRailCode] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bankName, setBankName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  const railsQuery = useSupportedDestinations();
  const add = useAddExternalBeneficiary();

  const rails = railsQuery.data ?? [];
  const rail = useMemo(
    () => rails.find((item) => item.code === railCode) ?? rails[0],
    [rails, railCode],
  );

  const normalizedIdentifier = identifier.replace(/\s+/g, "").toUpperCase();
  const canSubmit =
    Boolean(rail) &&
    displayName.trim().length >= 2 &&
    bankName.trim().length >= 2 &&
    /^[A-Z0-9-]{6,40}$/.test(normalizedIdentifier);

  function reset() {
    setDisplayName("");
    setBankName("");
    setIdentifier("");
    setRoutingCode("");
    setNickname("");
    setError(null);
  }

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
          <Button variant="outline">
            <Landmark className="size-4" aria-hidden="true" />
            Bénéficiaire dans une autre banque
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="safe-pb max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bénéficiaire dans une autre banque</DialogTitle>
          <DialogDescription>
            Un virement vers une autre banque demande des vérifications et n'est pas instantané.
            Vous suivrez chaque étape depuis le détail du virement.
          </DialogDescription>
        </DialogHeader>

        {rails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune destination externe n'est desservie actuellement. Vous pouvez toujours envoyer un
            virement vers un compte détenu chez nous.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="external-rail">Destination</Label>
              <Select value={rail?.code ?? ""} onValueChange={(value) => setRailCode(value)}>
                <SelectTrigger id="external-rail" className="h-12">
                  <SelectValue placeholder="Choisir une destination" />
                </SelectTrigger>
                <SelectContent>
                  {rails.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.displayName} · {item.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-name">Nom du bénéficiaire</Label>
              <Input
                id="external-name"
                value={displayName}
                maxLength={120}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setError(null);
                }}
                placeholder="Nom figurant sur le compte destinataire"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-bank">Banque destinataire</Label>
              <Input
                id="external-bank"
                value={bankName}
                maxLength={120}
                onChange={(event) => setBankName(event.target.value)}
                placeholder="Ex. Republic Bank Limited"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-identifier">Numéro de compte ou IBAN</Label>
              <Input
                id="external-identifier"
                autoComplete="off"
                spellCheck={false}
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setError(null);
                }}
                placeholder="Ex. 0098765432"
              />
              <p className="text-caption text-muted-foreground">
                Nous n'affichons ensuite que les derniers chiffres de ce compte.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-routing">Code d'acheminement / BIC (optionnel)</Label>
              <Input
                id="external-routing"
                autoComplete="off"
                spellCheck={false}
                value={routingCode}
                maxLength={34}
                onChange={(event) => setRoutingCode(event.target.value)}
                placeholder="Ex. RBTTTTPX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-nickname">Libellé (optionnel)</Label>
              <Input
                id="external-nickname"
                value={nickname}
                maxLength={60}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Ex. Fournisseur, Famille"
              />
            </div>

            {error ? (
              <p role="alert" className="text-caption flex items-start gap-2 text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={!canSubmit || add.isPending}
                onClick={() => {
                  if (!rail) return;
                  setError(null);
                  add.mutate(
                    {
                      displayName: displayName.trim(),
                      bankName: bankName.trim(),
                      identifier: normalizedIdentifier,
                      country: rail.country,
                      currency: rail.currency,
                      routingCode: routingCode.replace(/\s+/g, "").toUpperCase(),
                      nickname: nickname.trim(),
                    },
                    {
                      onSuccess: (created) => {
                        toast.success("Bénéficiaire enregistré");
                        setOpen(false);
                        reset();
                        onAdded?.(created.reference);
                      },
                      onError: (mutationError) => {
                        const code = String(mutationError.message ?? "");
                        const known = Object.keys(ERRORS).find((key) => code.includes(key));
                        setError(
                          known
                            ? (ERRORS[known] as string)
                            : "L'enregistrement n'a pas abouti. Vérifiez les coordonnées, puis réessayez.",
                        );
                      },
                    },
                  );
                }}
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
