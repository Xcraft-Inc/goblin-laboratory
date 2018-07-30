'use strict';

const path = require('path');
const Goblin = require('xcraft-core-goblin');
const goblinName = path.basename(module.parent.filename, '.js');

// Define initial logic values
const logicState = {};

// THEMES
const themes = [
  'default',
  'default-dark',
  'default-dragula',
  'compact-mono',
  'default-green',
  'special-green',
  'smooth-green',
  'compact-pink',
  'default-pink',
];

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const conf = action.get('config');
    const id = action.get('id');
    return state.set('', {
      id: id,
      url: action.get('url'),
      wid: action.get('wid'),
      feeds: conf.feeds,
      theme: 'default',
      globalStyles: conf.disableGlobalStyles ? false : true,
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
  'change-theme': (state, action) => {
    return state.set('theme', action.get('name'));
  },
  'update-feeds': (state, action) => {
    return state.set('feeds', action.get('feeds'));
  },
};

// Register quest's according rc.json
Goblin.registerQuest(goblinName, 'create', function*(quest, url, config) {
  quest.goblin.setX('url', url);

  const labId = quest.goblin.id;
  const feed = `wm@${labId}`;
  const winId = feed;

  quest.goblin.feed = feed;

  const win = yield quest.createFor('wm', labId, winId, {
    id: winId,
    url,
    labId: quest.goblin.id,
    feeds: config.feeds,
    options: {
      openDevTools: process.env.XCRAFT_APPENV !== 'release',
      useWS: config.useWS,
      target: config.target,
    },
  });

  yield win.feedSub({wid: winId, feeds: config.feeds});
  quest.do({id: quest.goblin.id, wid: winId, url, config});

  quest.cmd('warehouse.feed.add', {feed, branch: winId});

  quest.goblin.defer(
    quest.sub(`goblin.${feed}.created`, (err, msg) => {
      quest.cmd('laboratory.add', {
        id: quest.goblin.id,
        widgetId: msg.data.id,
      });
    })
  );

  quest.goblin.defer(
    quest.sub('goblin.released', (err, msg) => {
      quest.cmd('laboratory.del', {
        id: quest.goblin.id,
        widgetId: msg.data.id,
      });
    })
  );

  quest.goblin.defer(
    quest.sub('goblin.deleted-in-batch', (err, msg) => {
      quest.cmd('laboratory.del-in-batch', {
        id: quest.goblin.id,
        widgetIds: msg.data.ids,
      });
    })
  );

  quest.log.info(`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest(goblinName, 'get-feed', function(quest) {
  return quest.goblin.feed;
});

Goblin.registerQuest(goblinName, 'get-url', function(quest) {
  return quest.goblin.getX('url');
});

Goblin.registerQuest(goblinName, 'duplicate', function*(quest, forId) {
  const state = quest.goblin.getState();
  const url = state.get('url');
  const newLabId = `laboratory@${quest.uuidV4()}`;
  const lab = yield quest.createFor(forId, forId, newLabId, {
    id: newLabId,
    url,
  });
  return lab.id;
});

Goblin.registerQuest(goblinName, 'when-ui-crash', function(
  quest,
  desktopId,
  error,
  info
) {
  quest.log.err('UI generate errors !');
  console.log(info);
  quest.log.err(info);
  /*quest.fail(
    'Erreur UI',
    'Un composant graphique à crashé :(',
    'ctrl+shift+i pour contrôler',
    info.componentStack
  );*/
  // RESET APP?
  //const state = quest.goblin.getState ();
  //const existingRoot = state.get ('root', null);
  //quest.me.setRoot ({widgetId: existingRoot});
});

Goblin.registerQuest(goblinName, 'set-root', function(quest, widget, widgetId) {
  quest.do();
});

Goblin.registerQuest(goblinName, 'listen', function(quest, desktopId) {
  quest.goblin.setX(
    `${desktopId}.nav-unsub`,
    quest.sub(`${desktopId}.nav.requested`, (err, msg) => {
      quest.me.nav(msg.data);
    })
  );
  quest.goblin.setX(
    `${desktopId}.change-theme-unsub`,
    quest.sub(`${desktopId}.change-theme.requested`, (err, msg) => {
      quest.me.changeTheme(msg.data);
    })
  );
  quest.goblin.setX(
    `${desktopId}.dispatch-unsub`,
    quest.sub(`${desktopId}.dispatch.requested`, (err, msg) => {
      quest.me.dispatch(msg.data);
    })
  );
});

Goblin.registerQuest(goblinName, 'unlisten', function(quest, desktopId) {
  quest.goblin.getX(`${desktopId}.nav-unsub`)();
  quest.goblin.getX(`${desktopId}.change-theme-unsub`)();
  quest.goblin.getX(`${desktopId}.dispatch-unsub`)();
  quest.goblin.delX(`${desktopId}.nav-unsub`);
  quest.goblin.delX(`${desktopId}.change-theme-unsub`);
  quest.goblin.delX(`${desktopId}.dispatch-unsub`);
});

Goblin.registerQuest(goblinName, 'nav', function(quest, route) {
  const win = quest.getAPI(`wm@${quest.goblin.id}`);
  win.nav({route});
});

Goblin.registerQuest(goblinName, 'change-theme', function(quest, name) {
  quest.do({name});
});

Goblin.registerQuest(goblinName, 'dispatch', function(quest, action) {
  const win = quest.getAPI(`wm@${quest.goblin.id}`);
  win.dispatch({action});
});

Goblin.registerQuest(goblinName, 'open', function(quest, route) {
  quest.log.info('Laboratory opening:');
  quest.log.info(route);
});

Goblin.registerQuest(goblinName, 'add', function(quest, widgetId) {
  const state = quest.goblin.getState();
  const wid = state.get('wid');
  const branch = widgetId;

  quest.log.info(`Laboratory adding widget ${widgetId} to window ${wid}`);

  quest.cmd('warehouse.feed.add', {feed: wid, branch});
});

Goblin.registerQuest(goblinName, 'del', function(quest, widgetId) {
  const state = quest.goblin.getState();
  const wid = state.get('wid');
  const branch = widgetId;
  const labId = quest.goblin.id;
  quest.log.info(`Laboratory deleting widget ${widgetId} from window ${wid}`);
  quest.cmd('warehouse.feed.del', {feed: wid, owners: [labId, branch], branch});
});

Goblin.registerQuest(goblinName, 'del-in-batch', function(quest, widgetIds) {
  const state = quest.goblin.getState();
  const wid = state.get('wid');
  const branches = widgetIds;
  quest.cmd('warehouse.feed.del-in-batch', {feed: wid, branches});
});

Goblin.registerQuest(goblinName, 'delete', function*(quest) {
  quest.log.info(`Deleting laboratory`);
  const state = quest.goblin.getState();
  const wid = state.get('wid');
  yield quest.cmd('warehouse.unsubscribe', {
    feed: wid,
  });
  yield quest.cmd('warehouse.release', {
    branch: wid,
  });
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure(goblinName, logicState, logicHandlers);
