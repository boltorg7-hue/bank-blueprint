import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CustomerTransactionStatus,
  TransactionDateRangePreset,
  TransactionDirection,
  TransactionFilterState as Filters,
} from "@/features/transactions/types/transaction";

/**
 * Filter controls (§89 – §92). On mobile the whole set opens in a bottom
 * sheet; on desktop it becomes an inline toolbar. Every control has a label.
 */
const PRESETS: { value: TransactionDateRangePreset; label: string }[] = [
  { value: "ALL", label: "Toutes les dates" },
  { value: "TODAY", label: "Aujourd'hui" },
  { value: "LAST_7_DAYS", label: "7 derniers jours" },
  { value: "THIS_MONTH", label: "Ce mois-ci" },
  { value: "LAST_MONTH", label: "Le mois dernier" },
  { value: "CUSTOM", label: "Période personnalisée" },
];

const DIRECTIONS = [
  { value: "ALL", label: "Toutes les opérations" },
  { value: "INCOMING", label: "Entrées d'argent" },
  { value: "OUTGOING", label: "Sorties d'argent" },
];

const STATUSES = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "PENDING", label: "En attente" },
  { value: "PROCESSING", label: "En cours" },
  { value: "REVERSED", label: "Contre-passé" },
  { value: "FAILED", label: "Échoué" },
];

const CATEGORIES = [
  { value: "ALL", fr: "Toutes les catégories", en: "All categories" },
  { value: "TRANSFER", fr: "Virements", en: "Transfers" },
  { value: "FUNDING", fr: "Approvisionnements", en: "Funding" },
  { value: "FEE", fr: "Frais", en: "Fees" },
  { value: "REFUND", fr: "Remboursements", en: "Refunds" },
  { value: "ADJUSTMENT", fr: "Régularisations", en: "Adjustments" },
  { value: "REVERSAL", fr: "Contre-passations", en: "Reversals" },
  { value: "ACCOUNT_OPENING", fr: "Ouvertures de compte", en: "Account openings" },
];

export function amountToMinor(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}

function validAmount(value: string): boolean {
  return !value.trim() || amountToMinor(value) !== null;
}

function validRange(filters: Filters): boolean {
  const min = amountToMinor(filters.minAmount);
  const max = amountToMinor(filters.maxAmount);
  return validAmount(filters.minAmount) && validAmount(filters.maxAmount) &&
    (min === null || max === null || min <= max) &&
    (filters.datePreset !== "CUSTOM" || !filters.from || !filters.to || filters.from < filters.to);
}

function dayAfter(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + 86_400_000).toISOString();
}

export const EMPTY_FILTERS: Filters = {
  type: "ALL",
  minAmount: "",
  maxAmount: "",
  direction: "ALL",
  status: "ALL",
  datePreset: "ALL",
  search: "",
  from: null,
  to: null,
};

export function activeFilterCount(filters: Filters): number {
  let count = 0;
  if (filters.direction && filters.direction !== "ALL") count += 1;
  if (filters.status && filters.status !== "ALL") count += 1;
  if (filters.datePreset && filters.datePreset !== "ALL") count += 1;
  if (filters.search) count += 1;
  if (filters.type !== "ALL") count += 1;
  if (filters.minAmount || filters.maxAmount) count += 1;
  return count;
}

