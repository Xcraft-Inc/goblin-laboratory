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
Goblin.registerQuest (goblinName, 'create', function* (quest, msg, next) {
  quest.cmd ('wm.init');
  const port = 3000 + increment++;
  quest.cmd ('webpack.server.start', {
    goblin: 'laboratory',
    jobId: quest.goblin.id,
    port: port,
  });
  quest.log.info (`Waiting for webpack goblin`);
  yield quest.sub.wait (`webpack.${quest.goblin.id}.done`);
  quest.log.info (`Opening a window`);

  const config = readConfig (msg);

  let feeds = config.feeds;
  feeds.push (quest.goblin.id);

  const wid = yield quest.cmd ('wm.win.create', {
    url: `http://localhost:${port}`,
    feeds,
  });

  quest.do ({id: quest.goblin.id, wid});
  quest.cmd ('wm.win.feed.sub', {wid, feeds});

  quest.log.info (`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, '_ready', function* (quest, msg) {
  const wid = msg.get ('wid');
  // todo: find route
  // quest.cmd ('wm.win.nav', {wid, route: '/vtc'});
});

Goblin.registerQuest (goblinName, 'open', function* (quest, msg) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (msg.get ('route'));
});

Goblin.registerQuest (goblinName, 'add', function* (quest, msg) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const widgetId = msg.get ('widgetId');
  const name = msg.get ('name');
  const create = msg.get ('create');
  const branch = widgetId;

  quest.log.info (`Laboratory adding widget ${widgetId} to window ${wid}`);

  const added = yield quest.cmd ('warehouse.feed.add', {feed: wid, branch});
  quest.log.info (`feed added: ${added}`);
  if (added && create) {
    const questParams = msg.get ('questParams');
    const args = Object.assign ({id: widgetId}, questParams);
    quest.cmd (`${name}.create`, args);
  }
});

Goblin.registerQuest (goblinName, 'del', function* (quest, msg) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const widgetId = msg.get ('widgetId');
  const name = msg.get ('name');
  const mustDelete = msg.get ('delete');
  const branch = widgetId;
  quest.log.info (`Laboratory deleting widget ${widgetId} from window ${wid}`);
  const deleted = yield quest.cmd ('warehouse.feed.del', {feed: wid, branch});
  quest.log.info (`feed deleted: ${deleted}`);
  if (mustDelete) {
    const questParams = msg.get ('questParams');
    const args = Object.assign ({id: widgetId}, questParams);
    quest.cmd (`${name}.delete`, args);
  }
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
