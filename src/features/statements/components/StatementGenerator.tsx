import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomerAccounts } from "@/features/accounts/hooks/useAccounts";
import { useRequestStatement } from "@/features/statements/hooks/useStatements";
import {
  statementErrorMessage,
  type StatementPeriodKind,
} from "@/features/statements/types/statement";

/**
 * Statement request form (PROMPT 09 §44 – §54).
 *
 * The client only picks an account and a period: every figure, the
 * reconciliation and the PDF are produced server-side.
 */

/** Last 12 closed months, as UTC boundaries (period_end exclusive). */
function monthlyOptions(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return {
      value: start.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(start),
      start: start.toISOString(),
      end: end.toISOString(),
    };
  });
}

export function StatementGenerator() {
  const accounts = useCustomerAccounts();
  const request = useRequestStatement();
  const months = useMemo(() => monthlyOptions(), []);

  const [accountReference, setAccountReference] = useState("");
  const [periodKind, setPeriodKind] = useState<StatementPeriodKind>("MONTHLY");
  const [month, setMonth] = useState(months[1]?.value ?? months[0]?.value ?? "");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const selectableAccounts = accounts.data ?? [];
  const effectiveAccount =
    accountReference ||
    selectableAccounts.find((account) => account.isPrimary)?.reference ||
    selectableAccounts[0]?.reference ||
    "";

  const canSubmit =
    effectiveAccount.length > 0 &&
    (periodKind === "MONTHLY" ? month.length > 0 : customStart.length > 0 && customEnd.length > 0);

  const submit = () => {
    const selectedMonth = months.find((option) => option.value === month);
    const periodStart =
      periodKind === "MONTHLY"
        ? (selectedMonth?.start ?? "")
        : new Date(`${customStart}T00:00:00.000Z`).toISOString();
    const periodEnd =
      periodKind === "MONTHLY"
        ? (selectedMonth?.end ?? "")
        : new Date(new Date(`${customEnd}T00:00:00.000Z`).getTime() + 86_400_000).toISOString();

    if (!periodStart || !periodEnd) {
      toast.error("La période sélectionnée n'est pas valide.");
      return;
    }
    if (new Date(periodEnd) <= new Date(periodStart)) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return;
    }

    request.mutate(
      { accountReference: effectiveAccount, periodStart, periodEnd, periodKind },
      {
        onSuccess: (statement) => {
          if (statement.status === "READY") toast.success("Relevé officiel disponible");
          else if (statement.status === "FAILED")
            toast.error(statementErrorMessage(statement.failureCode));
          else toast.info("Relevé en préparation.");
        },
        onError: (error) => toast.error(statementErrorMessage(error.message)),
      },
    );
  };

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Éditer un relevé</h2>
        <p className="text-caption text-muted-foreground">
          Les relevés sont figés à l'émission : les montants reflètent la comptabilité de la période
          demandée.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="statement-account">Compte</Label>
          <Select
            value={effectiveAccount}
            onValueChange={setAccountReference}
            disabled={accounts.isPending || selectableAccounts.length === 0}
          >
            <SelectTrigger id="statement-account">
              <SelectValue placeholder="Sélectionnez un compte" />
            </SelectTrigger>
            <SelectContent>
              {selectableAccounts.map((account) => (
                <SelectItem key={account.reference} value={account.reference}>
                  {account.displayName} · •••• {account.maskedNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="statement-period-kind">Type de période</Label>
          <Select
            value={periodKind}
            onValueChange={(value) => setPeriodKind(value as StatementPeriodKind)}
          >
            <SelectTrigger id="statement-period-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Relevé mensuel</SelectItem>
              <SelectItem value="CUSTOM">Période personnalisée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periodKind === "MONTHLY" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="statement-month">Mois</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="statement-month">
                <SelectValue placeholder="Sélectionnez un mois" />
              </SelectTrigger>
              <SelectContent>
                {months.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="statement-start">Du</Label>
              <Input
                id="statement-start"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statement-end">Au (inclus)</Label>
              <Input
                id="statement-end"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={!canSubmit || request.isPending}
        onClick={submit}
      >
        <FileDown aria-hidden className="mr-2 size-4" />
        {request.isPending ? "Édition en cours…" : "Éditer le relevé"}
      </Button>
    </Card>
  );
}
