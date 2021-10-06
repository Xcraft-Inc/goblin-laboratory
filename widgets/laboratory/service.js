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
      root: null,
      rootId: null,
      titlebar: null,
      titlebarId: null,
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
  'set-titlebar': (state, action) => {
    return state
      .set('titlebar', action.get('titlebar'))
      .set('titlebarId', action.get('titlebarId'));
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
  userId,
  url,
  config,
  next
) {
  quest.goblin.setX('url', url);
  quest.goblin.setX('desktopId', desktopId);
  quest.goblin.setX('clientSessionId', clientSessionId);
  const labId = quest.goblin.id;
  const feed = desktopId;
  const winId = `wm@${labId}`;

  const themeContexts = config.themeContexts || ['theme'];

  for (const ctx of themeContexts) {
    const composerId = `theme-composer@${ctx}`;
    quest.create(
      'theme-composer',
      {
        id: composerId,
        desktopId: desktopId,
      },
      next.parallel()
    );
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

  quest.goblin.setX('forceDispose', false);

  /* Case where the socket is still connected but it lags */
  quest.goblin.defer(
    quest.sub.local('greathall::<perf>', (err, {msg}) => {
      quest.goblin.setX('forceDispose', !!msg.data.lag);
    })
  );

  /* Case where the socket */
  quest.goblin.defer(
    quest.resp.onReconnect((status) => {
      switch (status) {
        case 'attempt':
          quest.goblin.setX('forceDispose', true);
          break;
        case 'done':
          quest.goblin.setX('forceDispose', false);
          break;
      }
    })
  );

  quest.doSync(
    {id: quest.goblin.id, feed, wid: winId, url, config},
    next.parallel()
  );

  quest.me.initZoom(
    {
      clientSessionId,
    },
    next.parallel()
  );

  quest.me.initTheme(
    {
      clientSessionId,
    },
    next.parallel()
  );

  yield next.sync();

  quest.goblin.defer(
    quest.sub.local(
      `*::${winId}.${clientSessionId}.<window-closed>`,
      function* (err, {msg, resp}) {
        yield resp.cmd('laboratory.close', {id});
      }
    )
  );

  quest.goblin.defer(
    quest.sub.local(
      `*::${winId}.${clientSessionId}.<window-state-changed>`,
      function* (err, {msg, resp}) {
        yield resp.cmd('laboratory.save-window-state', {
          id,
          winId,
          state: msg.data.state,
        });
      }
    )
  );
  yield quest.create('wm', {
    id: winId,
    desktopId,
    url,
    labId: quest.goblin.id,
    clientSessionId,
    userId,
    feeds: config.feeds,
    options: {
      openDevTools: process.env.GOBLINS_DEVTOOLS === '1',
      useWS: config.useWS,
      target: config.target,
      title: config.title,
      //enableTestAutomationLogguer: true,
    },
  });

  /*const titlebarInfos = yield win.getTitlebar();
  if (titlebarInfos) {
    const {titlebar, titlebarId} = titlebarInfos;
    yield quest.me.setTitlebar({titlebar, titlebarId});
  }*/
  quest.log.info(`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest(goblinName, 'close', function* (quest) {
  const clientSessionId = quest.goblin.getX('clientSessionId');
  const labId = quest.goblin.id;

  yield quest.cmd('client-session.close-window', {
    id: clientSessionId,
    winId: `wm@${labId}`,
  });
  yield quest.cmd('client.close-window', {labId});
  quest.release(labId);
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
  yield wm.feedSub({desktopId, feeds: feeds.valueSeq().toArray()});

  const labId = quest.goblin.id;
  const clientSessionId = quest.goblin.getState().get('clientSessionId');
  const fromFeed = quest.goblin.getState().get('feed');
  for (const branch of [labId, clientSessionId].filter((id) => !!id)) {
    yield quest.warehouse.graft({
      branch,
      fromFeed,
      toFeed: desktopId,
    });
  }

  quest.do();
  yield quest.warehouse.resend({feed: desktopId});
});

Goblin.registerQuest(goblinName, 'set-titlebar', function (
  quest,
  titlebar,
  titlebarId
) {
  quest.do({titlebar, titlebarId});
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
    `UI generate errors ! ${
      (error && error.stack) || ''
    }\nStack :${info.componentStack.replace(/\\n/g, '\n')}`
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

Goblin.registerQuest(goblinName, 'listen', function* (
  quest,
  desktopId,
  userId,
  useConfigurator
) {
  unlisten(quest);

  if (useConfigurator === true || useConfigurator === false) {
    quest.goblin.setX('useConfigurator', useConfigurator);
  }

  if (userId) {
    const wmAPI = quest.getAPI(`wm@${quest.goblin.id}`);
    yield wmAPI.setUserId({userId});
  }

  const labId = quest.goblin.id;
  quest.goblin.setX(
    `nav-unsub`,
    quest.sub(`*::<${desktopId}>.nav.requested`, function* (err, {msg, resp}) {
      yield resp.cmd('laboratory.nav', {
        id: labId,
        desktopId,
        ...msg.data,
      });
    })
  );

  quest.goblin.setX(
    `change-theme-unsub`,
    quest.sub(`*::<${desktopId}>.change-theme.requested`, function* (
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
    quest.sub(`*::<${desktopId}>.dispatch.requested`, function* (
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

Goblin.registerQuest(goblinName, 'nav', function* (quest, route) {
  const win = quest.getAPI(`wm@${quest.goblin.id}`);
  yield win.nav({route});
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
  const name = yield quest.cmd('client-session.get-theme', {
    id: clientSessionId,
  });

  if (name) {
    yield quest.me.changeTheme({name});
  }
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
  const useConfigurator = quest.goblin.getX('useConfigurator');

  if (quest.goblin.getX('forceDispose')) {
    const WM = require('xcraft-core-host/lib/wm.js').instance;
    WM.disposeAll();
    quest.cmd('shutdown'); /* no yield here because it's terminated */
    return;
  }

  if (branch === feed || (branch === labId && useConfigurator === false)) {
    yield quest.warehouse.unsubscribe({feed: branch});
  } else {
    quest.log.info(
      `Laboratory deleting widget ${widgetId} from window ${feed}`
    );
    const parents = [labId];
    /* This special case ensures that the laboratory is removed like the case
     * where a client (orc socket) is destroyed.
     */
    if (branch === labId) {
      parents.push(`goblin-orc@*`);
    }
    yield quest.warehouse.feedSubscriptionDel({feed, branch, parents});
  }
});

Goblin.registerQuest(goblinName, 'delete', function (quest) {
  unlisten(quest);
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure(goblinName, logicState, logicHandlers);
