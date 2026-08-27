import { cn } from "@/lib/utils";

/** Factual figure on the public site (e.g. "24/7 support"). */
export function Metric({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-heading-xl text-numeric text-foreground">{value}</p>
      <p className="text-body-sm mt-1 text-muted-foreground">{label}</p>
    </div>
  );
}
