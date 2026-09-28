import { Link } from "@tanstack/react-router";

import { APP_CONFIG } from "@/config/app";
import { LegalIdentityList } from "@/features/public/components/LegalIdentityList";
import { PUBLIC_FOOTER_GROUPS } from "@/features/public/content/site";

/** Public footer with full site map and legal identity block (§55, §80). */
export function PublicFooter() {


  return (
    <footer className="safe-pb border-t border-border bg-surface-sunken">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-3">
            <p className="text-label text-foreground">{APP_CONFIG.legalName}</p>
            <p className="text-body-sm max-w-prose text-muted-foreground">{APP_CONFIG.description}</p>
          </div>

          <nav
            aria-label="Plan du site"
            className="grid grid-cols-2 gap-x-4 gap-y-8 min-[420px]:grid-cols-2 sm:grid-cols-4"
          >
            {PUBLIC_FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="min-w-0">
                <p className="text-overline text-muted-foreground">{group.title}</p>
                <ul className="mt-1 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link
                        to={link.to}
                        className="inline-flex min-h-11 items-center text-body-sm text-muted-foreground transition-colors hover:text-foreground active:text-foreground sm:min-h-0 sm:py-0.5"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <LegalIdentityList
          variant="summary"
          layout="grid"
          className="mt-8 border-t border-border pt-2 sm:mt-10 sm:pt-8"
        />

      </div>
    </footer>
  );
}
