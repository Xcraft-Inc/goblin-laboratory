'use strict';

const path = require ('path');
const Goblin = require ('xcraft-core-goblin');
const uuidV4 = require ('uuid/v4');
const goblinName = path.basename (module.parent.filename, '.js');

// Default route/view mapping
// /mountpoint/:context/:workitem/
const defaultRoutes = {
  tabs: '/content/:context',
  workitem: '/content/:context/:workitem',
  tasks: '/task-bar/:context',
  contexts: '/top-bar/',
};

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
      routes: conf.routes,
    });
  },
  'update-feeds': (state, action) => {
    return state.set ('feeds', action.get ('feeds'));
  },
};

let increment = 0;
// Register quest's according rc.json
Goblin.registerQuest (goblinName, 'create', function* (quest, url, routes) {
  const port = 3000 + increment++;
  const existingUrl = url;
  const _url = existingUrl || `http://localhost:${port}`;

  if (!routes) {
    routes = defaultRoutes;
  }

  if (!existingUrl) {
    quest.cmd ('webpack.server.start', {
      goblin: 'laboratory',
      jobId: quest.goblin.id,
      port: port,
    });
    quest.log.info (`Waiting for webpack goblin`);
    yield quest.sub.wait (`webpack.${quest.goblin.id}.done`);
  }

  quest.log.info (`Opening a window`);

  const config = {routes, feeds: []};

  let feeds = config.feeds;
  feeds.push (quest.goblin.id);

  //CREATE A WINDOW
  const win = yield quest.create ('wm.win', {
    url: _url,
    feeds,
  });
  quest.goblin.setX ('window', win);
  quest.goblin.defer (() => quest.goblin.delX ('window'));
  const wid = win.id;
  quest.goblin.defer (win.delete);

  quest.do ({id: quest.goblin.id, wid, url: _url, config});
  yield quest.cmd ('wm.win.feed.sub', {wid, feeds});

  // CREATE DEFAULT CONTEXT MANAGER
  const contexts = yield quest.create ('contexts', {
    id: `contexts@default`,
  });
  quest.goblin.defer (contexts.delete);
  quest.goblin.setX ('contexts', contexts);
  quest.goblin.defer (() => quest.goblin.delX ('contexts'));

  // CREATE DEFAULT TABS MANAGER
  const tabs = yield quest.create ('tabs', {
    id: `tabs@default`,
  });
  quest.goblin.defer (tabs.delete);
  quest.goblin.setX ('tabs', tabs);
  quest.goblin.defer (() => quest.goblin.delX ('tabs'));

  quest.log.info (`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'add-context', function* (quest, name) {
  const contexts = quest.goblin.getX ('contexts');
  yield contexts.add ({name});
});

Goblin.registerQuest (goblinName, 'add-tab', function* (
  quest,
  name,
  contextId,
  workItemId
) {
  const tabs = quest.goblin.getX ('tabs');
  yield tabs.add ({name, contextId, workItemId});
});

Goblin.registerQuest (goblinName, 'nav-to-context', function (quest, name) {
  const win = quest.goblin.getX ('window');
  win.nav ({route: `/${name}`});
});

Goblin.registerQuest (goblinName, 'duplicate', function* (quest) {
  const state = quest.goblin.getState ();
  const url = state.get ('url');
  const routes = state.get ('routes').toJS ();
  const lab = yield quest.create ('laboratory', {url, routes});
  return lab.id;
});

Goblin.registerQuest (goblinName, '_ready', function* (quest, wid) {
  // todo: find route
  // quest.cmd ('wm.win.nav', {wid, route: '/vtc'});
});

Goblin.registerQuest (goblinName, 'open', function (quest, route) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (route);
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
  name,
  mustDelete,
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

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
