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
      theme: 'default',
      themesGen: {default: 1},
      zoom: null,
      themeContext: conf.themeContexts ? conf.themeContexts[0] : 'theme',
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
  'reload-theme': (state, action) => {
    const path = `themesGen.${action.get('name')}`;
    const gen = state.get(path, 1) + 1;
    return state.set(path, gen);
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
  'change-zoom': (state, action) => {
    const zoom = action.get('zoom');
    return state.set('zoom', zoom);
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

  const themeContexts = config.themeContexts || ['theme'];

  for (const ctx of themeContexts) {
    const composerId = `theme-composer@${ctx}`;
    yield quest.create('theme-composer', {
      id: composerId,
      desktopId: desktopId,
    });
    config.feeds.push(composerId);
  }

  const id = quest.goblin.id;

  quest.goblin.defer(
    quest.sub('goblin.released', function* (err, {msg, resp}) {
      yield resp.cmd('laboratory.del', {
        id,
        widgetId: msg.data.id,
      });
    })
  );

  quest.goblin.defer(
    quest.sub(
      `*::theme-composer@*.${clientSessionId}.reload-theme.requested`,
      function* (err, {msg, resp}) {
        yield resp.cmd('laboratory.reload-theme', {...msg.data, id});
      }
    )
  );

  yield quest.doSync({id: quest.goblin.id, feed, wid: winId, url, config});

  yield quest.me.initZoom({
    clientSessionId,
  });

  yield quest.me.initTheme({
    clientSessionId,
  });

  quest.goblin.defer(
    quest.sub(`*::${winId}.${clientSessionId}.window-closed`, function* (
      err,
      {msg, resp}
    ) {
      yield resp.cmd('laboratory.close-window', {
        id,
        winId: winId,
        currentUrl: msg.data.currentUrl,
      });
    })
  );

  quest.goblin.defer(
    quest.sub(`*::${winId}.${clientSessionId}.window-state-changed`, function* (
      err,
      {msg, resp}
    ) {
      yield resp.cmd('laboratory.save-window-state', {
        id,
        winId,
        state: msg.data.state,
      });
    })
  );

  const win = yield quest.create('wm', {
    id: winId,
    desktopId: desktopId,
    url,
    labId: quest.goblin.id,
    clientSessionId,
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

  yield win.feedSub({desktopId, feeds: config.feeds});
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
  yield wm.feedSub({desktopId, feeds: feeds.toArray()});
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
  unlisten(quest);

  const labId = quest.goblin.id;
  quest.goblin.setX(
    `nav-unsub`,
    quest.sub(`*::${desktopId}.nav.requested`, function* (err, {msg, resp}) {
      yield resp.cmd('laboratory.nav', {
        id: labId,
        desktopId,
        ...msg.data,
      });
    })
  );

  quest.goblin.setX(
    `change-theme-unsub`,
    quest.sub(`*::${desktopId}.change-theme.requested`, function* (
      err,
      {msg, resp}
    ) {
      yield resp.cmd('laboratory.change-theme', {
        id: labId,
        ...msg.data,
      });
    })
  );

  quest.goblin.setX(
    `dispatch-unsub`,
    quest.sub(`*::${desktopId}.dispatch.requested`, function* (
      err,
      {msg, resp}
    ) {
      yield resp.cmd('laboratory.dispatch', {
        id: labId,
        ...msg.data,
      });
    })
  );
});

function unlisten(quest) {
  if (quest.goblin.getX(`nav-unsub`)) {
    quest.goblin.getX(`nav-unsub`)();
    quest.goblin.getX(`change-theme-unsub`)();
    quest.goblin.getX(`dispatch-unsub`)();
    quest.goblin.delX(`nav-unsub`);
    quest.goblin.delX(`reload-theme-unsub`);
    quest.goblin.delX(`dispatch-unsub`);
  }
}

Goblin.registerQuest(goblinName, 'nav', function* (
  quest,
  desktopId,
  route,
  navRequestId
) {
  const deskAPI = quest.getAPI(desktopId);
  const ready = yield deskAPI.startNav();
  if (ready) {
    const win = quest.getAPI(`wm@${quest.goblin.id}`);
    yield win.nav({route});
    yield deskAPI.endNav({navRequestId, route});
  } else {
    yield deskAPI.endNav({navRequestId, skip: true});
  }
});

/************************        SETTINGS      *********************************/

Goblin.registerQuest(goblinName, 'save-settings', function* (quest, propertie) {
  const value = quest.goblin.getState().get(propertie);
  const clientSessionId = quest.goblin.getX('clientSessionId');
  yield quest.cmd(`client-session.set-${propertie}`, {
    id: clientSessionId,
    [propertie]: value,
  });
});

Goblin.registerQuest(goblinName, 'save-window-state', function* (
  quest,
  winId,
  state
) {
  const clientSessionId = quest.goblin.getX('clientSessionId');
  yield quest.cmd(`client-session.set-window-state`, {
    id: clientSessionId,
    winId,
    state,
  });
});

/******************************************************************************/

Goblin.registerQuest(goblinName, 'init-theme', function* (
  quest,
  clientSessionId
) {
  let name = yield quest.cmd('client-session.get-theme', {
    id: clientSessionId,
  });

  /*if (name) {
    yield quest.me.changeTheme({
      name: 'default', //TODO: compose use themes
    });
  }*/
});

Goblin.registerQuest(goblinName, 'change-theme', function* (quest, name) {
  quest.do({name});
  yield quest.me.saveSettings({propertie: 'theme'});
});

Goblin.registerQuest(goblinName, 'reload-theme', function (quest, name) {
  quest.do({name});
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

Goblin.registerQuest(goblinName, 'change-zoom', function* (quest) {
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
  quest.log.info(`Laboratory deleting widget ${widgetId} from window ${feed}`);
  yield quest.warehouse.feedSubscriptionDel({feed, branch, parents: labId});
});

Goblin.registerQuest(goblinName, 'close-window', function* (
  quest,
  winId,
  currentUrl
) {
  //TODO:multi-window mgmt
  yield quest.kill([winId]);
  //cleaning
  const labId = quest.goblin.id;
  const clientSessionId = quest.goblin.getX('clientSessionId');
  yield quest.cmd('client-session.close-window', {id: clientSessionId, winId});
  yield quest.cmd('client.close-window', {labId});
  yield quest.warehouse.unsubscribe({feed: labId});
  //self-kill
  yield quest.kill([labId], labId);
});

Goblin.registerQuest(goblinName, 'delete', function* (quest) {
  quest.log.info(`Deleting laboratory`);
  unlisten(quest);
  const state = quest.goblin.getState();
  const wid = state.get('wid');
  yield quest.cmd('warehouse.release', {
    branch: wid,
  });
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure(goblinName, logicState, logicHandlers);
