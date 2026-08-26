# Documentation de référence — Plateforme bancaire digitale

Ce dossier est la **source de vérité** du projet. Chaque phase de construction suit le document correspondant, dans l'ordre. Les fichiers sont conservés tels que fournis et ne doivent pas être réécrits.

## Ordre d'exécution et statut

| # | Document | Sujet | Statut |
|---|----------|-------|--------|
| 00 | [00-foundation-modular-architecture.md](./00-foundation-modular-architecture.md) | Fondations & architecture modulaire | reçu |
| 01 | [01-design-system-branding.md](./01-design-system-branding.md) | Design system, branding, identité visuelle | reçu |
| 02 | [02-public-website-acquisition.md](./02-public-website-acquisition.md) | Site public, landing page, acquisition | reçu |
| 03 | [03-auth-registration-kyc-onboarding.md](./03-auth-registration-kyc-onboarding.md) | Authentification, inscription, KYC, onboarding | reçu |
| 04 | [04-customer-app-shell-navigation.md](./04-customer-app-shell-navigation.md) | Shell de l'app client, navigation, expérience membre | reçu |
| 05 | [05-customer-dashboard-accounts-balances.md](./05-customer-dashboard-accounts-balances.md) | Dashboard client, comptes bancaires, soldes | reçu |
| 06 | [06-double-entry-ledger-transactions.md](./06-double-entry-ledger-transactions.md) | Grand livre en partie double, transactions, activité | reçu |
| 07 | [07-beneficiaries-internal-transfers.md](./07-beneficiaries-internal-transfers.md) | Bénéficiaires, virements internes, mouvements de fonds | reçu |
| 08 | [08-transfer-routing-compliance-external.md](./08-transfer-routing-compliance-external.md) | Routage des virements, parcours conformité 0→100, virements externes | reçu |
| 09 | [09-statements-pdf-document-center.md](./09-statements-pdf-document-center.md) | Relevés, PDF, impression, centre de documents | reçu |
| 10 | — | à définir | en attente |

| 11 | — | à définir | en attente |
| 12 | — | à définir | en attente |
| 13 | — | à définir | en attente |
| 14 | — | à définir | en attente |
| 15 | — | à définir | en attente |
| 16 | — | à définir | en attente |

Total prévu : 17 documents (00 à 16). Statuts possibles : `en attente`, `reçu`, `implémenté`.

## Règles permanentes (à ne jamais violer)

1. **Trois expériences séparées** : site public, espace client authentifié, back-office administration. Layouts et navigations indépendants ; le site public n'expose jamais la navigation client ou admin.
2. **Online-first, jamais offline** : aucune file d'attente de transactions, aucune mutation de solde hors ligne, aucun cache bancaire IndexedDB, aucun service worker bancaire, aucune synchronisation en arrière-plan. En cas de perte de réseau : état clair + réessai sûr. Jamais afficher une donnée financière périmée comme confirmée.
3. **Stack figée** : TanStack Start, React, TypeScript, Tailwind CSS, SSR où pertinent, Lovable Cloud (PostgreSQL, Auth, RLS, storage, logique privilégiée côté serveur). Pas de downgrade vers une stack plus ancienne.
4. **Séparation stricte des concepts** : authentification ≠ profil ≠ vérification d'identité ≠ statut du compte bancaire. Jamais un champ unique du type `user.verified`. États explicites.
5. **Sécurité par architecture** : RLS sur toutes les tables, rôles dans une table dédiée, jamais de contrôle d'accès côté client, jamais de mot de passe géré manuellement.
6. **Design premium bancaire** : ne doit ressembler ni à un dashboard SaaS générique, ni à une plateforme crypto/trading, ni à un template UI kit. Tokens sémantiques uniquement, pas de couleurs codées en dur.
7. **Mobile-first et accessible** par défaut, sur toutes les surfaces.
8. **Organisation modulaire** par domaine : `src/features/<domaine>/` (components, hooks, services, schemas, types, utils).
9. **Pas de reconstruction** : chaque phase étend l'existant sans restructurer l'architecture ni remplacer le design system.
