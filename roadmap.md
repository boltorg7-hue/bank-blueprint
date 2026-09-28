# Feuille de route

## Fait
- Phases 00 → 09 (fondation, design system, site public, auth/KYC, app shell, comptes, ledger, virements internes, routage/conformité externe, relevés PDF & centre de documents).
- Câblage `/app/statements` (liste + générateur + détail) et `/app/documents` (centre filtrable).
- Reçus officiels sur les détails d'opération et de virement + liens depuis le dashboard.
- Barème de frais centralisé (`src/config/fees.ts`) → grille Tarifs publique + affichage des frais avant débit dans le virement.
- Étape 1 du back-office : garde d’accès personnel, dashboard, clients, comptes, approvisionnements maker-checker, blocage/réactivation et audit des actions.

- Accueil refondu (faits vérifiés, photos libres de T&T, actualités CBTT) ; site vérifié dans Google Search Console et sitemap soumis.

## À faire
- Moderniser l'accueil et les pages publiques centrales dans une direction éditoriale « photo puis récit » (encre/turquoise, Sora/Manrope), et polir la navigation client mobile sans changer les opérations.
- Phase 10 : notifications et messagerie de service client (implémentées dans les étapes 3 et 5 ; validation d’exécution restante).
- Sécurité client minimale : centre de sécurité, sessions observées, révocation des autres sessions, historique et step-up des virements (étape 6 implémentée ; certification restante).
- Administration avancée des paramètres financiers : écrans de parité USD/USDT, tenue mensuelle, frais, plafonds et historique.
- Détails administratifs enrichis : historique complet d’un client, d’un compte et exports d’audit.
- Génération automatique et idempotente des relevés mensuels réconciliés à chaque clôture, après les pages admin.
- Lien direct du dashboard client vers le site public.
- Appliquer en base les 6 nouveaux fichiers ajoutés (admin, profil, notifications, virements externes, support, sécurité) après validation.
