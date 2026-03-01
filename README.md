# 📘 goblin-laboratory

## Aperçu

`goblin-laboratory` est le module central de l'écosystème Xcraft pour la construction d'interfaces utilisateur React. Il orchestre la création de fenêtres applicatives (via Electron ou WebSocket), gère le cycle de vie des widgets connectés au store Redux, assure la synchronisation des états backend vers le frontend, et fournit la classe de base `Widget` dont dérivent tous les composants graphiques Xcraft.

Le laboratoire est l'acteur Goblin qui fait le lien entre le monde backend (bus Xcraft, acteurs Goblin/Elf) et le monde frontend (React, Redux). Il gère également le thème visuel, le zoom de l'interface, et expose un terminal intégré (`Termux`) pour l'administration.

## Sommaire

- [Aperçu](#aperçu)
- [Structure du module](#structure-du-module)
- [Fonctionnement global](#fonctionnement-global)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Interactions avec d'autres modules](#interactions-avec-dautres-modules)
- [Configuration avancée](#configuration-avancée)
- [Détails des sources](#détails-des-sources)
- [Licence](#licence)

## Structure du module

Le module s'articule autour de plusieurs couches :

**Acteurs backend (Goblin/Elf) :**

- `laboratory` — acteur Goblin principal, gère la fenêtre et le cycle de vie de l'interface
- `carnotzet` — acteur Goblin léger pour les interfaces sans fenêtre native (mode WebSocket pur)
- `Termux` — acteur Elf singleton, terminal de commandes intégré à l'interface
- `Blueprint` / `Blueprints` — acteurs Elf pour la persistance de métadonnées d'entités

**Infrastructure frontend :**

- `Renderer` et ses variantes (`ElectronRenderer`, `BrowsersRenderer`, `ElectronRendererWS`) — bootstrapping React
- `Widget` — classe de base pour tous les composants graphiques Xcraft
- Redux store avec ses reducers (`backend`, `widgets`, `commands`, `network`, `app`, `router`)
- Middlewares Redux (`transit`, `quest`, `form`) pour la communication bidirectionnelle

**Widgets utilitaires :**

- `ThemeContext` — injection du thème CSS calculé dynamiquement
- `WithModel`, `WithC`, `C` — connexion déclarative des props au state Redux
- `StateLoader`, `CollectionLoader` — chargement conditionnel selon l'état backend
- `ErrorHandler` — boundary d'erreurs React avec récupération
- `DisconnectOverlay`, `Maintenance` — états de connexion et maintenance
- `Frame`, `Root` — racine de l'arbre React

## Fonctionnement global

### Flux de données backend → frontend

```
Backend (Goblin/Elf)
        │
        ▼
  Warehouse (état)
        │
        ▼
  Channel (ElectronChannel / WebSocketChannel)
        │  envoie NEW_BACKEND_STATE / PUSH_PATH / DISPATCH_IN_APP
        ▼
  Renderer (frontend)
        │
        ▼
  transitMiddleware → backendReducer → Redux Store
        │
        ▼
  Widget.connect() → React re-render
```

Le backend sérialise les états Xcraft en transit JSON (via `xcraft-core-transport`) et les envoie au frontend. Le `transitMiddleware` désérialise et gère les générations pour détecter les pertes de paquets. Le `backendReducer` applique les patches ou remplace l'état complet.

### Flux de données frontend → backend

```
Widget React (interaction utilisateur)
        │  cmd() / doFor()
        ▼
  questMiddleware → send('QUEST', action)
        │
        ▼
  IPC Electron / WebSocket
        │
        ▼
  Bus Xcraft → quête Goblin
```

Les actions utilisateur déclenchent des quêtes backend via le mécanisme `QUEST`. Le middleware sérialise l'action et l'envoie via IPC ou WebSocket selon le transport utilisé.

### Compensation optimiste

Le `backend-reducer` implémente un mécanisme de compensation : lors d'une modification de champ (`FIELD-CHANGED`), la valeur est mise à jour immédiatement dans le store frontend avant confirmation backend. Les compensateurs sont débounés à 300ms.

### Gestion des générations

Chaque état backend porte un numéro de génération. Si des générations sont perdues (réseau instable), le frontend demande un renvoi complet (`RESEND`). En mode patch (`_xcraftPatch`), seules les différences sont transmises.

## Exemples d'utilisation

### Créer un laboratoire (acteur Goblin)

```javascript
// Depuis un acteur Goblin
await quest.create('laboratory', {
  id: 'laboratory@myapp',
  desktopId: 'desktop@user1',
  clientSessionId: 'client-session@abc',
  url: 'http://localhost:3000',
  config: {
    feeds: ['workshop'],
    themeContexts: ['theme'],
    useWS: false,
    title: 'Mon Application',
  },
});
```

### Créer un carnotzet (mode WebSocket)

```javascript
await quest.create('carnotzet', {
  id: 'carnotzet@session1',
  clientSessionId: 'client-session@abc',
  config: {
    feed: 'desktop@user1',
    feeds: ['workshop'],
    theme: 'default',
    themeContexts: ['theme'],
  },
});
```

### Créer un widget connecté

```javascript
import Widget from 'goblin-laboratory/widgets/widget';

class MyWidget extends Widget {
  render() {
    const {name, age} = this.props;
    return (
      <div>
        {name} ({age})
      </div>
    );
  }
}

export default Widget.connect((state, props) => ({
  name: state.get(`backend.${props.id}.name`),
  age: state.get(`backend.${props.id}.age`),
}))(MyWidget);
```

### Utiliser les props connectées avec `C` et `withC`

```javascript
import C from 'goblin-laboratory/widgets/connect-helpers/c';
import withC from 'goblin-laboratory/widgets/connect-helpers/with-c';

// Connecter un champ texte à l'état backend
const TextField = withC(TextFieldNC, {value: 'onChange'});

// Utilisation dans un render
<TextField value={C('.name')} />

// Avec transformation
<TextField value={C('.age', age => String(age), str => Number(str))} />

// Spread sur plusieurs props
<Label {...C('.person', ({firstname, lastname}) => ({
  text: `${firstname} ${lastname}`,
}))} />
```

### Utiliser `WithModel` pour contextualiser les chemins

```javascript
import WithModel from 'goblin-laboratory/widgets/with-model/widget';

// Tous les C('.field') dans les enfants seront relatifs à backend.person@123
<WithModel model="backend.person@123">
  <TextField value={C('.name')} />
  <TextField value={C('.email')} />
</WithModel>;
```

### Utiliser l'acteur Termux depuis un autre Elf

```javascript
const termux = new Termux(this);
await termux.init();
// Le terminal est maintenant accessible via Alt+F12 dans l'UI
```

### Créer un Blueprint (métadonnée d'entité persistée)

```javascript
const blueprint = new Blueprint(this);
await blueprint.create('blueprint@case', desktopId);
await blueprint.change('fields.status.label', 'Nouveau statut');
```

## Interactions avec d'autres modules

- **[xcraft-core-goblin]** : Fournit les mécanismes de base Goblin (quêtes, Shredder, dispatch, Elf)
- **[xcraft-core-transport]** : Sérialisation/désérialisation des états en transit JSON
- **[xcraft-core-stones]** : Typage des shapes d'acteurs Elf (`string`, `boolean`, `array`, etc.)
- **[xcraft-core-utils]** : Utilitaires divers dont `parseOptions` pour le parsing de commandes
- **[xcraft-core-probe]** : Instrumentation des performances IPC/WebSocket
- **[xcraft-core-log]** : Journalisation des avertissements et erreurs internes
- **[goblin-theme]** : Fournit les builders de thème consommés par `ThemeContext`

## Configuration avancée

| Option        | Description                                       | Type     | Valeur par défaut |
| ------------- | ------------------------------------------------- | -------- | ----------------- |
| `defaultZoom` | Facteur de zoom initial pour le frontend Electron | `number` | `1.0`             |

### Variables d'environnement

| Variable           | Description                                              | Exemple       | Valeur par défaut |
| ------------------ | -------------------------------------------------------- | ------------- | ----------------- |
| `GOBLINS_DEVTOOLS` | Active les DevTools Electron à l'ouverture de la fenêtre | `1`           | non défini        |
| `NODE_ENV`         | Active Redux DevTools en mode développement              | `development` | non défini        |

## Détails des sources

### `lib/carnotzet.js`

Acteur Goblin léger destiné aux interfaces sans fenêtre native (mode WebSocket/navigateur). Il joue le même rôle de coordinateur que `laboratory` mais sans gestion de fenêtre Electron.

#### Cycle de vie

À la création (`create`), le carnotzet :

1. Valide que `config.feed` est présent
2. Crée un acteur `theme-composer` pour chaque contexte de thème
3. Souscrit au warehouse pour les feeds configurés
4. S'abonne à `goblin.released` pour nettoyer les widgets libérés

À la destruction (`delete`), il se désabonne du warehouse et libère sa branche.

#### Méthodes publiques (quêtes)

- **`create(clientSessionId, config)`** — Initialise le carnotzet avec la configuration du feed et des thèmes.
- **`get-feed()`** — Retourne l'identifiant du feed courant.
- **`set-root(widget, widgetId)`** — Définit le widget racine à afficher.
- **`del(widgetId)`** — Supprime un widget du feed (désabonnement warehouse).
- **`change-theme(name)`** — Change le thème actif.
- **`when-ui-crash(desktopId, error, info)`** — Journalise les erreurs de rendu React.

### `widgets/laboratory/service.js`

Acteur Goblin principal du module. Il orchestre la création complète d'une fenêtre applicative Electron, y compris la gestion du zoom, du thème, des feeds warehouse, et du terminal Termux.

#### Cycle de vie

1. **`create`** : instancie le Termux, crée les `theme-composer`, crée le `wm`, initialise zoom et thème depuis la session client, abonne les listeners de fermeture de fenêtre et de reload de thème.
2. **`listen`** : active les abonnements aux événements de navigation, changement de thème et dispatch provenant du desktop.
3. **`close`** : ferme la fenêtre via `client-session` et `client`, puis libère l'acteur.
4. **`delete`** : désactive les listeners (`unlisten`).

#### Méthodes publiques (quêtes)

- **`create(desktopId, clientSessionId, userId, url, config)`** — Crée la fenêtre et l'infrastructure complète.
- **`close()`** — Ferme proprement la fenêtre et libère l'acteur.
- **`listen(desktopId, userId, useConfigurator)`** — Active l'écoute des événements du desktop.
- **`set-root(widget, widgetId, themeContext)`** — Définit le widget racine affiché.
- **`set-feed(desktopId)`** — Change le feed souscrit (greffe les branches dans le warehouse).
- **`change-theme(name)`** — Change le thème et persiste la préférence.
- **`zoom()` / `un-zoom()` / `default-zoom()` / `change-zoom(zoom)`** — Contrôle du zoom avec persistance.
- **`dispatch(action)`** — Envoie une action Redux directement au frontend.
- **`nav(route)`** — Navigation vers une route.
- **`duplicate(forId)`** — Duplique le laboratoire dans une nouvelle fenêtre.
- **`del(widgetId)`** — Supprime un widget du feed ou ferme l'application selon le contexte.

### `lib/termux.js` et `termux.js`

#### Rôle

Le Termux est un terminal de commandes intégré à l'interface, accessible via `Alt+F12`. Il permet d'exécuter des commandes du bus Xcraft directement depuis l'UI, avec autocomplétion, historique de navigation, et gestion des signaux (`SIGINT`).

L'acteur `Termux` est un `Elf.Alone` (singleton). La logique de mutation d'état est dans `TermuxLogic` (un `Elf.Spirit`).

#### État et modèle de données

L'état est décrit par `TermuxShape` :

| Champ          | Type             | Description                                            |
| -------------- | ---------------- | ------------------------------------------------------ |
| `id`           | `string`         | Identifiant de l'acteur (`"termux"`)                   |
| `prompt`       | `string`         | Invite de commande courante (`"~ $"` ou `"~ #"`)       |
| `busy`         | `boolean`        | Indique si une commande est en cours d'exécution       |
| `history`      | `array(string)`  | Historique des entrées et sorties affichées            |
| `completion`   | `string`         | Suggestion d'autocomplétion courante                   |
| `value`        | `string`         | Valeur courante de la ligne de saisie                  |
| `toolName`     | `option(string)` | Nom de l'outil en cours d'exécution (pour SIGINT)      |
| `inputCommand` | `boolean`        | Indique si le terminal attend une saisie interactive   |
| `cmd`          | `option(string)` | Commande en attente d'input interactif                 |
| `args`         | `option(object)` | Arguments de la commande en attente d'input interactif |

#### Cycle de vie

- **`init()`** — Initialise le prompt selon le rang de l'utilisateur (`admin` → `~ #`, sinon `~ $`), charge les outils disponibles depuis le registre de commandes, s'abonne aux événements `<termux-input>` et `<termux-output>`, écoute les changements de registre de commandes.
- **`dispose()`** — Désabonne le listener du registre de commandes.

#### Méthodes publiques

- **`init()`** — Initialise le terminal (idempotent).
- **`beginCommand(command)`** — Parse et exécute une commande, met à jour l'historique.
- **`endCommand(result)`** — Termine une commande et affiche le résultat.
- **`inputCommand(input)`** — Traite une saisie interactive (mode `forInputCommand`).
- **`forInputCommand(question, cmd, args)`** — Met le terminal en attente d'une saisie utilisateur.
- **`forOutputCommand(value)`** — Ajoute une sortie dans l'historique.
- **`askForCompletion(input)`** — Calcule et affiche les suggestions d'autocomplétion.
- **`setFromHistory(up, input)`** — Navigation dans l'historique des commandes (haut/bas).
- **`clearCompletion()`** — Efface la suggestion courante.
- **`signal(signal)`** — Envoie un signal (`SIGINT`) à la commande en cours.

#### Outils intégrés (quêtes `$tool`)

Les outils sont des commandes spéciales enregistrées avec le suffixe `$tool`. Ils sont listés et exécutables directement depuis le terminal Termux.

- **`clear$tool()`** — Vide l'historique du terminal.
- **`man$tool(name)`** — Affiche la documentation d'une commande (module, emplacement, usage, paramètres).
- **`buslog$tool(horde, verbosityLevel, ...moduleNames)`** — Configure le niveau de verbosité des logs du bus (admin uniquement pour les hordes passives).
- **`metrics$tool(horde, output?)`** — Récupère les métriques du bus Xcraft au format JSON, avec export optionnel vers un fichier.
- **`heapdump$tool(horde)`** — Déclenche un heap dump sur le processus cible.
- **`malloctrim$tool(horde)`** — Libère la mémoire non utilisée via `malloc_trim`.

### `lib/index.js`

Fournit les classes `ElectronChannel` et `WebSocketChannel` utilisées par le backend pour envoyer des messages au frontend.

- **`ElectronChannel(win)`** — Utilise `win.webContents.send` pour la communication intra-processus Electron.
- **`WebSocketChannel(win)`** — Utilise une connexion WebSocket pour les clients distants ou les navigateurs.

Les deux canaux exposent : `sendBackendState(msg)`, `sendPushPath(path)`, `sendAction(action)`, `beginRender(labId, tokens)`.

### `lib/blueprints/blueprint.js`

Acteur Elf persisté (`Elf.Archetype`) représentant un blueprint d'entité. Les blueprints décrivent la structure d'une entité (champs, références, collections, configuration UI) sous forme de métadonnées persistées dans la base `blueprints`.

#### État et modèle de données

L'état est décrit par `BlueprintShape` :

| Champ         | Type                                      | Description                            |
| ------------- | ----------------------------------------- | -------------------------------------- |
| `id`          | `string`                                  | Identifiant du blueprint               |
| `entity`      | `string`                                  | Nom de l'entité décrite (ex: `"case"`) |
| `fields`      | `record(string, FieldShape)`              | Dictionnaire des champs de l'entité    |
| `references`  | `option(record(string, ReferenceShape))`  | Pointeurs vers d'autres entités        |
| `collections` | `option(record(string, CollectionShape))` | Collections de pointeurs               |
| `ui`          | `option(UiConfigShape)`                   | Configuration UI globale de l'entité   |

Les shapes imbriquées clés :

- **`FieldShape`** : `type` (text, enum, date…), `label`, `required`, `readonly`, `hidden`, `values` (pour les enums), `ui` (hints de filtrage, tri, recherche)
- **`ReferenceShape`** : `entity` (cible), `label`, `lookup` (représentation dans l'UI avec `labelPaths`, `iconPath`, `drilldown`)
- **`UiConfigShape`** : `icon`, `primaryLabel`, `secondaryLabel`, `defaultSort`

#### Méthodes publiques

- **`create(id, desktopId)`** — Crée et persiste le blueprint.
- **`change(path, newValue)`** — Met à jour un champ du blueprint et persiste.
- **`delete()`** — Destructeur (no-op actuellement).

### `lib/blueprints/blueprints.js`

Acteur Elf singleton (`Elf.Alone`) qui charge l'ensemble des blueprints persistés au démarrage.

#### Méthodes publiques

- **`loadAll(desktopId)`** — Lit tous les IDs depuis la base `blueprints` via `cryo.reader` et monte chaque `Blueprint` dans la session desktop.

### `widgets/widget/index.js`

La classe `Widget` est la brique fondamentale de tous les composants graphiques Xcraft. Elle étend `React.Component` et fournit :

**Connexion au store :**

- **`Widget.connect(mapStateToProps)`** — HOC de connexion Redux avec égalité Shredder optimisée.
- **`Widget.connectBackend(mapStateToProps)`** — Connexion automatique sur `backend.${props.id}`, affiche `null` si l'état n'est pas chargé.
- **`Widget.connectWidget(mapStateToProps)`** — Connexion sur `widgets.${props.id}`.
- **`Widget.Wired(Component)`** — Connecte automatiquement selon la définition `static get wiring()`.

**Communication avec le backend :**

- **`cmd(cmd, args)`** — Envoie une quête au bus Xcraft (vérifie les droits via le registre).
- **`do(action, args)`** — Appelle une quête sur le service correspondant au nom du widget.
- **`doFor(serviceId, action, args)`** — Appelle une quête sur un service spécifique par ID.
- **`doDispatch(model, name, args)`** — Route vers `doFor` (backend) ou `dispatchTo` (widgets) selon le modèle.
- **`canDo(cmd)`** — Vérifie si une commande est autorisée pour l'utilisateur courant.

**Dispatch Redux :**

- **`dispatch(action, name?)`** — Dispatch dans le reducer frontend du widget courant.
- **`dispatchTo(id, action, name?)`** — Dispatch dans le reducer d'un widget cible.
- **`dispatchToCache(id, payload)`** — Stocke une valeur dans le cache du desktop (persisté entre montages).
- **`rawDispatch(action)`** — Dispatch direct dans le store Redux.

**Accès à l'état :**

- **`getState(path?)`** — Retourne l'état complet du store ou une valeur à un chemin.
- **`getBackendState(path?)`** — Retourne l'état backend de ce widget ou d'un ID spécifié.
- **`getWidgetState(path?)`** — Retourne l'état frontend du widget.
- **`getWidgetCacheState(widgetId)`** — Retourne la valeur du cache desktop pour un widget.

**Styles :**
La propriété `styles` est calculée via Aphrodite à partir d'un fichier `styles.js` companion. Le système fusionne les définitions de styles héritées et met en cache les résultats (LRU 2048 entrées).

**Navigation :**

- **`nav(route, frontOnly?)`** — Navigation via le router (frontend seul ou via le laboratoire).

**Utilitaires :**

- **`setBackendValue(path, value)`** — Modifie directement une valeur dans le state backend (compensation).
- **`reportError(error, info)`** — Remonte une erreur React au laboratoire.
- **`Widget.copyTextToClipboard(text)`** — Copie du texte dans le presse-papiers.
- **`Widget.getUserSession(state)`** — Retourne la session utilisateur courante depuis le state.
- **`Widget.getLoginSession(state)`** — Retourne la session de login courante.
- **`Widget.getSchema(state, path?)`** — Retourne le schéma depuis `workshop.schema`.

### `widgets/renderer.js`, `widgets/index-electron.js`, `widgets/index-browsers.js`, `widgets/index-electron-ws.js`

Ces fichiers constituent le bootstrap du frontend React selon le mode de rendu :

- **`ElectronRenderer`** (`index-electron.js`) — Utilise `ipcRenderer` pour communiquer avec le main process Electron. Récupère `wid` et `labId` depuis les paramètres d'URL.
- **`BrowsersRenderer`** (`index-browsers.js`) — Utilise WebSocket avec reconnexion exponentielle (125ms → doublement), gestion des tokens de session via `localStorage`/`sessionStorage`. Supporte le cas `Epsitec.Cresus.Shell` avec token via cookie.
- **`ElectronRendererWS`** (`index-electron-ws.js`) — Variante Electron utilisant WebSocket (pour les fenêtres secondaires ou le mode hybride). Récupère le port WebSocket via le paramètre `wss=` dans l'URL.

Tous héritent de `Renderer` (`renderer.js`) qui initialise le store Redux, l'historique de navigation et les handlers de drag & drop. Les messages JSON entrants sont parsés via un Web Worker dédié pour éviter de bloquer le thread principal.

### `widgets/store/`

Le store Redux est composé de plusieurs reducers combinés :

- **`backend-reducer`** — Gère l'état backend reçu du serveur. Supporte les patches différentiels (`_xcraftPatch`), les compensations optimistes et la mise à jour directe de champs (`FIELD-CHANGED`).
- **`widgets-reducer`** — Gère les états locaux frontend des widgets (découverte dynamique des reducers par namespace). Supporte `WIDGETS_COLLECT` pour nettoyer les états orphelins.
- **`commands-reducer`** — Maintient le registre des commandes disponibles sur le bus (`COMMANDS_REGISTRY`).
- **`network-reducer`** — Suit l'état de connexion des hordes (lag, overlay, message de déconnexion) via `CONNECTION_STATUS`.
- **`app-reducer`** — Délègue aux reducers d'application spécifiques (`app-reducer` de chaque module goblin, discriminé par `action._appName`).
- **`router-reducer`** — Gère la navigation (compatible `connected-react-router`).

Les middlewares configurés :

- **`transitMiddleware`** — Désérialise les états de transit, gère les générations, déclenche le resend en cas de perte, injecte les compensateurs.
- **`questMiddleware`** — Sérialise et envoie les actions `QUEST` au backend via le canal de communication.
- **`formMiddleware`** — Intercepte `FIELD-CHANGED` et les actions de formulaire (`rrf/change`) pour déclencher automatiquement les quêtes de mise à jour backend (`{goblin}.change` ou `{goblin}.change-{field}`) avec debounce 200ms pour les hinters.

### `widgets/connect-helpers/`

Ensemble d'utilitaires pour la connexion déclarative des props :

- **`C(path, inFunc?, outFunc?)`** — Crée une `ConnectedProp` liant une prop à un chemin dans le state. Supporte les tableaux de chemins pour passer plusieurs valeurs à `inFunc`.
- **`withC(Component, dispatchProps?, options?)`** — HOC qui donne à un composant la capacité de recevoir des `ConnectedProp`. Gère les chemins relatifs/absolus (via `ModelContext`), les transformations et les dispatches retour. L'option `modelProp` permet de définir le contexte de modèle à partir d'une prop connectée.
- **`joinModels(baseModel, nextModel)`** — Résout les chemins relatifs (préfixés par `.`) par rapport à un modèle de base.

### `widgets/theme-context/widget.js`

Composant `ThemeContext` qui injecte le thème calculé dynamiquement dans l'arbre React. Il :

1. Importe le contexte de thème (builders) via l'importer
2. Appelle les builders (`paletteBuilder`, `shapesBuilder`, `stylesBuilder`, etc.) pour construire le thème complet
3. Injecte les styles globaux CSS et les polices via des balises `<style>`
4. Force le re-rendu de tous les enfants via la prop `key` (basée sur `cacheName`) lors d'un changement de thème

Le `cacheName` combine le nom du thème et sa génération (incrémentée à chaque `reload-theme`) pour invalider le cache Aphrodite.

### `widgets/termux/widget.js`

Widget React connecté qui affiche le terminal Termux. Activé par `Alt+F12`, il s'affiche en superposition semi-transparente sur l'interface. Il gère :

- La saisie clavier avec raccourcis bash (`Ctrl+A`/`Ctrl+E` curseur, `Ctrl+U` effacer ligne, `Ctrl+W` effacer mot, `Tab` autocomplétion, flèches historique)
- L'historique défilant avec rendu inversé (le plus récent en bas)
- La transmission des signaux (`Ctrl+C` → `SIGINT`)
- L'autocomplétion via Tab

### `widgets/disconnect-overlay/widget.js`

Overlay plein écran affiché lorsque la connexion au backend est perdue. Affiche une icône réseau clignotante (animation 1.2s) et un message d'état. Le fond noir semi-transparent avec `backdrop-filter: blur` est positionné en `fixed` avec `z-index` configurable (défaut 20).

**Props :** `message` (string), `zIndex` (number, défaut 20), `children` (le contenu rendu derrière l'overlay).

### `widgets/maintenance/widget.js`

Overlay plein écran affiché pendant une opération de maintenance. Affiche une icône de verrouillage, une barre de progression et un message. Utilise le wiring automatique (`Widget.Wired`) pour lire `maintenance.status`, `maintenance.progress` et `maintenance.message`.

**Wiring :** `{id: 'id', status: 'maintenance.status', progress: 'maintenance.progress', message: 'maintenance.message'}`.

### `widgets/error-handler/widget.js`

Error boundary React (`getDerivedStateFromError`) qui capture les erreurs de rendu des composants enfants. Affiche une icône d'avertissement orange cliquable pour relancer le rendu (`setState({error: null})`).

**Props :** `big` (boolean, agrandit l'icône à 400%), `renderError` (function, personnalise le rendu d'erreur), `children`.

### `widgets/state-loader/widget.js`

Composant utilitaire qui attend qu'un état backend soit chargé avant de rendre ses enfants. Accepte `path` (relatif à `backend.`, vérifie l'existence de `.id`) ou `fullPath` (chemin absolu). Affiche optionnellement un `FallbackComponent` pendant le chargement.

### `widgets/collection-loader/widget.js`

Variante de `StateLoader` pour les collections : attend que tous les IDs d'une liste (`props.ids`) soient présents dans le backend avant de rendre les enfants. Si les enfants sont une fonction, elle leur passe la collection mappée comme argument.

### `widgets/with-model/widget.js`

Composant fournisseur de contexte de modèle. Définit `context.model` pour tous les enfants, permettant aux props `C('.relativePath')` de se résoudre correctement. Compatible avec l'API Context React moderne (`ModelContext`) et l'ancienne API legacy (`childContextTypes`).

### `widgets/with-desktop-id/widget.js` et `widgets/with-readonly/widget.js`

Fournisseurs de contexte pour `desktopId` et `readonly`, accessibles via hooks (`useDesktopId()`, `useReadonly()`) ou via le contexte legacy (`childContextTypes`). Exposent respectivement `DesktopIdContext` et `ReadonlyContext`.

### `widgets/with-workitem/widget.js`

Fournisseur de contexte qui expose `id`, `entityId` et `dragServiceId` aux descendants, tout en wrappant les enfants dans `WithReadonly`.

### `widgets/with-route/with-route.js`

HOC de connexion au router Redux. Permet de connecter un composant à la route courante avec surveillance de paramètres (`watchedParams`), query strings (`watchedSearchs`) et hash (`watchHash`). Expose `isDisplayed` (booléen) indiquant si la route courante correspond. Optimisé avec `shallowEqualShredder`.

### `widgets/frame/widget.js`

Composant racine qui fournit le store Redux, le `labId`, `dispatch` et le thème aux composants enfants via le contexte React legacy. Utilisé pour encapsuler des sous-arbres React dans un contexte Xcraft complet (ex : fenêtres secondaires).

### `widgets/root/index.js`

Composant racine monté par `Renderer`. Fournit le store Redux via `<Provider>` et optionnellement le router via `<ConnectedRouter>`. Instancie le widget `Laboratory` correspondant au `labId`, avec ou sans routing selon `props.useRouter`.

### `widgets/importer/`

Système de découverte dynamique des widgets via `require.context` Webpack. Permet d'importer n'importe quel type de ressource widget (`widget`, `styles`, `reducer`, `theme-context`, `app-reducer`, `compensator`, etc.) par namespace. Un importer personnalisé peut être fourni par `mainGoblinModule` (via `lib/.webpack-config.js`).

### `lib/.webpack-config.js`

Génère la configuration des alias Webpack pour le bundle frontend. Résout les aliases pour `t` (traductions Nabu), `nabu`, `goblin_importer` (avec support d'un importer personnalisé depuis `mainGoblinModule`) et `goblin_theme_fa` (FontAwesome Pro ou Free selon disponibilité du package `@fortawesome/fontawesome-pro`).

### `lib/helpers.js`

Utilitaire de parsing d'URL : `getParameter(search, name)` extrait un paramètre d'une query string (décode les caractères URL-encodés).

### `widgets/frontend-form/`

Composant `FrontendForm` qui crée un contexte `WithModel` sur `widgets.${widgetId}`. Le `reducer.js` associé gère les actions `INIT` (initialisation de l'état si vide) et `CHANGE` (mise à jour d'un chemin) pour un état de formulaire purement frontend.

### `widgets/store/middlewares.js`

Détails des middlewares Redux :

**`questMiddleware`** — Intercepte les actions de type `QUEST` et les envoie au backend via le canal de communication. Gère les states de compensation.

**`formMiddleware`** — Intercepte `FIELD-CHANGED` et les actions de formulaire (`rrf/change`, `rrf/batch`, `hinter/search`) pour déclencher automatiquement les quêtes de mise à jour backend correspondantes (`{goblin}.change` ou `{goblin}.change-{field}`). Utilise un debounce de 200ms pour les recherches hinter.

**`transitMiddleware`** — Désérialise les états backend (`NEW_BACKEND_STATE`), vérifie la continuité des générations et injecte les compensateurs. Déclenche `RESEND` si des générations sont perdues.

### `widgets/widget/style/`

Pipeline de style Aphrodite optimisé :

- `build-style.js` — Point d'entrée, orchestre le calcul et met en cache via `StylesCache`. Étend Aphrodite avec un handler de sélecteur personnalisé supportant le sélecteur `&` (pour les styles imbriqués).
- `styles-cache.js` — Cache LRU (2048 entrées max) avec liste doublement chaînée pour l'éviction. Les entrées les moins récemment utilisées migrent vers le début de la liste.
- `compute-style-hash.js` — Hash basé sur `theme.cacheName` (si le style dépend du thème) et la sérialisation stable des props de style (via `safe-stable-stringify`).
- `get-style-props.js` — Extrait uniquement les props déclarées dans `propNames` (et applique `mapProps` si défini) pour le calcul de style.
- `merge-style-definitions.js` — Fusionne les définitions de style de la hiérarchie d'héritage du widget en une seule définition combinée.

### `widgets/searchkit/index.js`

Intégration expérimentale avec Elasticsearch via SearchKit. Permet d'afficher un champ de recherche full-text et les résultats depuis un index Elasticsearch local (`http://localhost:9200`). Ce composant est considéré comme expérimental.

## Licence

Ce module est distribué sous [licence MIT](./LICENSE).

---

[xcraft-core-goblin]: https://github.com/Xcraft-Inc/xcraft-core-goblin
[xcraft-core-transport]: https://github.com/Xcraft-Inc/xcraft-core-transport
[xcraft-core-stones]: https://github.com/Xcraft-Inc/xcraft-core-stones
[xcraft-core-utils]: https://github.com/Xcraft-Inc/xcraft-core-utils
[xcraft-core-probe]: https://github.com/Xcraft-Inc/xcraft-core-probe
[xcraft-core-log]: https://github.com/Xcraft-Inc/xcraft-core-log
[goblin-theme]: https://github.com/Xcraft-Inc/goblin-theme

_Ce contenu a été généré par IA_
