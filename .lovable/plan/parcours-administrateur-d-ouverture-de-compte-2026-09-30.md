# Parcours administrateur d’ouverture de compte

## Objectif
Permettre au personnel autorisé de suivre tout le parcours depuis une invitation par e-mail jusqu’à l’ouverture contrôlée du compte, avec une validation à quatre yeux et un accès client limité tant que l’identité n’est pas définitivement validée.

## Parcours livré
1. **Inviter un client**
   - Depuis « Dossiers d’ouverture », un agent autorisé saisit prénom, nom et e-mail.
   - Le client reçoit une invitation sécurisée pour définir son mot de passe, confirmer son adresse et poursuivre lui-même les étapes 1 à 4.
   - Les invitations répétées sont contrôlées et toutes les actions sont tracées.
2. **Suivre la soumission**
   - Le registre affiche la progression, l’état de l’e-mail, les documents reçus et la prochaine action.
   - Le client reprend son dossier là où il l’avait laissé et soumet sa demande depuis le parcours mobile existant.
3. **Premier examen KYC**
   - Un agent disposant de `kyc.review` examine les pièces, peut demander un complément, recommander l’approbation ou recommander le refus avec un motif obligatoire.
   - Cette étape ne valide pas définitivement le client et n’ouvre pas de compte.
4. **Seconde validation**
   - Un autre membre disposant de `kyc.approve` confirme ou refuse la recommandation.
   - Le système interdit au premier examinateur de valider sa propre décision, y compris côté serveur.
5. **Ouverture et espace limité**
   - Après la seconde approbation, le système marque l’identité comme validée, ouvre une fois le compte principal USD et conserve le client dans un accès limité de revue bancaire.
   - Un membre autorisé peut ensuite activer le compte bancaire ; jusque-là, les opérations monétaires restent verrouillées et le client voit clairement son état.

## Interface
- En-tête avec bouton « Inviter un client », recherche et filtres par étape de décision.
- Cartes mobiles et tableau desktop avec une frise claire : invitation → dossier transmis → premier examen → seconde validation → compte ouvert.
- Fiche d’action accessible sur mobile avec documents, identité, motif, historique des deux validations et confirmation explicite avant toute décision.
- Textes et retours d’erreur complets en français et en anglais.

## Sécurité et données
- Ajouter une table dédiée aux demandes de validation KYC, avec droits explicites, RLS et historique immuable des acteurs/dates/motifs.
- Ajouter des permissions distinctes pour invitation, examen et approbation ; ne jamais utiliser un rôle enregistré côté navigateur.
- Exécuter les décisions dans des fonctions serveur transactionnelles : contrôle des permissions, verrouillage de ligne, interdiction d’auto-validation, idempotence et écriture dans l’audit admin.
- L’invitation utilise exclusivement l’administration d’authentification côté serveur ; aucun mot de passe provisoire n’est créé ni exposé.
- L’ouverture réutilise la fonction privilégiée existante et la comptabilité existante ; aucun solde n’est modifié directement.

## Validation
- Tests des fonctions : permissions insuffisantes, dossier incomplet, première décision, auto-approbation refusée, seconde approbation, refus et répétition sans doublon.
- Test mobile du parcours admin et du parcours client invité : invitation, activation, étapes 1–4, soumission, décisions séparées et arrivée dans l’espace limité.
- Vérification des états en base, de l’unique compte USD, des traces d’audit, des traductions FR/EN, de l’absence de débordement et de la compilation.

## Limite de test
La validation réelle à quatre yeux nécessite deux comptes personnels distincts disposant des permissions adéquates. Si ces comptes ne sont pas disponibles, le mécanisme sera testé au niveau serveur et l’interface jusqu’au contrôle d’accès, puis cette limite sera signalée précisément.
