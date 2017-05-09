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
  quest.log.info ('Hello from Laboratory');
  quest.log.info (msg.data);
  quest.goblin.do ();
});

goblin.registerQuest ('open', function* (quest, msg) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (msg.get ('route'));
});

module.exports = goblin.quests;
