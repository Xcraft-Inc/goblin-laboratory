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
      url: action.get('url'),
      feed: action.get('feed'),
      wid: action.get('wid'),
      clientSessionId: action.get('clientSessionId'),
      feeds: conf.feeds,
      theme: null,
      zoom: null,
      themeContext: conf.themeContext || 'polypheme',
    });
  },
  'set-feed': (state, action) => {
    return state.set('feed', action.get('desktopId'));
  },
  'set-root': (state, action) => {
    const widgetId = action.get('widgetId');
    let themeContext = action.get('themeContext');
    if (themeContext) {
      state = state.set('themeContext', themeContext);
    }
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
  'set-zoom': (state, action) => {
    return state.set('zoom', action.get('zoom'));
  },
  'zoom': (state) => {
    const zoom = Math.round((state.get('zoom') + 0.1) * 10) / 10;
    return state.set('zoom', zoom);
  },
  'un-zoom': (state) => {
    let zoom = Math.round((state.get('zoom') - 0.1) * 10) / 10;
    if (zoom <= 0) {
      zoom = 0.1;
    }
    return state.set('zoom', zoom);
  },
  'default-zoom': (state) => {
    return state.set('zoom', 1.0);
  },
};

// Register quest's according rc.json
Goblin.registerQuest(goblinName, 'create', function* (
  quest,
  desktopId,
  clientSessionId,
  url,
  config
) {
  quest.goblin.setX('url', url);
  quest.goblin.setX('desktopId', desktopId);
  quest.goblin.setX('clientSessionId', clientSessionId);
  const labId = quest.goblin.id;
  const feed = desktopId;
  const winId = `wm@${labId}`;

  if (!config.feeds.includes(quest.goblin.id)) {
    config.feeds.push(quest.goblin.id);
  }

  if (!config.feeds.includes(clientSessionId)) {
    config.feeds.push(clientSessionId);
  }

  quest.goblin.defer(
    quest.sub('goblin.released', function* (err, {msg}) {
      yield quest.cmd('laboratory.del', {
        id: quest.goblin.id,
        widgetId: msg.data.id,
      });
    })
  );

  yield quest.doSync({id: quest.goblin.id, feed, wid: winId, url, config});

  yield quest.me.initZoom({
    clientSessionId,
  });

  quest.goblin.defer(
    quest.sub(`*::${winId}.${labId}.window-closed`, function* () {
      yield quest.cmd('laboratory.close-window', {
        id: quest.goblin.id,
        winId: winId,
      });
    })
  );

  const win = yield quest.create('wm', {
    id: winId,
    desktopId: desktopId,
    url,
    labId: quest.goblin.id,
    feeds: config.feeds,
    options: {
      openDevTools:
        process.env.XCRAFT_APPENV !== 'release' ||
        process.env.WESTEROS_DEVTOOLS === '1',
      useWS: config.useWS,
      target: config.target,
      title: config.title,
      //enableTestAutomationLogguer: true,
    },
  });

  yield win.feedSub({wid: desktopId, feeds: config.feeds});
  yield win.beginRender();

  quest.log.info(`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest(goblinName, 'close', function* (quest) {
  const winId = quest.goblin.getState().get('wid');
  yield quest.me.closeWindow({winId});
});

Goblin.registerQuest(goblinName, 'get-client-session-id', function (quest) {
  return quest.goblin.getX('clientSessionId');
});

Goblin.registerQuest(goblinName, 'get-win-feed', function (quest) {
  const state = quest.goblin.getState();
  return {
    feed: state.get('feed'),
    wid: state.get('wid'),
  };
});

Goblin.registerQuest(goblinName, 'set-feed', function* (quest, desktopId) {
  quest.goblin.setX('desktopId', desktopId);
  const feeds = quest.goblin.getState().get('feeds');
  const wm = quest.getAPI(`wm@${quest.goblin.id}`);
  yield wm.feedSub({wid: desktopId, feeds: feeds.toArray()});
  yield quest.warehouse.resend({feed: desktopId});
  quest.do();
});

Goblin.registerQuest(goblinName, 'get-feed', function (quest) {
  return quest.goblin.getX('desktopId');
});

Goblin.registerQuest(goblinName, 'get-url', function (quest) {
  return quest.goblin.getX('url');
});

Goblin.registerQuest(goblinName, 'duplicate', function* (quest, forId) {
  const state = quest.goblin.getState();
  const url = state.get('url');
  const newLabId = `laboratory@${quest.uuidV4()}`;
  const lab = yield quest.createFor(forId, forId, newLabId, {
    id: newLabId,
    url,
  });
  return lab.id;
});

Goblin.registerQuest(goblinName, 'when-ui-crash', function (
  quest,
  desktopId,
  error,
  info
) {
  quest.log.err(
    `UI generate errors ! ${info.componentStack.replace(/\\n/g, '\n')}`
  );
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

Goblin.registerQuest(goblinName, 'set-root', function (
  quest,
  widget,
  widgetId,
  themeContext
) {
  quest.do();
});

Goblin.registerQuest(goblinName, 'listen', function (quest, desktopId) {
  if (!quest.goblin.getX(`${desktopId}.nav-unsub`)) {
    quest.goblin.setX(
      `${desktopId}.nav-unsub`,
      quest.sub(`${desktopId}.nav.requested`, function* (err, {msg}) {
        yield quest.me.nav(msg.data);
      })
    );
    quest.goblin.setX(
      `${desktopId}.change-theme-unsub`,
      quest.sub(`${desktopId}.change-theme.requested`, function* (err, {msg}) {
        yield quest.me.changeTheme(msg.data);
      })
    );
    quest.goblin.setX(
      `${desktopId}.dispatch-unsub`,
      quest.sub(`${desktopId}.dispatch.requested`, function* (err, {msg}) {
        yield quest.me.dispatch(msg.data);
      })
    );
  }
});

Goblin.registerQuest(goblinName, 'unlisten', function (quest, desktopId) {
  if (quest.goblin.getX(`${desktopId}.nav-unsub`)) {
    quest.goblin.getX(`${desktopId}.nav-unsub`)();
    quest.goblin.getX(`${desktopId}.change-theme-unsub`)();
    quest.goblin.getX(`${desktopId}.dispatch-unsub`)();
    quest.goblin.delX(`${desktopId}.nav-unsub`);
    quest.goblin.delX(`${desktopId}.change-theme-unsub`);
    quest.goblin.delX(`${desktopId}.dispatch-unsub`);
  }
});

Goblin.registerQuest(goblinName, 'nav', function* (quest, route) {
  const win = quest.getAPI(`wm@${quest.goblin.id}`);
  yield win.nav({route});
});

Goblin.registerQuest(goblinName, 'change-theme', function (quest, name) {
  quest.do({name});
});

Goblin.registerQuest(goblinName, 'save-settings', function* (quest, propertie) {
  const value = quest.goblin.getState().get(propertie);
  const clientSessionId = quest.goblin.getX('clientSessionId');
  yield quest.cmd(`client-session.set-${propertie}`, {
    id: clientSessionId,
    [propertie]: value,
  });
});

/******************************************************************************/

Goblin.registerQuest(goblinName, 'init-zoom', function* (
  quest,
  clientSessionId
) {
  let zoom = yield quest.cmd('client-session.get-zoom', {
    id: clientSessionId,
  });

  yield quest.me.setZoom({
    zoom,
  });
});

Goblin.registerQuest(goblinName, 'set-zoom', function* (quest) {
  quest.do();
  yield quest.me.saveSettings({propertie: 'zoom'});
});

Goblin.registerQuest(goblinName, 'zoom', function* (quest) {
  quest.do();
  yield quest.me.saveSettings({propertie: 'zoom'});
});

Goblin.registerQuest(goblinName, 'un-zoom', function* (quest) {
  quest.do();
  yield quest.me.saveSettings({propertie: 'zoom'});
});

Goblin.registerQuest(goblinName, 'default-zoom', function* (quest) {
  quest.do();
  yield quest.me.saveSettings({propertie: 'zoom'});
});

/******************************************************************************/

Goblin.registerQuest(goblinName, 'dispatch', function* (quest, action) {
  const win = quest.getAPI(`wm@${quest.goblin.id}`);
  yield win.dispatch({action});
});

Goblin.registerQuest(goblinName, 'open', function (quest, route) {
  quest.log.info('Laboratory opening:');
  quest.log.info(route);
});

Goblin.registerQuest(goblinName, 'del', function* (quest, widgetId) {
  const state = quest.goblin.getState();
  const feed = state.get('feed');
  const branch = widgetId;
  const labId = quest.goblin.id;
  const desktopId = quest.goblin.getX('desktopId');
  quest.log.info(`Laboratory deleting widget ${widgetId} from window ${feed}`);
  yield quest.warehouse.feedSubscriptionDel({feed, branch, parents: labId});
  if (widgetId === desktopId) {
    yield quest.me.closeWindow({winId: `wm@${labId}`});
  }
});

Goblin.registerQuest(goblinName, 'close-window', function* (quest, winId) {
  //TODO:multi-window mgmt
  yield quest.kill([winId]);

  //cleaning
  const labId = quest.goblin.id;
  yield quest.warehouse.unsubscribe({feed: labId});
  const desktopId = quest.goblin.getX('desktopId');
  yield quest.me.unlisten({desktopId});
  //self-kill
  yield quest.kill([labId], labId);
});

Goblin.registerQuest(goblinName, 'delete', function* (quest) {
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
