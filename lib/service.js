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

Goblin.registerQuest (goblinName, '_ready', function* (quest, msg) {
  const wid = msg.get ('wid');
  // todo: find route
  // quest.cmd ('wm.win.nav', {wid, route: '/vtc'});
});

Goblin.registerQuest (goblinName, 'open', function* (quest, msg) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (msg.get ('route'));
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
