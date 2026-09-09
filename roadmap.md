# Feuille de route

## Fait
- Phases 00 → 09 (fondation, design system, site public, auth/KYC, app shell, comptes, ledger, virements internes, routage/conformité externe, relevés PDF & centre de documents).
- Câblage `/app/statements` (liste + générateur + détail) et `/app/documents` (centre filtrable).
- Reçus officiels sur les détails d'opération et de virement + liens depuis le dashboard.
- Barème de frais centralisé (`src/config/fees.ts`) → grille Tarifs publique + affichage des frais avant débit dans le virement.

## À faire
- Soumission du sitemap à Google Search Console (nécessite l'accès GSC du propriétaire du domaine).
- Phase 10 : messagerie et notifications.
- Administration des paramètres financiers : parité USD/USDT, tenue mensuelle et frais de virement, avec mise à jour immédiate, historique et audit.
- Administration des comptes clients : recherche, consultation des soldes projetés, plafonds et historique.
- Administration des approvisionnements : demande, validation maker-checker, posting en partie double et rechargement direct après comptabilisation.
- Génération automatique et idempotente des relevés mensuels réconciliés à chaque clôture, après les pages admin.
- Lien direct du dashboard client vers le site public.
- Refonte de l'accueil après l'admin et les relevés : histoire vérifiée, photographies authentiques et actualités locales datées.
