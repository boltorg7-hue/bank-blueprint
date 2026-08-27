import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";
import { publicMeta } from "@/features/public/lib/seo";
import { safeRedirectPath } from "@/features/auth/lib/post-login";

const meta = publicMeta({
  title: "Session expirée",
  description: "Votre session sécurisée a expiré. Reconnectez-vous pour continuer.",
  path: "/session-expired",
});

export const Route = createFileRoute("/session-expired")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: SessionExpiredPage,
});

function SessionExpiredPage() {
  const { redirect } = Route.useSearch();
  const safe = safeRedirectPath(redirect);

  return (
    <AuthShell
      title="Session expirée"
      description="Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer."
    >
      <div className="space-y-5">
        <p className="text-body-sm flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Par mesure de sécurité, une opération bancaire en cours n'est jamais reprise
          automatiquement après une expiration de session.
        </p>
        <Button asChild className="w-full touch-target">
          <Link to="/login" search={safe ? { redirect: safe } : { redirect: undefined }}>
            Se reconnecter
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
