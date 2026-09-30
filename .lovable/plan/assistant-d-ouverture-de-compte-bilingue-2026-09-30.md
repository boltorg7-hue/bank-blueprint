# Assistant d’ouverture de compte bilingue

## Objectif
Garantir que l’assistant comprend le contexte réel du dossier et répond entièrement dans la langue sélectionnée, en français comme en anglais.

## Mise en œuvre
- Localiser les consignes, les étapes, les statuts de documents et le contexte transmis au modèle.
- Renforcer la consigne pour empêcher le mélange des langues et conserver des réponses courtes, sûres et centrées sur l’ouverture de compte.
- Vérifier les libellés et erreurs visibles de l’assistant dans les deux langues.

## Validation
- Tester de vraies requêtes via AI Gateway en français et en anglais sur les prochaines étapes, les documents acceptés et une question hors périmètre.
- Vérifier la langue, l’exactitude par rapport à la progression simulée et l’absence de promesse d’acceptation ou de délai.
- Contrôler la compilation et l’affichage mobile de l’assistant.

## Détails techniques
Le modèle et le protocole existants sont conservés. Les données bancaires et les règles d’ouverture de compte ne sont pas modifiées.
