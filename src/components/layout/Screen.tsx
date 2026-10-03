import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Screen({
  children,
  className,
  size = "banking",
}: {
  children: ReactNode;
  className?: string;
  size?: "form" | "banking" | "admin" | "public";
}) {
  const widths = {
    form: "max-w-form",
    banking: "max-w-banking",
    admin: "max-w-admin",
    public: "max-w-public",
  } as const;

  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-4 pb-mobile-nav pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8",
        widths[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
