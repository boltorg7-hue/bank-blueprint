# Phase 00 — Fondation & architecture modulaire

Objectif : poser les fondations permanentes (structure, routes, layouts, tokens, sécurité, mobile-first) sans construire les fonctionnalités bancaires. Le document 00 interdit explicitement de créer des dizaines de pages factices.

## 1. Structure modulaire

Créer les dossiers réellement utiles maintenant (pas d'architecture vide) :

```text
src/
├── features/        (public, auth, onboarding, dashboard, accounts, transfers, admin — créés au fil des phases)
├── components/
│   ├── layout/      (PublicLayout, BankingAppLayout, AdminLayout)
│   ├── navigation/  (nav publique, nav client mobile/desktop, sidebar admin)
│   ├── feedback/    (loading, empty, error, network, permission)
│   └── ui/          (existant, conservé)
├── services/        (auth, banking, storage — au fil des phases)
├── config/          (navigation, app config, rôles)
├── types/           (types partagés : rôles, cycle de vie client, états)
├── hooks/
└── lib/
```

## 2. Namespaces de routes (coquilles minimales)

- Public : `/` (page de fondation remplaçant le placeholder), plus les pages marketing en phase 02.
- Client : layout `_app` protégé → `/app/dashboard` (coquille avec état vide explicite).
- Admin : layout `_admin` protégé par rôle → `/admin/dashboard` (coquille).

Aucune donnée financière inventée : les zones sans backend affichent un état vide clair.

## 3. Trois layouts indépendants

- `PublicLayout` : header compact + drawer mobile + footer.
- `BankingAppLayout` : header client, bottom navigation mobile (Accueil, Comptes, Virement, Activité, Plus), sidebar desktop, conteneur de contenu, zone de feedback global.
- `AdminLayout` : sidebar admin + top bar opérationnelle.

Aucun partage de layout entre les trois zones.

## 4. Fondations mobile-first et responsive

- Viewport `width=device-width, initial-scale=1, viewport-fit=cover` (zoom utilisateur conservé).
- Utilitaires safe-area (`env(safe-area-inset-*)`), `100dvh`, cibles tactiles ≥ 44px, inputs ≥ 16px.
- Respect de `prefers-reduced-motion` dans les utilitaires d'animation.

## 5. Design tokens de fondation

Étendre `src/styles.css` avec des tokens sémantiques bancaires (background, surface, surface-elevated, text-primary/secondary, border, success, warning, danger, info, accent, rayons, ombres, timings). Direction premium sobre — l'identité visuelle définitive vient en phase 01. Aucune couleur brute dans les composants.

## 6. Primitives d'état réutilisables

`LoadingState`, `SkeletonBlock`, `EmptyState`, `ErrorState`, `NetworkUnavailable`, `PermissionDenied`, `SessionExpired` + `<Toaster />` (sonner) monté à la racine.

## 7. Sécurité et autorisation (préparation)

- Modèle de rôles centralisé dans `src/config/roles.ts` + types du cycle de vie client (VISITOR → ACTIVE …), sans stockage de rôle sur un profil.
- Interfaces de garde de route (`requireCustomer`, `requireStaff`) préparées mais neutres : l'authentification réelle arrive en phase 03. Aucune décision de sécurité basée sur localStorage.
- Aucune mutation de solde côté client ; commentaires d'architecture rappelant la règle du grand livre.

## 8. SEO et métadonnées

Titre/description/OG propres pour `/`, `noindex` sur `/app/*` et `/admin/*`.

## 9. Backend

Lovable Cloud n'est pas encore activé. La phase 00 ne crée aucune table : elle prépare seulement les frontières client/serveur. L'activation se fera à la phase 03 (authentification), conformément aux documents.

## 10. Tests de fin de phase

- Build et typecheck sans erreur.
- Vérification navigateur : `/`, `/app/dashboard`, `/admin/dashboard` rendent sans erreur console.
- Contrôle responsive à 320px et en desktop (navigation mobile visible, safe-area appliquée).
- Rapport technique final (architecture, routes, layouts, sécurité, TODOs pour la phase 01), puis arrêt avant la phase 01.
