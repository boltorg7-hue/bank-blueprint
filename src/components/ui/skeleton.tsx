import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10 motion-reduce:animate-none motion-safe:transition-opacity motion-safe:duration-200", className)} {...props} />;
}

export { Skeleton };