function FilterFields({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="filter-category">{en ? "Category" : "Catégorie"}</Label>
        <Select value={filters.type} onValueChange={(value) => onChange({ ...filters, type: value })}>
          <SelectTrigger id="filter-category" className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((option) => <SelectItem key={option.value} value={option.value}>{en ? option.en : option.fr}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-min-amount">{en ? "Minimum amount (USD)" : "Montant minimum (USD)"}</Label>
        <Input id="filter-min-amount" className="h-11" type="text" inputMode="decimal" placeholder="0,00" value={filters.minAmount} onChange={(event) => onChange({ ...filters, minAmount: event.target.value })} aria-invalid={!validAmount(filters.minAmount)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-max-amount">{en ? "Maximum amount (USD)" : "Montant maximum (USD)"}</Label>
        <Input id="filter-max-amount" className="h-11" type="text" inputMode="decimal" placeholder="0,00" value={filters.maxAmount} onChange={(event) => onChange({ ...filters, maxAmount: event.target.value })} aria-invalid={!validAmount(filters.maxAmount)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">{en ? "Search" : "Recherche"}</Label>
        <Input
          id="filter-search"
          placeholder={en ? "Reference, description…" : "Référence, libellé…"}
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-direction">{en ? "Direction" : "Sens"}</Label>
        <Select
          value={filters.direction}
          onValueChange={(value) => onChange({ ...filters, direction: value as TransactionDirection | "ALL" })}
        >
          <SelectTrigger id="filter-direction">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIRECTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {en ? ({ ALL: "All transactions", INCOMING: "Money in", OUTGOING: "Money out" } as Record<string, string>)[option.value] : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-status">{en ? "Status" : "Statut"}</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onChange({ ...filters, status: value as CustomerTransactionStatus | "ALL" })}
        >
          <SelectTrigger id="filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {en ? ({ ALL: "All statuses", COMPLETED: "Completed", PENDING: "Pending", PROCESSING: "Processing", REVERSED: "Reversed", FAILED: "Failed" } as Record<string, string>)[option.value] : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-period">{en ? "Date" : "Date"}</Label>
        <Select
          value={filters.datePreset}
          onValueChange={(value) =>
            onChange({ ...filters, datePreset: value as TransactionDateRangePreset })
          }
        >
          <SelectTrigger id="filter-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {en ? ({ ALL: "Any date", TODAY: "Today", LAST_7_DAYS: "Last 7 days", THIS_MONTH: "This month", LAST_MONTH: "Last month", CUSTOM: "Custom dates" } as Record<string, string>)[option.value] : option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.datePreset === "CUSTOM" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="filter-from">{en ? "From" : "Du"}</Label>
            <Input
              id="filter-from"
              type="date"
              value={(filters.from ?? "").slice(0, 10)}
              onChange={(event) =>
                onChange({
                  ...filters,
                  from: event.target.value ? `${event.target.value}T00:00:00.000Z` : null,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-to">{en ? "To" : "Au"}</Label>
            <Input
              id="filter-to"
              type="date"
              value={filters.to ? new Date(Date.parse(filters.to) - 86_400_000).toISOString().slice(0, 10) : ""}
              onChange={(event) =>
                onChange({
                  ...filters,
                  to: event.target.value ? dayAfter(event.target.value) : null,
                })
              }
            />
          </div>
        </>
      ) : null}
      {!validRange(filters) ? <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-3">{en ? "Enter valid amounts (up to two decimals) and make sure the minimum does not exceed the maximum or the start date the end date." : "Saisissez des montants valides (deux décimales maximum) et vérifiez l’ordre des montants et des dates."}</p> : null}
    </div>
  );
}

export function TransactionFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  const { language } = useLanguage();
  const en = language === "en";
  const count = activeFilterCount(filters);

  return (
    <>
      {/* Mobile: bottom sheet (§90) */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="outline"
          className="touch-target flex-1"
          onClick={() => {
            setDraft(filters);
            setSheetOpen(true);
          }}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {en ? "Filter" : "Filtrer"}
          {count > 0 ? <span className="ml-1 text-caption">({count})</span> : null}
        </Button>
        {count > 0 ? (
          <Button
            variant="ghost"
            className="touch-target"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            <X className="size-4" aria-hidden="true" />
            {en ? "Reset" : "Réinitialiser"}
          </Button>
        ) : null}
      </div>

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={en ? "Filter transactions" : "Filtrer les opérations"}
        description={en ? "Choose a date, amount or category." : "Choisissez une date, un montant ou une catégorie."}
        footer={
          <>
            <Button
              variant="outline"
              className="touch-target"
              onClick={() => {
                setDraft({ ...EMPTY_FILTERS });
                onChange({ ...EMPTY_FILTERS });
                setSheetOpen(false);
              }}
            >
              {en ? "Reset all" : "Tout réinitialiser"}
            </Button>
            <Button
              className="touch-target"
              disabled={!validRange(draft)}
              onClick={() => {
                onChange(draft);
                setSheetOpen(false);
              }}
            >
              {en ? "Show results" : "Voir les résultats"}
            </Button>
          </>
        }
      >
        <FilterFields filters={draft} onChange={setDraft} />
      </BottomSheet>

      {/* Desktop: inline toolbar (§162) */}
      <div className="hidden lg:block">
        <div className="rounded-xl border border-border bg-surface p-4">
          <FilterFields filters={draft} onChange={setDraft} />
          <div className="mt-4 flex justify-end gap-2">
            {count > 0 ? <Button variant="ghost" size="sm" onClick={() => { setDraft({ ...EMPTY_FILTERS }); onChange({ ...EMPTY_FILTERS }); }}>
                <X className="size-4" aria-hidden="true" />
                {en ? "Reset all filters" : "Tout réinitialiser"}
              </Button> : null}
            <Button size="sm" disabled={!validRange(draft)} onClick={() => onChange(draft)}>{en ? "Show results" : "Voir les résultats"}</Button>
          </div>
        </div>
      </div>
    </>
  );
}
