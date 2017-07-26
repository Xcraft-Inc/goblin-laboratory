'use strict';

const path = require ('path');
const Goblin = require ('xcraft-core-goblin');
const goblinName = path.basename (module.parent.filename, '.js');
const {actions} = require ('react-redux-form/immutable');

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const conf = action.get ('config');
    const id = action.get ('id');
    return state.set ('', {
      id: id,
      url: action.get ('url'),
      wid: action.get ('wid'),
      feeds: conf.feeds,
    });
  },
  'set-root': (state, action) => {
    return state.set ('root', action.get ('widgetId'));
  },
  'update-feeds': (state, action) => {
    return state.set ('feeds', action.get ('feeds'));
  },
};

let increment = 0;
// Register quest's according rc.json
Goblin.registerQuest (goblinName, 'create', function* (quest, url, usePack) {
  const port = 4000 + increment++;
  const existingUrl = url;
  let _url = existingUrl || `http://localhost:${port}`;

  if (!existingUrl) {
    quest.cmd ('webpack.server.start', {
      goblin: 'laboratory',
      jobId: quest.goblin.id,
      port: port,
    });
  }

  if (usePack && existingUrl) {
    quest.cmd ('webpack.pack', {
      goblin: 'laboratory',
      jobId: quest.goblin.id,
      outputPath: path.join (__dirname, '../../../../dist'),
      options: {sourceMap: true},
    });
  }

  if (usePack || !existingUrl) {
    quest.log.info (`Waiting for webpack goblin`);
    yield quest.sub.wait (`webpack.${quest.goblin.id}.done`);
  }

  quest.log.info (`Opening a window`);

  const config = {feeds: []};

  let feeds = config.feeds;
  feeds.push (quest.goblin.id);

  if (process.env.NODE_ENV !== 'production') {
    _url += '?react_perf';
  }

  quest.goblin.setX ('url', _url);

  //CREATE A WINDOW
  const win = yield quest.create ('wm.win', {
    url: _url,
    labId: quest.goblin.id,
    feeds,
    options: {
      openDevTools: process.env.NODE_ENV !== 'production',
    },
  });

  const wid = win.id;
  quest.goblin.defer (win.delete);

  quest.do ({id: quest.goblin.id, wid, url: _url, config});
  yield quest.cmd ('wm.win.feed.sub', {wid, feeds});

  const unsubCreated = quest.sub ('goblin.created', (err, msg) => {
    const addDependentWidgetsToLaboratory = rootWidgetId => {
      if (rootWidgetId === null) {
        return;
      }

      // Add itself case
      if (rootWidgetId === quest.goblin.id) {
        quest.cmd ('laboratory.add', {
          id: quest.goblin.id,
          widgetId: rootWidgetId,
        });
        return;
      }

      // New created goblin is dep. of a laboratory ?
      if (Goblin.hasDepOfType (rootWidgetId, 'laboratory')) {
        // Is current laboratory a dep of the new created goblin ?
        if (Goblin.isDepOf (quest.goblin.id, rootWidgetId)) {
          quest.cmd ('laboratory.add', {
            id: quest.goblin.id,
            widgetId: rootWidgetId,
          });

          // Add all direct deps of this widget
          // These deps don't depends directly of laboratory, but haves
          // this widget as parent!
          Goblin.getOwnDirectDeps (rootWidgetId).forEach (widgetId =>
            quest.cmd ('laboratory.add', {
              id: quest.goblin.id,
              widgetId,
            })
          );
        }
      } else {
        // Recurse from root dep
        addDependentWidgetsToLaboratory (Goblin.getRootDep (rootWidgetId));
      }
    };

    addDependentWidgetsToLaboratory (msg.data.id);
  });
  quest.goblin.defer (unsubCreated);

  const unsubDeleted = quest.sub ('goblin.deleted', (err, msg) => {
    // Is current laboratory a dep of the deleted goblin ?
    if (msg.data.deps.indexOf (quest.goblin.id) !== -1) {
      quest.cmd ('laboratory.del', {
        id: quest.goblin.id,
        widgetId: msg.data.id,
      });
    }
  });
  quest.goblin.defer (unsubDeleted);

  quest.log.info (`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'get-url', function (quest) {
  return quest.goblin.getX ('url');
});

Goblin.registerQuest (goblinName, 'duplicate', function* (quest) {
  const state = quest.goblin.getState ();
  const url = state.get ('url');
  const routes = state.get ('routes').toJS ();
  const lab = yield quest.create ('laboratory', {url, routes});
  return lab.id;
});

Goblin.registerQuest (goblinName, 'set-root', function (quest, widgetId) {
  const cleanRoot = () => {
    let goblin = Goblin.getGoblinName (widgetId);
    quest.cmd (`${goblin}.delete`, {id: widgetId});
  };
  const state = quest.goblin.getState ();
  const existingRoot = state.get ('root', null);
  if (existingRoot) {
    cleanRoot ();
  }
  quest.do ();
  quest.goblin.defer (cleanRoot);
});

Goblin.registerQuest (goblinName, 'nav', function (quest, route) {
  const win = quest.use ('wm.win');
  win.nav ({route});
});

Goblin.registerQuest (goblinName, 'focus-form-field', function (
  quest,
  modelId,
  path
) {
  const win = quest.use ('wm.win');
  win.dispatch ({
    action: actions.focus (`models.${modelId}.${path}`),
  });
});

Goblin.registerQuest (goblinName, 'change-form-field', function (
  quest,
  modelId,
  path,
  value
) {
  const win = quest.use ('wm.win');
  win.dispatch ({
    action: actions.change (`models.${modelId}.${path}`, value),
  });
});

Goblin.registerQuest (goblinName, 'load-form-model', function (
  quest,
  modelId,
  model
) {
  const win = quest.use ('wm.win');
  Object.keys (model).forEach (p => {
    if (p !== 'id') {
      win.dispatch ({
        action: actions.load (`models.${modelId}.${p}`, model[p]),
      });
    }
  });
});

Goblin.registerQuest (goblinName, 'dispatch', function (quest, action) {
  const win = quest.use ('wm.win');
  win.dispatch ({action});
});

Goblin.registerQuest (goblinName, '_ready', function* (quest, wid) {
  // todo: find route
  // quest.cmd ('wm.win.nav', {wid, route: '/vtc'});
});

Goblin.registerQuest (goblinName, 'open', function (quest, route) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (route);
});

Goblin.registerQuest (goblinName, 'change-mandate', function (quest) {
  const onChangeMandate = quest.goblin.getX ('onChangeMandate');
  if (onChangeMandate) {
    quest.cmd (onChangeMandate.quest, {id: onChangeMandate.id});
  }
});

Goblin.registerQuest (goblinName, 'add', function* (
  quest,
  widgetId,
  name,
  create,
  questParams
) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const branch = widgetId;

  quest.log.info (`Laboratory adding widget ${widgetId} to window ${wid}`);

  const added = yield quest.cmd ('warehouse.feed.add', {feed: wid, branch});
  quest.log.info (`feed added: ${added}`);
  if (added && create) {
    const args = Object.assign ({id: widgetId}, questParams);
    const entity = yield quest.create (name, args);
    quest.goblin.defer (entity.delete);
  }
});

Goblin.registerQuest (goblinName, 'del', function* (
  quest,
  widgetId,
  mustDelete,
  name,
  questParams
) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const branch = widgetId;
  quest.log.info (`Laboratory deleting widget ${widgetId} from window ${wid}`);
  const deleted = yield quest.cmd ('warehouse.feed.del', {feed: wid, branch});
  quest.log.info (`feed deleted: ${deleted}`);
  if (mustDelete) {
    const args = Object.assign ({id: widgetId}, questParams);
    quest.cmd (`${name}.delete`, args);
  }
});

Goblin.registerQuest (goblinName, 'delete', function* (quest) {
  quest.log.info (`Deleting laboratory`);
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
