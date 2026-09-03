# Feuille de route

## Fait
- Phases 00 → 09 (fondation, design system, site public, auth/KYC, app shell, comptes, ledger, virements internes, routage/conformité externe, relevés PDF & centre de documents).
- Câblage `/app/statements` (liste + générateur + détail) et `/app/documents` (centre filtrable).
- Reçus officiels sur les détails d'opération et de virement + liens depuis le dashboard.
- Barème de frais centralisé (`src/config/fees.ts`) → grille Tarifs publique + affichage des frais avant débit dans le virement.

## En attente d'une décision du client
- Montants réels des frais (tenue de compte mensuelle, virement externe) : non contractés, affichés « À définir ». Les autres lignes sont explicitement « Sans frais ».
- Tout frais réellement facturé devra aussi être comptabilisé côté ledger (écriture dédiée), pas seulement affiché.

## À faire
- Test bout en bout sur un compte réel : virement → reçu → relevé PDF (contrôle visuel A4, soldes et opérations réconciliés).
- Soumission du sitemap à Google Search Console (nécessite l'accès GSC du propriétaire du domaine).
- Phase 10 : messagerie et notifications.
