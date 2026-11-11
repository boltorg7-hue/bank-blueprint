import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { AppPath } from "@/lib/routing";

/**
 * Minimal, reassuring frame shared by authentication screens.
 * The optional wide layout is reserved for the registration entry page.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  aside,
  eyebrow,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  eyebrow?: string;
  wide?: boolean;
}) {
  const { language } = useLanguage();

  return (
    <PublicLayout showFooter={false}>
      <section
        className={wide ? "mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12" : "mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16"}
      >
        <header className={`space-y-3 ${wide ? "mx-auto max-w-2xl text-center" : ""}`}>
          {eyebrow ? (
            <p className="text-overline font-semibold tracking-[0.16em] text-brand">
              {eyebrow}
            </p>
          ) : null}
          <h1 className={wide ? "text-heading-xl text-foreground sm:text-display" : "text-heading-lg text-foreground"}>
            {title}
          </h1>
          {description ? (
            <p className="text-body mx-auto max-w-2xl text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>

        <Card className={wide ? "mt-7 overflow-hidden sm:mt-9" : "mt-8"}>
          <CardContent
            className={
              wide
                ? "grid gap-0 !p-0 md:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]"
                : "space-y-6 pt-5 sm:pt-6"
            }
          >
            {wide ? (
              <div className="p-5 sm:p-7 lg:p-8">{children}</div>
            ) : (
              <div>{children}</div>
            )}
            {aside ? (
              wide ? (
                <aside className="border-t border-border bg-surface-sunken p-5 sm:p-7 md:border-l md:border-t-0">
                  {aside}
                </aside>
              ) : (
                aside
              )
            ) : null}
          </CardContent>
        </Card>

        <p className={wide ? "text-caption mt-6 flex items-start justify-center gap-2 text-muted-foreground sm:mt-8" : "text-caption mt-8 flex items-start gap-2 text-muted-foreground"}>
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className={wide ? "max-w-xl" : ""}>
            {language === "en"
              ? "We will never ask for your password or security code by phone, email or message."
              : "Nous ne vous demanderons jamais votre mot de passe ou un code de sécurité par téléphone, e-mail ou message."}
          </span>
        </p>

        {footer ? <div className={wide ? "mt-6 text-center" : "mt-6"}>{footer}</div> : null}
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
