'use strict';

const path = require ('path');
const Goblin = require ('xcraft-core-goblin');
const uuidV4 = require ('uuid/v4');
const goblinName = path.basename (module.parent.filename, '.js');

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const conf = readConfig (action);
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

const readConfig = msg => {
  const routes = msg.get ('routes');
  return {
    routes,
    feeds: [],
  };
};
let increment = 0;
// Register quest's according rc.json
Goblin.registerQuest (goblinName, 'create', function* (quest, url, routes) {
  const port = 3000 + increment++;
  const existingUrl = url;
  const _url = existingUrl || `http://localhost:${port}`;

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

  const win = yield quest.create ('wm.win', {
    url: _url,
    feeds,
  });
  const wid = win.id;
  quest.goblin.defer (win.delete);

  quest.do ({id: quest.goblin.id, wid, url: _url});
  yield quest.cmd ('wm.win.feed.sub', {wid, feeds});

  quest.log.info (`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
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
