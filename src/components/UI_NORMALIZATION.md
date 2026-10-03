# UI Normalization Contract

Ce document définit la grammaire visuelle commune du produit. Les écrans peuvent conserver leur contenu métier, mais ne doivent plus recréer leurs propres conventions de présentation.

## 1. Structure d'écran

- Utiliser `Screen` pour le conteneur principal.
- Choisir `form`, `banking`, `admin` ou `public` selon le contexte.
- Le padding horizontal et le rythme vertical restent pilotés par le système, pas par des valeurs arbitraires propres à chaque page.

## 2. Hiérarchie

- Un seul `PageHeader` par écran métier.
- `PageHeader` = titre + description optionnelle + contexte/statut + action(s).
- Les sous-sections utilisent `SectionHeader`.
- Les sections utilisent `PageSection` et conservent un rythme vertical constant.

## 3. Surfaces

- `Card` est la surface par défaut pour un bloc métier autonome.
- Les cartes utilisent le rayon, la bordure et l'ombre du design system.
- Ne pas recréer une carte avec un mélange local de `rounded`, `border` et `shadow` si `Card` convient.

## 4. Actions

- `Button` est le composant d'action canonique.
- Les actions groupées utilisent `action-row`.
- Les cibles interactives principales respectent au minimum 44px.
- Les actions réseau utilisent l'état `loading` de `Button`.

## 5. États

Tous les écrans doivent prévoir les mêmes états fonctionnels :

- loading/skeleton ;
- success ;
- warning ;
- error ;
- empty ;
- confirmation.

Pour les états de contenu bloquants ou vides, utiliser `StateBlock` plutôt qu'un message texte isolé.

## 6. Dialogs et confirmations

- `Dialog`, `AlertDialog`, `ConfirmDialog` et `BottomSheet` sont les primitives canoniques.
- Une confirmation destructive doit expliciter l'action et utiliser le ton danger/destructive.
- Sur mobile, privilégier `BottomSheet` pour les choix contextuels et les actions secondaires.

## 7. Navigation

- Les surfaces customer utilisent `CustomerBottomNav` sur mobile.
- Les surfaces desktop utilisent la navigation latérale existante.
- Une page secondaire doit utiliser `PageHeader.backTo` plutôt qu'une flèche ou un lien de retour redessiné localement.

## 8. Typographie

Utiliser les utilitaires sémantiques existants :

- `text-heading-xl/lg/md/sm`
- `text-body-lg/body/body-sm`
- `text-label`, `text-caption`, `text-overline`
- `text-numeric`, `text-amount`, `text-balance-value`

Les montants financiers utilisent toujours la famille numérique dédiée.

## 9. Responsive / accessibilité

- Mobile-first.
- Respect des safe areas.
- Pas de zoom iOS sur les champs.
- Respect de `prefers-reduced-motion`.
- Aucun contrôle important sous 44px.
- Les erreurs critiques utilisent une sémantique d'alerte appropriée.

## 10. Règle de migration

Lorsqu'une ancienne page utilise un pattern local :

1. identifier la primitive canonique équivalente ;
2. conserver le contenu et le comportement métier ;
3. remplacer uniquement la structure visuelle locale ;
4. supprimer les classes de spacing/typographie devenues redondantes ;
5. vérifier mobile, dark mode, focus, loading et empty state.

Ce contrat sert de garde-fou pour les nouvelles pages comme pour les migrations existantes.
