
# goblin-laboratory

- routage et composition de vues inter-app
- pilotage du goblin wm
- persistance des paramètres liés a l'espace de travail inter-gadgets
- composant d'auto-layout
- persistance de settings de fenêtre inter-gadgets (écoute events wm)
- lazy loading des gagdgets https://webpack.js.org/guides/lazy-load-react/

### Exemple de quest:

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
