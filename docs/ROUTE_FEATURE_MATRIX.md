# Route → Feature Matrix

> Référence fonctionnelle de la navigation client et de la surface métier bancaire.
>
> Cette matrice décrit l'alignement entre une route, son utilité fonctionnelle, sa présence dans la navigation, son raccordement backend, son niveau UX et sa préparation production. Elle sert de référence lors des prochains audits et migrations.

## Référence client

| Route | Utilité | Navigation | Backend | UX | Production |
|---|---|---|---|---|---|
| `/app/dashboard` | forte | oui — Accueil | oui | à finaliser | oui |
| `/app/accounts` | forte | oui — Comptes | oui | oui | oui |
| `/app/transfers` | critique | oui — Virements | oui | à renforcer | partiel externe |
| `/app/statements` | forte | oui — Relevés | oui | à finaliser | oui |
| `/app/messages` | forte | oui — Messages | oui | à finaliser | oui |
| `/app/security` | critique | oui — Sécurité / Plus | oui | à auditer | oui |
| `/admin/*` | critique | oui — navigation séparée | oui | à finaliser | oui |

## Navigation primaire

### Mobile

Cinq destinations persistantes :

1. **Accueil** → `/app/dashboard`
2. **Comptes** → `/app/accounts`
3. **Virement** → `/app/transfers/new`
4. **Activité** → `/app/activity`
5. **Plus** → `/app/more`

Les destinations secondaires restent accessibles depuis **Plus** : bénéficiaires, virements, opérations, relevés, documents, messages, notifications, profil, sécurité, préférences et aide.

### Desktop

La barre latérale client expose :

- Accueil
- Comptes
- Virement
- Activité
- Bénéficiaires
- Relevés
- Documents
- Messages

Les destinations de compte — notifications, profil, sécurité, préférences et aide — restent séparées dans le groupe secondaire.

### Administration

L'administration reste isolée de la navigation client. Sa surface comprend notamment :

- Tableau de bord
- Clients
- Dossiers d'ouverture
- Comptes
- Approvisionnements
- Transferts externes
- Service client
- Audit
- Parité & tarifs

## Règles de référence

### 1. Une route n'est pas automatiquement une destination primaire

L'existence d'une route ne justifie pas sa présence dans la navigation principale. Le placement dépend de son rôle dans le parcours et de sa fréquence/criticité fonctionnelle.

### 2. Une fonctionnalité critique doit avoir une chaîne complète

Pour les fonctionnalités sensibles, notamment les virements et la sécurité, l'audit couvre au minimum :

**route → état UX → commande → validation → service backend → persistance/événement → feedback → reprise d'erreur**

### 3. Une route navigable doit avoir un état métier explicite

Une destination affichée dans la navigation ne doit pas donner l'impression d'être pleinement opérationnelle si son domaine est encore partiellement implémenté. Utiliser les états UX normalisés du design system plutôt que des écrans génériques ou silencieux.

### 4. Les surfaces secondaires doivent rester découvrables

Relevés, documents, messages, notifications, sécurité et préférences peuvent rester hors de la navigation primaire mobile, mais doivent être accessibles sans parcours ambigu depuis **Plus** ou les écrans concernés.

### 5. Admin ≠ client

Les routes `/admin/*` ne doivent pas être mélangées à la navigation client. Leur navigation, leurs permissions et leurs états UX sont audités séparément.

### 6. Cette matrice précède les prochaines corrections

Toute nouvelle route ou migration importante doit préciser son impact sur :

- utilité fonctionnelle ;
- navigation ;
- backend / contrats ;
- UX ;
- production.

## Prochaines passes issues de la matrice

1. **Dashboard** — finaliser la première vue, états vides/provisioning/restriction et densité mobile.
2. **Transfers** — renforcer la chaîne UX de création → confirmation → traitement → résultat, notamment les états externes.
3. **Statements** — finaliser chargement, recherche/filtrage, téléchargement et états d'absence de relevé.
4. **Messages** — finaliser boîte de réception, lecture, états non lus, erreurs et reprise.
5. **Security** — auditer parcours sensibles, sessions, appareils, authentification et confirmations.
6. **Admin** — finaliser la cohérence des surfaces administratives sans les mélanger au shell client.

## Critère de clôture

Une ligne passe de **à finaliser / à renforcer / à auditer** à **oui** uniquement après une vérification du parcours complet correspondant. La matrice ne remplace pas les tests : elle définit leur périmètre et leur ordre de contrôle.
