'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'tabs';

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const id = action.get ('id');
    const labId = action.get ('labId');
    return state.set ('', {
      id: id,
      tabs: {},
      labId,
      current: null,
    });
  },
  add: (state, action) => {
    const tabId = action.get ('tabId');
    const contextId = action.get ('contextId');
    const current = state.get ('current');
    if (!current) {
      return state
        .set ('current', action.get ('workItemId'))
        .set (`tabs.${contextId}.${tabId}`, action.get ('workItemId'));
    }
    return state.set (`tabs.${contextId}.${tabId}`, action.get ('workItemId'));
  },
  'set-current': (state, action) => {
    const wid = action.get ('workItemId');
    return state.set ('current', wid);
  },
  remove: (state, action) => {
    const tabId = action.get ('tabId');
    const contextId = action.get ('contextId');
    return state.del (`tabs.${contextId}.${tabId}`);
  },
  delete: state => {
    return state.set ('', {});
  },
};

// Register quest's according rc.json

Goblin.registerQuest (goblinName, 'create', function (quest, id, labId) {
  quest.do ({id, labId});
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'delete', function (quest, id) {
  quest.do ({id});
});

Goblin.registerQuest (goblinName, 'set-current', function (quest, workItemId) {
  quest.do ({workItemId});
});

Goblin.registerQuest (goblinName, 'add', function* (
  quest,
  contextId,
  name,
  workItemId
) {
  const tab = yield quest.create ('button', {
    id: `${contextId}-tab@${workItemId}`,
    text: name,
    kind: 'view-tab',
  });
  quest.do ({tabId: tab.id, contextId, name, workItemId});
  quest.goblin.defer (tab.delete);
  return tab.id;
});

Goblin.registerQuest (goblinName, 'remove', function (quest, ctxId) {
  quest.do ({ctxId});
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
