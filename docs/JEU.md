# Défis, cartes, trophées et classement (v32)

## Défis
- Chaque semaine (lundi à dimanche) : 1 défi commun et 2 personnels. Chaque mois : 3 communs et 3 personnels.
- Les défis communs sont tirés d'après la date (même résultat pour tout le monde, sans serveur). Les personnels viennent de tes 3 derniers mois (ou 4 dernières semaines) : ton point fort un peu plus haut, ton point faible, et le milieu.
- Ils sont créés à l'ouverture de l'appli et gardés dans les réglages (`cfg.defis`), donc sur tous tes appareils. Un défi fini garde son résultat (`done`, `end`, `fp`).

## Cartes
- 60 cartes, 5 raretés (Commune, Rare, Épique, Légendaire, Mythique), 7 collections. Aucune valeur réelle.
- Pack = 3 cartes. Défi de la semaine : pack. Défi du mois, palier de trophée, collection complète : pack premium (au moins une carte Rare).
- Un pack standard sans carte Rare 4 fois de suite garantit une Rare au 5e.
- Doublons : poussière (1, 3, 8, 20, 50). Fabriquer une carte manquante : 5, 15, 40, 100, 250.
- Tout est dans `cfg.cartes`. Chaque pack n'est offert qu'une fois (liste `paid`).

## Trophées
10 catégories, 5 paliers (Bronze, Argent, Or, Platine, Diamant), calculés d'après tes données. Un pack premium par palier atteint.

## Classement
- Amis : voir `classement-setup.sql` (déjà en place).
- Monde et Région : lance **une fois** `classement-monde-setup.sql` dans Supabase (SQL Editor). Facultatif pour chaque joueur.
- Points du mois : publier 1, vendre 3, colis 1, défi réussi 5 (plafond 5 000). Les points sont calculés sur l'appareil : le serveur limite les valeurs mais ne peut pas empêcher de tricher.
- Quitter le classement efface le profil public et les scores. Supprimer le compte efface tout (cascade).
- Modération : les pseudos ne sont pas filtrés. À surveiller si l'appli grandit.