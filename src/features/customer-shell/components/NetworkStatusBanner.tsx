import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Global network awareness (§44, §45). The application is online-only: nothing
 * is queued for later and no stale figure is presented as current.
 */
export function NetworkStatusBanner() {
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!window.navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-warning-muted/60 px-4 py-2 text-sm text-foreground sm:px-6"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-snug">
        Connexion perdue. Vos informations bancaires peuvent ne plus être à jour et aucune
        opération n'est enregistrée hors ligne.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (window.navigator.onLine) void queryClient.refetchQueries();
        }}
      >
        Réessayer
      </Button>
    </div>
  );
}
