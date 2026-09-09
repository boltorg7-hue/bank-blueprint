# Plan d’exécution — Administration financière et relevés mensuels

## Objectif
Livrer un back-office bancaire séparé et sécurisé pour gérer la parité USD/USDT, les tarifs, les comptes clients, les plafonds et les approvisionnements, puis automatiser les relevés mensuels. L’accueil public sera refondu après ce socle, avec des contenus historiques et locaux vérifiables.

## Ordre de livraison

### 1. Sécuriser l’accès du personnel
- Activer le contrôle d’accès serveur du back-office `/admin` avec profils employés, statuts actifs/suspendus et permissions granulaires.
- Séparer les droits : lecture comptes, gestion des paramètres, création d’un approvisionnement, approbation, lecture du ledger et audit.
- Refuser par défaut tout accès non autorisé ; ne jamais faire confiance à un rôle affiché dans le navigateur.
- Journaliser les connexions, consultations sensibles et chaque mutation administrative.

**Validation**
- Un client ordinaire ne peut ouvrir ni appeler les fonctions admin.
- Un employé suspendu perd immédiatement l’accès.
- Chaque permission est testée côté serveur, y compris par appel direct.

### 2. Page admin Parité et Tarifs
- Créer `/admin/settings/financial` avec la parité USD/USDT, la tenue de compte mensuelle et les frais de virements interne/externe.
- Stocker les valeurs actives en base avec unité, devise, date d’effet, auteur, version et historique immuable.
- Ajouter le bouton « Mettre à jour » : validation serveur, mise à jour atomique, invalidation immédiate des écrans clients et confirmation horodatée.
- Utiliser la parité comme cotation d’affichage/conversion ; le ledger reste exclusivement comptabilisé en USD.
- Publier les tarifs actifs sur la page Tarifs et dans le récapitulatif avant confirmation d’un virement.
- Ne débiter aucun frais par simple affichage : l’activation d’un prélèvement exige une écriture ledger équilibrée dédiée.

**Validation**
- Contrôles de bornes, décimales, valeurs négatives et concurrence de version.
- Mise à jour visible immédiatement dans l’admin, la grille publique et le parcours de virement.
- Historique et auteur vérifiés ; aucune ancienne valeur n’est écrasée.

### 3. Page admin Comptes clients
- Créer `/admin/accounts` et `/admin/accounts/:accountRef` avec recherche client, statut, compte masqué, devise, soldes ledger/disponible/bloqué, plafond et dernière actualisation.
- Afficher les soldes uniquement depuis la projection serveur dérivée du ledger ; rendre les champs de solde non éditables.
- Ajouter un bouton « Recharger » qui relit la projection et l’historique autoritaires, sans recalcul dans le navigateur.
- Présenter l’historique des écritures, virements, réservations, ajustements et changements de plafond avec références d’audit.
- Modifier les plafonds via une commande serveur permissionnée, versionnée et auditée ; les changements sensibles passent par approbation selon le seuil configuré.

**Validation**
- Recherche, filtres, états vides et pagination.
- Concordance compte → projection → ledger.
- Deux modifications concurrentes ne peuvent pas s’écraser silencieusement.

### 4. Approvisionnements et contrôle à quatre yeux
- Créer `/admin/finance/adjustments` et `/admin/finance/approvals`.
- Un opérateur prépare un approvisionnement avec compte, montant USD, motif, pièce justificative facultative et clé d’idempotence.
- Un superviseur différent approuve ou rejette ; l’auteur ne peut jamais approuver sa propre demande.
- Après approbation seulement, poster une transaction équilibrée via le moteur ledger existant, mettre à jour la projection, puis enregistrer l’audit et la notification client.
- Le bouton « Recharger » du compte affiche le nouveau solde uniquement après posting réussi.
- Toute correction d’une opération comptabilisée se fait par reversal lié à l’écriture originale, jamais par suppression ou modification du ledger.

**Validation**
- Tests maker ≠ checker, permissions, double-clic, rejeu idempotent, concurrence et rollback.
- Vérification débit = crédit pour chaque posting.
- Test réel sur un compte contrôlé : demande → approbation → ledger → projection → historique → relevé.

### 5. Relevés mensuels automatiques
- Réutiliser le pipeline actuel de génération serveur et les snapshots immuables, sans dupliquer le moteur PDF.
- Ajouter une tâche mensuelle authentifiée, déclenchée le premier jour du mois pour la période précédente, sur les comptes éligibles.
- Garantir l’idempotence : une période déjà générée est réutilisée ; une génération interrompue est reprise sans doublon.
- Bloquer la finalisation si `solde d’ouverture + crédits - débits ≠ solde de clôture`.
- Enregistrer succès/échec, motif sûr, nombre de comptes traités et possibilité de relance réservée au personnel autorisé.
- Les relevés finalisés apparaissent automatiquement dans `/app/statements` et restent accessibles uniquement à leur propriétaire.

**Validation**
- Mois sans opération, compte ouvert/fermé en cours de mois, virements et approvisionnements, relance du job, panne partielle.
- Contrôle du PDF A4, des soldes, écritures, références et de la réconciliation.

## Invariants de sécurité des soldes
```text
Commande admin
  → authentification employé
  → permission serveur
  → validation métier + idempotence
  → maker-checker si sensible
  → posting ledger double-entrée
  → projection de solde en lecture seule
  → audit immuable
  → notification et relevé
```

- Aucun formulaire ni appel admin ne peut écrire directement dans `account_balances`.
- Aucun rôle, même super-administrateur, ne peut modifier ou supprimer une écriture comptabilisée.
- USD est la devise comptable ; USDT reste une unité de cotation/conversion tant qu’un vrai rail de règlement distinct n’est pas introduit.
- Les secrets et accès privilégiés restent exclusivement côté serveur.

## Après le socle admin
- Ajouter le lien du dashboard client vers le site public.
- Refaire l’accueil avec l’histoire institutionnelle vérifiée de RFC Royal FINANCE Bank, des photographies authentiques et licenciées de Trinidad-et-Tobago, ainsi que des actualités locales datées et administrables.
- Ne publier aucun faux événement, faux témoignage ou photographie présentée comme réelle sans source et droits d’utilisation.

## Critères de fin
- Tests de permissions et sécurité réussis.
- Postings équilibrés et projections réconciliées.
- Parcours admin vérifié sur ordinateur et mobile.
- Aucun échec de compilation ou d’exécution.
- Rapport remis après chaque bloc avant de poursuivre le suivant.
