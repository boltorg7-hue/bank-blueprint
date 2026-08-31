import { Download, Eye, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDocumentAccess } from "@/features/documents/hooks/useDocuments";
import { documentErrorMessage } from "@/features/documents/types/document";

/**
 * Download / preview / print actions for a stored document (§63, §69 – §73).
 *
 * Each click asks the server for a new short-lived authorised URL: nothing is
 * cached client-side, and the storage path is never known to the browser.
 */
export function DocumentActions({
  reference,
  disabled = false,
  size = "sm",
}: {
  reference: string;
  disabled?: boolean;
  size?: "sm" | "default";
}) {
  const access = useDocumentAccess();

  const open = (intent: "download" | "preview", print: boolean) => {
    access.mutate(
      { reference, intent },
      {
        onSuccess: ({ url }) => {
          const opened = window.open(url, "_blank", "noopener,noreferrer");
          if (!opened) {
            toast.error("Autorisez l'ouverture des fenêtres pour afficher ce document.");
            return;
          }
          if (print) {
            toast.info("Utilisez la fonction d'impression du lecteur PDF ouvert.");
          }
        },
        onError: (error) => toast.error(documentErrorMessage(error.message)),
      },
    );
  };

  const busy = access.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={disabled || busy}
        onClick={() => open("download", false)}
      >
        <Download aria-hidden className="mr-2 size-4" />
        Télécharger
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        disabled={disabled || busy}
        onClick={() => open("preview", false)}
      >
        <Eye aria-hidden className="mr-2 size-4" />
        Aperçu
      </Button>
      <Button
        type="button"
        size={size}
        variant="ghost"
        disabled={disabled || busy}
        onClick={() => open("preview", true)}
      >
        <Printer aria-hidden className="mr-2 size-4" />
        Imprimer
      </Button>
    </div>
  );
}
