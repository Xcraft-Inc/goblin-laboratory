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
    const conf = action.meta.config;
    const route = conf[1];
    const widgetName = conf[0];
    const feeds = conf[2];
    return state.set (`widgets.${widgetName}.${route}`, feeds);
  },
};

// Create a Goblin with initial state and handlers
const goblin = new Goblin (goblinName, logicState, logicHandlers);

// Register quest's according rc.json
goblin.registerQuest ('create', function* (quest, msg) {
  quest.log.info ('You enter in the Laboratory');
  quest.log.info (msg.data);
  quest.goblin.do ();
  yield quest.cmd ('webpack.server.start', {
    goblin: 'laboratory',
  });
  quest.log.info (`Waiting for webpack goblin`);
  yield quest.sub.wait (`webpack.laboratory.done`);
  quest.log.info (`Opening a window`);
  yield quest.cmd ('wm.win.create', {
    url: 'http://localhost:3000',
  });
});

goblin.registerQuest ('open', function* (quest, msg) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (msg.get ('route'));
});

module.exports = goblin.quests;
