'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'hinter';

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const id = action.get ('id');
    return state.set ('', {
      id: id,
      type: action.get ('type'),
      kind: action.get ('kind'),
      title: action.get ('title'),
      glyph: action.get ('glyph'),
      rows: [],
      selectedIndex: null,
      values: [],
    });
  },
  'set-rows': (state, action) => {
    return state.set ('rows', action.get ('rows')).set ('selectedIndex', '0');
  },
  'select-row': (state, action) => {
    return state.set ('selectedIndex', action.get ('index'));
  },
  delete: state => {
    return state.set ('', {});
  },
};

// Register quest's according rc.json

Goblin.registerQuest (goblinName, 'create', function (
  quest,
  id,
  type,
  title,
  glyph,
  kind
) {
  quest.do ({id, type, title, glyph, kind});
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'select-row', function (quest, index, value) {
  quest.log.info (`Select row: ${index}: ${value}`);
  quest.do ({index: `${index}`});
});

Goblin.registerQuest (goblinName, 'set-rows', function (quest, rows) {
  quest.do ({rows});
});

Goblin.registerQuest (goblinName, 'set-values', function (quest, values) {
  quest.do ({values});
});

Goblin.registerQuest (goblinName, 'delete', function (quest, id) {
  quest.do ({id});
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
