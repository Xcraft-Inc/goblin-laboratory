'use strict';

const path = require('path');
const Goblin = require('xcraft-core-goblin');
const goblinName = path.basename(module.parent.filename, '.js');

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const conf = action.get('config');
    const id = action.get('id');
    return state.set('', {
      id: id,
      feed: conf.feed,
      root: null,
      rootId: null,
      theme: 'default',
      globalStyles: false,
    });
  },
  'set-root': (state, action) => {
    const widgetId = action.get('widgetId');
    let widget = action.get('widget');
    if (!widget) {
      widget = widgetId;
    }
    return state.set('rootId', widgetId).set('root', widget);
  },
};

// Register quest's according rc.json
Goblin.registerQuest(goblinName, 'create', function*(quest, config) {
  quest.do({id: quest.goblin.id, config});

  yield quest.warehouse.subscribe({feed: config.feed, branches: []});
  quest.cmd('warehouse.feed.add', {feed: config.feed, branch: quest.goblin.id});

  quest.goblin.defer(
    quest.sub('goblin.created', (err, msg) => {
      quest.me.add({
        widgetId: msg.data.id,
      });
    })
  );

  quest.goblin.defer(
    quest.sub('goblin.released', (err, msg) => {
      quest.me.del({
        widgetId: msg.data.id,
      });
    })
  );

  quest.goblin.defer(
    quest.sub('goblin.deleted-in-batch', (err, msg) => {
      quest.me.delInBatch({
        widgetIds: msg.data.ids,
      });
    })
  );

  quest.log.info(`Carnotzet ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest(goblinName, 'set-root', function(quest, widget, widgetId) {
  quest.do();
});

Goblin.registerQuest(goblinName, 'add', function(quest, widgetId) {
  const state = quest.goblin.getState();
  const feed = state.get('feed');
  const branch = widgetId;

  quest.log.info(`Carnotzet adding widget ${widgetId} to feed ${feed}`);

  quest.cmd('warehouse.feed.add', {feed, branch});
});

Goblin.registerQuest(goblinName, 'del', function(quest, widgetId) {
  const state = quest.goblin.getState();
  const feed = state.get('feed');
  const branch = widgetId;
  quest.log.info(`Carnotzet deleting widget ${widgetId} from feed ${feed}`);
  quest.cmd('warehouse.feed.del', {feed, branch});
});

Goblin.registerQuest(goblinName, 'del-in-batch', function(quest, widgetIds) {
  const state = quest.goblin.getState();
  const feed = state.get('feed');
  const branches = widgetIds;
  quest.cmd('warehouse.feed.del-in-batch', {feed, branches});
});

Goblin.registerQuest(goblinName, 'delete', function*(quest) {
  quest.log.info(`Deleting carnotzet`);
  const state = quest.goblin.getState();
  const feed = state.get('feed');
  yield quest.cmd('warehouse.unsubscribe', {
    feed,
  });
  yield quest.cmd('warehouse.release', {
    branch: quest.goblin.id,
  });
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure(goblinName, logicState, logicHandlers);
