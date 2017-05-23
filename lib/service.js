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
      widget: conf.widgetName,
      feeds: conf.feeds,
      route: conf.route,
    });
  },
  'update-feeds': (state, action) => {
    return state.set ('feeds', action.get ('feeds'));
  },
};

const readConfig = msg => {
  const conf = msg.get ('config');
  return {
    route: conf[1],
    widgetName: conf[0],
    feeds: conf[2],
  };
};

// Register quest's according rc.json
Goblin.registerQuest (goblinName, 'create', function* (quest, msg, next) {
  quest.cmd ('wm.init');
  quest.cmd ('webpack.server.start', {
    goblin: 'laboratory',
  });
  quest.log.info (`Waiting for webpack goblin`);
  yield quest.sub.wait (`webpack.laboratory.done`);
  quest.log.info (`Opening a window`);

  const config = readConfig (msg);

  let feeds = config.feeds;
  feeds.push (quest.goblin.id);

  const wid = uuidV4 ();
  quest.do ({id: quest.goblin.id, wid});

  quest.cmd ('wm.win.create', {
    url: 'http://localhost:3000',
    wid,
    feeds,
  });

  quest.log.info (`a goblin for ${config.widgetName} was created!`);
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

Goblin.registerQuest (goblinName, 'widget.add', function* (quest, msg) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const widgetId = msg.get ('widgetId');
  const name = msg.get ('name');
  const branch = widgetId;

  quest.log.info (`Laboratory adding widget ${name} to window ${wid}`);

  const added = yield quest.cmd ('warehouse.feed.add', {feed: wid, branch});
  if (added) {
    const questParams = msg.get ('questParams');
    const args = Object.assign ({id: widgetId}, questParams);
    quest.cmd (`${name}.create`, args);
  }
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
