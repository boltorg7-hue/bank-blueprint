# Enregistrement de la documentation de la banque digitale

Objectif de cette étape : **archiver la documentation seulement**, aucune fonctionnalité bancaire n'est encore construite.

## Ce que je vais faire

1. Créer un dossier `docs/banking/` dans le projet.
2. Y copier les fichiers reçus, renommés de façon stable et triable :
   - `docs/banking/00-foundation-modular-architecture.md`
   - `docs/banking/01-design-system-branding.md`
   - `docs/banking/02-public-website-acquisition.md`
   - `docs/banking/03-auth-registration-kyc-onboarding.md`
   - `docs/banking/04-customer-app-shell-navigation.md`
3. Créer `docs/banking/README.md` : index des 17 prompts, avec l'ordre d'exécution, le statut de chaque phase (`reçu` / `en attente` / `implémenté`) et les règles permanentes à ne jamais violer.
4. Enregistrer en mémoire projet (`mem://`) les règles transversales extraites des documents, pour qu'elles s'appliquent automatiquement à chaque étape suivante :
   - trois expériences séparées : site public, espace client, back-office admin ;
   - mobile-first, responsive, **online-first** — jamais d'architecture offline (pas de file d'attente de transactions, pas de cache bancaire IndexedDB, pas de service worker bancaire) ;
   - stack figée : TanStack Start + React + TypeScript + Tailwind + Lovable Cloud (Postgres, Auth, RLS, storage) ;
   - séparation stricte des concepts : authentification / profil / vérification d'identité / statut du compte bancaire — jamais un seul champ `verified` ;
   - design premium bancaire : pas de look SaaS générique, crypto, trading ou template UI kit ;
   - organisation modulaire par domaine dans `src/features/<domaine>/`.

## Détails techniques

Les fichiers `.md` sont copiés tels quels (source de vérité non modifiée). La mémoire projet ne duplique pas leur contenu : elle contient uniquement les règles courtes et les renvois vers `docs/banking/`.

## Après cette étape

Il reste 12 documents (05 à 16). Envoie-les quand tu veux : je les ajoute au même dossier et je mets l'index à jour. La construction réelle démarrera au prompt 00 une fois la documentation en place.
