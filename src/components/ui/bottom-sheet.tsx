import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Mobile-native bottom sheet (PROMPT 01 §36) — the default container for
 * secondary choices on touch devices. Keeps safe-area padding so actions are
 * never under the gesture bar.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn("safe-pb max-h-[85dvh] overflow-y-auto rounded-t-2xl", className)}
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong/60"
        />
        <SheetHeader className="text-left">
          <SheetTitle className="text-heading-md">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-body-sm">{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="py-4">{children}</div>
        {footer && <SheetFooter className="flex-col gap-2 sm:flex-row">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
