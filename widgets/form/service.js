'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'form';
// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const id = action.get ('id');
    let existing = action.get ('value');
    if (!existing) {
      existing = {};
    }
    return state.set ('', {
      id: id,
      workitemId: action.get ('workitemId'),
      value: existing,
      focused: null,
    });
  },
  'save-form': (state, action) => {
    const toSave = action.get ('modelValueToSave');
    if (toSave) {
      return state
        .merge ('value', toSave)
        .set ('focused', action.get ('focused'));
    } else {
      return state.set ('focused', action.get ('focused'));
    }
  },
  'save-value': (state, action) => {
    return state.merge ('value', action.get ('modelValueToSave'));
  },
  'save-focus': (state, action) => {
    return state.set ('focused', action.get ('focused'));
  },
};

Goblin.registerQuest (goblinName, 'create', function* (
  quest,
  workitemId,
  value
) {
  quest.do ({id: quest.goblin.id, workitemId, value});
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'save-form', function (
  quest,
  value,
  focused
) {
  const modelValueToSave = {};
  for (const model in value) {
    if (value[model]) {
      modelValueToSave[model] = value[model];
    }
  }
  if (Object.keys (modelValueToSave).length > 0) {
    quest.do ({modelValueToSave});
  } else {
    quest.do ({modelValueToSave: null});
  }
});

Goblin.registerQuest (goblinName, 'save-focus', function (quest, focused) {
  quest.do ();
});

Goblin.registerQuest (goblinName, 'save-value', function (quest, value) {
  const modelValueToSave = {};
  for (const model in value) {
    if (value[model]) {
      modelValueToSave[model] = value[model];
    }
  }
  if (Object.keys (modelValueToSave).length > 0) {
    quest.do ({modelValueToSave});
  }
});

Goblin.registerQuest (goblinName, 'delete', function (quest) {});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
