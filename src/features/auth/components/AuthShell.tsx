import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { AppPath } from "@/lib/routing";

/**
 * Minimal, reassuring frame shared by every authentication screen (§18).
 * Mobile-first single column, comfortable touch targets, no visual clutter.
 * The Card is the canonical auth surface so login, registration and recovery
 * share the same visual grammar.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}) {
  const { language } = useLanguage();

  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
        <header className="space-y-3">
          <h1 className="text-heading-lg text-foreground">{title}</h1>
          {description ? (
            <p className="text-body text-muted-foreground">{description}</p>
          ) : null}
        </header>

        <Card className="mt-8">
          <CardContent className="space-y-6 pt-5 sm:pt-6">
            <div>{children}</div>
            {aside}
          </CardContent>
        </Card>

        <p className="text-caption mt-8 flex items-start gap-2 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {language === "en"
              ? "We will never ask for your password or security code by phone, email or message."
              : "Nous ne vous demanderons jamais votre mot de passe ou un code de sécurité par téléphone, e-mail ou message."}
          </span>
        </p>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </section>
    </PublicLayout>
  );
}

export function AuthLink({ to, children }: { to: AppPath; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-body-sm font-medium text-brand underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
