'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'form';
// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const id = action.get ('id');
    return state.set ('', {
      id: id,
      workitemId: action.get ('workitemId'),
      value: {},
      focused: null,
    });
  },
  'save-form': (state, action) => {
    const value = action.get ('value');
    return state.set ('value', value).set ('focused', action.get ('focused'));
  },
};

Goblin.registerQuest (goblinName, 'create', function* (
  quest,
  labId,
  workitemId
) {
  if (!labId) {
    throw new Error ('labId not provided');
  }
  const lab = quest.useAs ('laboratory', labId);
  // Add me to lab state
  lab.add ({widgetId: quest.goblin.id});

  quest.do ({id: quest.goblin.id, workitemId});
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'save-form', function (
  quest,
  value,
  focused
) {
  quest.do ({value, focused});
});

Goblin.registerQuest (goblinName, 'delete', function (quest) {});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
