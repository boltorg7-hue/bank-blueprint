import { createFileRoute, Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";
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
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: SessionExpiredPage,
});

function SessionExpiredPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { redirect } = Route.useSearch();
  const safe = safeRedirectPath(redirect);

  return (
    <AuthShell
      title={en ? "Session expired" : "Session expirée"}
      description={en ? "Your session expired for security reasons. Sign in again to continue." : "Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer."}
    >
      <div className="space-y-5">
        <p className="text-body-sm flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {en ? "For security, an ongoing banking operation is never resumed automatically after a session expires." : "Par mesure de sécurité, une opération bancaire en cours n'est jamais reprise automatiquement après une expiration de session."}
        </p>
        <Button asChild className="w-full touch-target">
          <Link to="/login" search={safe ? { redirect: safe } : {}}>
            {en ? "Sign in again" : "Se reconnecter"}
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
