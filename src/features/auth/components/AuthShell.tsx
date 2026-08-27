import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import type { AppPath } from "@/lib/routing";

/**
 * Minimal, reassuring frame shared by every authentication screen (§18).
 * Mobile-first single column, comfortable touch targets, no visual clutter.
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
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-heading-lg text-foreground">{title}</h1>
        {description ? (
          <p className="text-body mt-3 text-muted-foreground">{description}</p>
        ) : null}

        <div className="mt-8">{children}</div>

        {aside}

        <p className="text-caption mt-8 flex items-start gap-2 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Nous ne vous demanderons jamais votre mot de passe ou un code de sécurité par téléphone,
            e-mail ou message.
          </span>
        </p>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </section>
    </PublicLayout>
  );
}

export function AuthLink({ to, children }: { to: AppPath; children: ReactNode }) {
  return (
    <Link to={to} className="text-body-sm font-medium text-brand underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
