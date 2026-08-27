import type { ReactNode } from "react";

/** Reusable authenticated page header (compact on mobile, roomier on desktop). */
export function PageHeader({
  title,
  description,
  action,
  status,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  status?: ReactNode | undefined;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {status}
        </div>
        {description ? (
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}
