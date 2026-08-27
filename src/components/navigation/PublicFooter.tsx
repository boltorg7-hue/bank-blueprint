import { Link } from "@tanstack/react-router";

import { APP_CONFIG } from "@/config/app";
import { LEGAL_IDENTITY, PUBLIC_FOOTER_GROUPS } from "@/features/public/content/site";

/** Public footer with full site map and legal identity block (§55, §80). */
export function PublicFooter() {
  const legalRows = [
    { label: "Entité juridique", value: LEGAL_IDENTITY.legalEntity },
    { label: "Immatriculation", value: LEGAL_IDENTITY.registrationNumber },
    { label: "Siège social", value: LEGAL_IDENTITY.registeredOffice },
    { label: "Code SWIFT/BIC", value: LEGAL_IDENTITY.swiftBic },
    { label: "Autorité de supervision", value: LEGAL_IDENTITY.regulator },
  ];

  return (
    <footer className="safe-pb border-t border-border bg-surface-sunken">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-3">
            <p className="text-label text-foreground">{APP_CONFIG.legalName}</p>
            <p className="text-body-sm max-w-prose text-muted-foreground">{APP_CONFIG.description}</p>
          </div>

          <nav aria-label="Plan du site" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PUBLIC_FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="min-w-0">
                <p className="text-overline text-muted-foreground">{group.title}</p>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link
                        to={link.to}
                        className="text-body-sm text-muted-foreground transition-colors hover:text-foreground"
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

        <dl className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {legalRows.map((row) => (
            <div key={row.label}>
              <dt className="text-overline text-muted-foreground">{row.label}</dt>
              <dd className="text-body-sm mt-1 text-foreground">
                {row.value ?? <span className="text-muted-foreground">À communiquer</span>}
              </dd>
            </div>
          ))}
        </dl>

        <p className="text-caption mt-8 leading-relaxed text-muted-foreground">
          Environnement de développement. Cette plateforme illustre un produit bancaire digital et ne
          constitue pas une infrastructure bancaire agréée. Les informations réglementaires seront
          publiées lorsqu'elles seront officiellement disponibles.
        </p>
      </div>
    </footer>
  );
}
