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
  create: state => {
    return state;
  },
};

// Create a Goblin with initial state and handlers
const goblin = new Goblin (goblinName, logicState, logicHandlers);

// Register quest's according rc.json
goblin.registerQuest ('create', function (quest) {
  quest.goblin.do ();
});

module.exports = goblin.quests;
