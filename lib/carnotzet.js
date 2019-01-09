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
      theme: null,
      themeContext: conf.themeContext,
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

  const feed = config.feed;
  if (!feed) {
    throw new Error(`config.feed is mandatory`);
  }

  quest.goblin.feed = {[feed]: true};

  if (!config.feeds.includes(quest.goblin.id)) {
    config.feeds.push(quest.goblin.id);
  }
  yield quest.warehouse.subscribe({feed, branches: config.feeds});

  quest.goblin.defer(
    quest.sub('goblin.released', (err, msg) => {
      quest.me.del({
        widgetId: msg.data.id,
      });
    })
  );

  quest.log.info(`Carnotzet ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest(goblinName, 'get-feed', function(quest) {
  return quest.goblin.feed;
});

Goblin.registerQuest(goblinName, 'set-root', function(quest, widget, widgetId) {
  quest.do();
});

Goblin.registerQuest(goblinName, 'del', function*(quest, widgetId) {
  const state = quest.goblin.getState();
  const feed = state.get('feed');
  const branch = widgetId;
  const labId = quest.goblin.id;
  quest.log.info(`Carnotzet deleting widget ${widgetId} from feed ${feed}`);
  yield quest.warehouse.feedSubscriptionDel({feed, branch, parents: labId});
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
