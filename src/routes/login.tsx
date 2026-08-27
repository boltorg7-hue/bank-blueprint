import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { publicMeta } from "@/features/public/lib/seo";
import { SECURITY_WARNING } from "@/features/public/content/site";

const meta = publicMeta({
  title: "Connexion à votre espace",
  description:
    "Accédez à votre espace bancaire Vaultis avec votre adresse e-mail et votre mot de passe.",
  path: "/login",
});

export const Route = createFileRoute("/login")({
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: LoginPage,
});

/**
 * Placeholder shell for the authentication entry point.
 * The real sign-in flow is delivered with the authentication phase; this route
 * exists so every public call to action resolves to a real page.
 */
function LoginPage() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <h1 className="text-heading-lg text-foreground">Connexion</h1>
        <p className="text-body mt-3 text-muted-foreground">
          L'accès à l'espace client sera activé avec la mise en service de l'authentification. Les
          identifiants ne sont pas encore acceptés.
        </p>
        <p className="text-body-sm mt-6 rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-foreground">
          {SECURITY_WARNING}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild variant="outline" className="touch-target">
            <Link to="/help">Consulter le centre d'aide</Link>
          </Button>
          <Button asChild variant="ghost" className="touch-target">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
