import type { ReactNode } from "react";

import { PublicFooter } from "@/components/navigation/PublicFooter";
import { PublicHeader } from "@/components/navigation/PublicHeader";

/** Layout for visitors. Never reused by the customer or admin experiences. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh-safe flex flex-col bg-background">
      <PublicHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
