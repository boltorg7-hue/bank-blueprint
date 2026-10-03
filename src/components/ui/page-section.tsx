import * as React from "react";
import { cn } from "@/lib/utils";

export const PageSection = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => <section ref={ref} className={cn("min-w-0 space-y-4 sm:space-y-5", className)} {...props} />,
);
PageSection.displayName = "PageSection";
