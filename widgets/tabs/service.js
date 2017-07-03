'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'tabs';
const uuidV4 = require ('uuid/v4');
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
      current: {},
    });
  },
  add: (state, action) => {
    const tabId = action.get ('tabId');
    const contextId = action.get ('contextId');
    const current = state.get (`current.${contextId}`, null);
    const tab = {
      id: tabId,
      view: action.get ('view'),
      workItemId: action.get ('workItemId'),
    };
    if (!current) {
      return state
        .set (`current.${contextId}`, action.get ('workItemId'))
        .set (`tabs.${contextId}.${tabId}`, tab);
    }
    return state.set (`tabs.${contextId}.${tabId}`, tab);
  },
  'set-current': (state, action) => {
    const wid = action.get ('workItemId');
    const contextId = action.get ('contextId');
    return state.set (`current.${contextId}`, wid);
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

Goblin.registerQuest (goblinName, 'set-current', function (
  quest,
  contextId,
  workItemId
) {
  quest.do ({contextId, workItemId});
});

Goblin.registerQuest (goblinName, 'add', function* (
  quest,
  labId,
  contextId,
  name,
  view,
  workItemId
) {
  const tab = yield quest.create (`button@${uuidV4 ()}`, {
    id: `${contextId}-tab@${workItemId}`,
    text: name,
    kind: 'view-tab',
  });
  quest.do ({tabId: tab.id, contextId, view, name, workItemId});
  quest.goblin.defer (tab.delete);
  const lab = quest.useAs ('laboratory', labId);
  lab.add ({widgetId: tab.id});
  return tab.id;
});

Goblin.registerQuest (goblinName, 'remove', function (quest, ctxId) {
  quest.do ({ctxId});
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
