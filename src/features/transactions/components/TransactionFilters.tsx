import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

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

export const EMPTY_FILTERS: Filters = {
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
  return count;
}

function FilterFields({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">Recherche</Label>
        <Input
          id="filter-search"
          placeholder="Référence, libellé…"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-direction">Sens</Label>
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
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-status">Statut</Label>
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
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-period">Période</Label>
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
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.datePreset === "CUSTOM" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="filter-from">Du</Label>
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
            <Label htmlFor="filter-to">Au</Label>
            <Input
              id="filter-to"
              type="date"
              value={(filters.to ?? "").slice(0, 10)}
              onChange={(event) =>
                onChange({
                  ...filters,
                  to: event.target.value ? `${event.target.value}T23:59:59.999Z` : null,
                })
              }
            />
          </div>
        </>
      ) : null}
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
          Filtrer
          {count > 0 ? <span className="ml-1 text-caption">({count})</span> : null}
        </Button>
        {count > 0 ? (
          <Button
            variant="ghost"
            className="touch-target"
            onClick={() => onChange({ ...EMPTY_FILTERS })}
          >
            <X className="size-4" aria-hidden="true" />
            Effacer
          </Button>
        ) : null}
      </div>

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filtrer les opérations"
        description="Affinez votre historique par sens, statut ou période."
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
              Réinitialiser
            </Button>
            <Button
              className="touch-target"
              onClick={() => {
                onChange(draft);
                setSheetOpen(false);
              }}
            >
              Appliquer
            </Button>
          </>
        }
      >
        <FilterFields filters={draft} onChange={setDraft} />
      </BottomSheet>

      {/* Desktop: inline toolbar (§162) */}
      <div className="hidden lg:block">
        <div className="rounded-xl border border-border bg-surface p-4">
          <FilterFields filters={filters} onChange={onChange} />
          {count > 0 ? (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => onChange({ ...EMPTY_FILTERS })}>
                <X className="size-4" aria-hidden="true" />
                Effacer les filtres
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
