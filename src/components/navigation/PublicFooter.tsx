import { APP_CONFIG } from "@/config/app";

export function PublicFooter() {
  return (
    <footer className="safe-pb border-t border-border bg-surface-sunken">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{APP_CONFIG.legalName}</p>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {APP_CONFIG.description}
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Environnement de développement. Cette plateforme illustre un produit bancaire digital et
          ne constitue pas une infrastructure bancaire agréée.
        </p>
      </div>
    </footer>
  );
}
