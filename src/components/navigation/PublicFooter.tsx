import { Link } from "@tanstack/react-router";

import { APP_CONFIG } from "@/config/app";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LegalIdentityList } from "@/features/public/components/LegalIdentityList";
import { PUBLIC_FOOTER_GROUPS } from "@/features/public/content/site";

/** Public footer with full site map and legal identity block (§55, §80). */
export function PublicFooter() {
  const { language } = useLanguage();
  const english: Record<string, string> = { Banque: "Banking", Comptes: "Accounts", Fonctionnalités: "Features", Tarifs: "Pricing", Sécurité: "Security", Entreprise: "Company", "À propos": "About", Assistance: "Support", "Centre d'aide": "Help centre", "Questions fréquentes": "FAQs", "Informations légales": "Legal information", "Conditions générales": "Terms", Confidentialité: "Privacy" };
  const label = (text: string) => language === "en" ? english[text] ?? text : text;

  return (
    <footer className="safe-pb border-t border-border bg-surface-sunken">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-3">
            <p className="text-label text-foreground">{APP_CONFIG.legalName}</p>
            <p className="text-body-sm max-w-prose text-muted-foreground">{language === "en" ? "Banking services and account management online." : APP_CONFIG.description}</p>
          </div>

          <nav
            aria-label={language === "en" ? "Site map" : "Plan du site"}
            className="grid grid-cols-1 gap-x-4 gap-y-7 min-[380px]:grid-cols-2 sm:grid-cols-4"
          >
            {PUBLIC_FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="min-w-0">
                <p className="text-overline text-muted-foreground">{label(group.title)}</p>
                <ul className="mt-1 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link
                        to={link.to}
                        className="inline-flex min-h-11 min-w-11 items-center text-body-sm text-muted-foreground transition-colors hover:text-foreground active:text-foreground sm:min-h-0 sm:min-w-0 sm:py-0.5"
                      >
                        {label(link.label)}
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
