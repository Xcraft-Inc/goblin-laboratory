'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'contexts';

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const id = action.get ('id');
    const labId = action.get ('labId');
    return state.set ('', {
      id: id,
      contexts: {},
      labId,
      current: null,
    });
  },
  add: (state, action) => {
    const ctxId = action.get ('ctxId');
    return state.set (`contexts.${ctxId}`, action.get ('name'));
  },
  remove: (state, action) => {
    const ctxId = action.get ('ctxId');
    return state.del (`contexts.${ctxId}`);
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

Goblin.registerQuest (goblinName, 'add', function* (quest, name) {
  const ctx = yield quest.create ('button', {text: name, kind: 'main-tab'});
  quest.do ({ctxId: ctx.id, name});
  quest.goblin.defer (ctx.delete);
  return ctx.id;
});

Goblin.registerQuest (goblinName, 'remove', function (quest, ctxId) {
  quest.do ({ctxId});
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
