# Corriger les erreurs admin sans écran blanc

## Objectif
Empêcher les échecs attendus d’invitation ou de décision KYC de remonter comme erreurs runtime globales, tout en conservant un message clair dans l’interface.

## Modifications
- Faire retourner aux fonctions serveur admin un résultat métier structuré pour les erreurs récupérables : adresse déjà inscrite, quota d’invitations, dossier déjà traité, séparation des deux agents et état KYC devenu obsolète.
- Garder les erreurs d’autorisation et incidents inattendus comme erreurs serveur réelles.
- Adapter les mutations et dialogues d’invitation/KYC pour afficher le message bilingue correspondant, fermer ou actualiser la vue lorsque l’action a déjà été traitée, sans laisser l’écran en erreur.
- Vérifier que la seconde validation corrigée continue d’ouvrir uniquement un compte USD `PENDING` en état `BANKING_REVIEW`.

## Tests
- Typecheck et build automatiques.
- Reproduction mobile des échecs d’invitation et de décision pour confirmer l’absence d’erreur runtime et d’écran blanc.
- Parcours positif de décision KYC sur un dossier de test si un état test sûr est disponible.
