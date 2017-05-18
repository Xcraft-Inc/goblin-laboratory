'use strict';

const path = require ('path');
const Goblin = require ('xcraft-core-goblin');
const uuidV4 = require ('uuid/v4');
const goblinName = path.basename (module.parent.filename, '.js');

// Define initial logic values
const logicState = new Goblin.Shredder ({
  widgets: {},
});

logicState.enableLogger (true);

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const conf = readConfig (action);
    const id = uuidV4 ();
    return state.set (`widgets[${id}]`, {
      id: id,
      wid: action.get ('wid'),
      widget: conf.widgetName,
      route: conf.route,
    });
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
  quest.cmd ('wm.init');
  quest.cmd ('webpack.server.start', {
    goblin: 'laboratory',
  });
  quest.log.info (`Waiting for webpack goblin`);
  yield quest.sub.wait (`webpack.laboratory.done`);
  quest.log.info (`Opening a window`);

  const config = readConfig (msg);

  let feeds = config.feeds;
  feeds.push ('laboratory');

  const wid = uuidV4 ();
  quest.goblin.do ({wid: wid});

  quest.cmd ('wm.win.create', {
    url: 'http://localhost:3000',
    wid,
    feeds,
  });

  quest.log.info (`${config.widgetName} created!`);
});

goblin.registerQuest ('_ready', function* (quest, msg) {
  const wid = msg.get ('wid');
  // todo: find route
  // quest.cmd ('wm.win.nav', {wid, route: '/vtc'});
});

goblin.registerQuest ('open', function* (quest, msg) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (msg.get ('route'));
});

module.exports = goblin.quests;
