# Feuille de route

## Fait
- Phases 00 → 09 (fondation, design system, site public, auth/KYC, app shell, comptes, ledger, virements internes, routage/conformité externe, relevés PDF & centre de documents).
- Câblage `/app/statements` (liste + générateur + détail) et `/app/documents` (centre filtrable).
- Reçus officiels sur les détails d'opération et de virement + liens depuis le dashboard.
- Barème de frais centralisé (`src/config/fees.ts`) → grille Tarifs publique + affichage des frais avant débit dans le virement.
- Étape 1 du back-office : garde d’accès personnel, dashboard, clients, comptes, approvisionnements maker-checker, blocage/réactivation et audit des actions.

- Accueil refondu (faits vérifiés, photos libres de T&T, actualités CBTT) ; site vérifié dans Google Search Console et sitemap soumis.
- Accueil et pages publiques principales modernisés dans une direction éditoriale « photo puis récit » ; navigation mobile publique et client affinée sans modification des opérations.

## À faire
- Bilinguisme FR/EN : poursuivre la traduction du contenu détaillé des pages publiques, des parcours client et du back-office ; le sélecteur et les écrans principaux sont en place.
- Parcours mobile-first : séparer les rubriques sur les pages restantes et revoir les cartes de données denses sans modifier les règles bancaires.
- Phase 10 : notifications et messagerie de service client (base + écrans câblés ; validation d'exécution de bout en bout restante).
- Sécurité client : centre de sécurité, sessions, révocation, historique, step-up (base + écrans câblés ; certification restante).
- Détails administratifs enrichis : historique complet d'un client, d'un compte et exports d'audit.
- Créer la tâche planifiée mensuelle (Cloud → Jobs) appelant POST /api/public/cron/monthly-statements avec l'en-tête x-cron-secret — action utilisateur requise.

## Fait (ce cycle)
- Sélecteur de langue compact dans les trois en-têtes avec détection initiale de la langue du système et mémorisation du choix ; menu public regroupé, navigation admin regroupée, grille des services client et cartes de fonctionnalités affinées sur mobile.
- 5 migrations 20260924 appliquées (durcissement admin, préférences client, workflow virements externes simulés, messagerie support, centre de sécurité).
- Écrans /app/messages et /app/security vérifiés câblés sur les nouvelles fonctions.
- Frais de virement externe réellement prélevés via le ledger (FEE_DEBIT_ACTIVE).
- Route cron relevés mensuels sécurisée (/api/public/cron/monthly-statements, 401 sans secret).
- Lien « Voir le site public de la banque » ajouté au tableau de bord client.
- Pages admin parité/tarifs, comptes clients et approvisionnements opérationnelles.
