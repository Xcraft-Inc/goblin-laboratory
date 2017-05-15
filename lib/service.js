'use strict';

const path = require ('path');
const Goblin = require ('xcraft-core-goblin');

const goblinName = path.basename (module.parent.filename, '.js');

// Define initial logic values
const logicState = new Goblin.Shredder ({
  widgets: {},
});

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const conf = readConfig (action);
    return state.set (`widgets.${conf.widgetName}.${conf.route}`, conf.feeds);
  },
};

// Create a Goblin with initial state and handlers
const goblin = new Goblin (goblinName, logicState, logicHandlers);

const readConfig = msg => {
  const conf = msg.get ('config');
  return {
    route: conf[1],
    widgetName: conf[0],
    feeds: conf[2],
  };
};

// Register quest's according rc.json
goblin.registerQuest ('create', function* (quest, msg, next) {
  const uuidV4 = require ('uuid/v4');

  quest.goblin.do ();
  yield quest.cmd ('webpack.server.start', {
    goblin: 'laboratory',
  });
  quest.log.info (`Waiting for webpack goblin`);
  yield quest.sub.wait (`webpack.laboratory.done`);
  quest.log.info (`Opening a window`);

  const config = readConfig (msg);
  const feeds = quest.goblin
    .getState ()
    .get (`widgets.${config.widgetName}.${config.route}`)
    .toJS ();

  const wid = uuidV4 ();

  const unsubReady = quest.sub (`wm.win.${wid}.ready`, next.parallel ());
  quest.cmd ('wm.win.create', {
    url: 'http://localhost:3000',
    wid,
    feeds,
  });

  yield next.sync ();
  unsubReady ();
  quest.log.info ('READY!');
});

goblin.registerQuest ('open', function* (quest, msg) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (msg.get ('route'));
});

module.exports = goblin.quests;
