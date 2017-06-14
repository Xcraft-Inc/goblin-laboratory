# Laboratory
> Bienvenue dans le labo des gobelins!

Le labo offre un espace de travail facilitant la construction d'application UI.

Il instancie pour vous une fenêtre electron et se connecte au contenu du laboratoire 
en ouvrant le bundle webpack à une URL donnée.

Il optimise la communication avec les gobelins en s'occupant de souscrire aux state des différents gobelins dans l'entrepôt de states (voir. gobelin-warehouse).

En créant un labo, vous optenez un espace de travail utilisateur prêt à l'emploi.

Cet espace est pré-découpé en zone de montages stratégiques:

- root
- top-bar
- task-bar
- content

Par défaut, un laboratoire va monter un gestionnaire de travaux utilisateurs qui permet un routage des tâches utilisateurs dans la UI. Ce comportement par défaut peut-être remplacé en explicitant le mapping montage/vue à la création du laboratoire.


## Widget

Un labo est automatiquement cablé pour écouter les changements d'états des widgets dans le state. 

Un composant react `Widget` de base permet d'écrire des composant connecté pour vos gobelins.

### Formulaires

Si votre widget doit se comporter en formulaire de saisies, il faut exposer un getter spécifique:

```js
 get isForm () {
    return true;
  }
```

### Wiring (cablâge des propriétés)

Un widget est dit cablé lorsqu'on fournit un `id` à celui-ci lors de son utilisation.

Dans ce cas, les propriétés cablée respecterons l'état du widget dans le state.

Un widget cablé doit être créé par un goblin, et ces propriétés cablée doivent être définie via son API.
Certaine propriétés du widget ne sont pas cablée sur le state est peuvent être définie au rendu.

Si le widget n'est pas cablé par id, il peut-être utilisé librement en définissant ces propriétés au rendu.

### Styling

Tout widget peut-être accompagné d'un fichier de style permettant de calculer le style du widget à l'aide du theme courant.

## List

Un widget spécial permettant l'affichage de liste très longues de manière efficace.


## specs goblin-laboratory

- routage et composition de vues inter-app
- pilotage du goblin wm
- persistance des paramètres liés a l'espace de travail inter-gadgets
- composant d'auto-layout
- persistance de settings de fenêtre inter-gadgets (écoute events wm)
- lazy loading des gagdgets https://webpack.js.org/guides/lazy-load-react/

### Exemple de quest

crée des gadgets avec leurs states:

`laboratory.create goblin-passport /passport [passport, passport_nabu]`

`laboratory.create goblin-sync /syncui [syncui, syncui_nabu, passport]`

lister l'état des gadgets:

`laboratory.list`

ouvrir la vue principale de passport dans une nouvelle fenetres:

`laboratory.open /passport`

passe de la vue de passport a la vue principale de SyncUI
dans la même fenetre:

`laboratory.switch /passport /syncui`

ouvrir la vue principale de passport et de syncui dans une nouvelle fenetres:

`laboratory.open /passport /syncui`


crée et ouvre nabu pour syncui dans une nouvelle fenetre:

`laboratory.create goblin-nabu /nabu_sync [syncui_nabu] open:true`

fermer une fenetre:

`laboratory.close /nabu_sync`

naviguer dans une vue:

`laboratory.navigate /syncui/someview`

cacher/afficher une fenêtre:

`laboratory.hide /syncui`
`laboratory.show /syncui`
