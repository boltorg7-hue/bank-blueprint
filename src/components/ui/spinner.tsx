import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
} as const;

export function Spinner({
  size = "md",
  className,
  label,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size], className)} />
      <span className={label ? "text-body-sm text-muted-foreground" : "sr-only"}>
        {label ?? "Chargement…"}
      </span>
    </span>
  );
}
