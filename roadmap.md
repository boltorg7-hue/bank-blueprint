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
- Bilinguisme FR/EN : terminer les dialogues bénéficiaires, certains panneaux détaillés de comptes/virements et les libellés provenant des données ou documents générés ; vérifier les vues administrateur avec un compte personnel autorisé (compte de test actuel non autorisé).
- Parcours mobile-first : vérifier les vues administrateur internes avec un compte personnel autorisé et poursuivre l'inspection des écrans secondaires sans modifier les règles bancaires.
- Phase 10 : notifications et messagerie de service client (base + écrans câblés ; validation d'exécution de bout en bout restante).
- Sécurité client : centre de sécurité, sessions, révocation, historique, step-up (base + écrans câblés ; certification restante).
- Détails administratifs enrichis : historique complet d'un client, d'un compte et exports d'audit.
- Créer la tâche planifiée mensuelle (Cloud → Jobs) appelant POST /api/public/cron/monthly-statements avec l'en-tête x-cron-secret — action utilisateur requise.

## Fait (ce cycle)
- Audit UI/UX mobile 2026 : direction « luxe organique moderne » validée ; fondations tactiles, accueil immersif, navigation basse, surfaces client, filtres mobiles et largeur des recherches admin harmonisés.
- Audit responsive validé sans débordement à 320, 393, 768 et 1280 px sur les principales routes publiques ; cibles tactiles publiques renforcées et footer lisible dès 320 px.
- Comptes, clients et approvisionnements administratifs disposent de cartes mobiles dédiées ; les motifs de décisions sensibles utilisent des dialogues accessibles à la place des fenêtres système.
- Opérations : filtres mobiles par date, fourchette de montant et catégorie, réinitialisation et pagination filtrée côté serveur.
- Pages publiques, étapes d'ouverture de compte, profil, centre de sécurité, écrans client/admin principaux et détails de relevés, opérations et virements traduits FR/EN ; contrôle navigateur public et onboarding en deux langues sans erreur ni débordement. Accès admin refusé correctement au compte client de test ; vues internes admin non vérifiées avec un compte personnel.
- Sélecteur de langue compact dans les trois en-têtes avec détection initiale de la langue du système et mémorisation du choix ; menu public regroupé, navigation admin regroupée, grille des services client et cartes de fonctionnalités affinées sur mobile.
- 5 migrations 20260924 appliquées (durcissement admin, préférences client, workflow virements externes simulés, messagerie support, centre de sécurité).
- Écrans /app/messages et /app/security vérifiés câblés sur les nouvelles fonctions.
- Frais de virement externe réellement prélevés via le ledger (FEE_DEBIT_ACTIVE).
- Route cron relevés mensuels sécurisée (/api/public/cron/monthly-statements, 401 sans secret).
- Lien « Voir le site public de la banque » ajouté au tableau de bord client.
- Pages admin parité/tarifs, comptes clients et approvisionnements opérationnelles.
- Assistant d’ouverture de compte : interface, exigences et progression client entièrement localisées FR/EN ; réponses bilingues à valider par appels réels AI Gateway.
