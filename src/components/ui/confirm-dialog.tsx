import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Explicit confirmation for irreversible actions (PROMPT 01 §25).
 * The dialog always restates WHAT will happen; the caller passes the summary.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  summary,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "default",
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Recap block (amount, beneficiary, consequence) shown above the actions. */
  summary?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="safe-pb max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-heading-md">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-body-sm">{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {summary && (
          <div className="rounded-lg border border-border bg-surface-sunken p-3">{summary}</div>
        )}
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <AlertDialogCancel disabled={loading} className="mt-0 h-11 w-full sm:w-auto">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading || undefined}
            className={cn(
              "h-11 w-full sm:w-auto",
              tone === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {loading ? "Traitement…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
