'use strict';

const path = require('path');
const Goblin = require('xcraft-core-goblin');
const goblinName = path.basename(module.parent.filename, '.js');

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  'create': (state, action) => {
    const conf = action.get('config');
    const id = action.get('id');
    return state.set('', {
      id: id,
      feed: conf.feed,
      root: null,
      rootId: null,
      clientSessionId: action.get('clientSessionId'),
      theme: conf.theme || 'default',
      themeContext: conf.themeContexts ? conf.themeContexts[0] : 'theme',
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
Goblin.registerQuest(goblinName, 'create', function* (
  quest,
  clientSessionId,
  config
) {
  quest.do({id: quest.goblin.id, config, clientSessionId});

  const feed = config.feed;
  if (!feed) {
    throw new Error(`config.feed is mandatory`);
  }

  const themeContexts = config.themeContexts || ['theme'];

  for (const ctx of themeContexts) {
    const composerId = `theme-composer@${ctx}`;
    yield quest.create('theme-composer', {
      id: composerId,
      desktopId: feed,
    });
    config.feeds.push(composerId);
  }

  yield quest.warehouse.subscribe({feed, branches: config.feeds});

  quest.goblin.defer(
    quest.sub('goblin.released', function* (err, {msg}) {
      yield quest.me.del({widgetId: msg.data.id});
    })
  );

  quest.log.info(`Carnotzet ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest(goblinName, 'get-feed', function (quest) {
  return quest.goblin.feed;
});

Goblin.registerQuest(goblinName, 'set-root', function (
  quest,
  widget,
  widgetId
) {
  quest.do();
});

Goblin.registerQuest(goblinName, 'del', function* (quest, widgetId) {
  const state = quest.goblin.getState();
  const feed = state.get('feed');
  const branch = widgetId;
  const labId = quest.goblin.id;
  quest.log.info(`Carnotzet deleting widget ${widgetId} from feed ${feed}`);
  yield quest.warehouse.feedSubscriptionDel({feed, branch, parents: labId});
});

Goblin.registerQuest(goblinName, 'when-ui-crash', function (
  quest,
  desktopId,
  error,
  info
) {
  quest.log.err(
    `UI generate errors ! ${
      (error && error.stack) || ''
    }\nStack :${info.componentStack.replace(/\\n/g, '\n')}`
  );
});

Goblin.registerQuest(goblinName, 'delete', function* (quest) {
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
