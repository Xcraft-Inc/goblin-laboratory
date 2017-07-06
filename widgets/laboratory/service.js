'use strict';

const path = require ('path');
const Goblin = require ('xcraft-core-goblin');
const uuidV4 = require ('uuid/v4');
const goblinName = path.basename (module.parent.filename, '.js');

// Default route/view mapping
// /mountpoint/:context/:view/:hinter
const defaultRoutes = {
  tabs: '/before-content/:context',
  workitem: '/content/:context/:view',
  hinter: '/hinter/:context/:view/:hinter',
  tasks: '/task-bar/:context',
  contexts: '/top-bar/',
};

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const conf = action.get ('config');
    const id = action.get ('id');
    return state.set ('', {
      id: id,
      url: action.get ('url'),
      wid: action.get ('wid'),
      showNotifications: 'false',
      dnd: 'false',
      onlyNews: 'false',
      notReadCount: 0,
      notifications: {},
      feeds: conf.feeds,
      routes: conf.routes,
      current: {
        workitems: {},
      },
    });
  },
  'toggle-dnd': state => {
    return state.set ('dnd', state.get ('dnd') === 'false' ? 'true' : 'false');
  },
  'toggle-only-news': state => {
    return state.set (
      'onlyNews',
      state.get ('onlyNews') === 'false' ? 'true' : 'false'
    );
  },
  'toggle-notifications': (state, action) => {
    return state.set ('showNotifications', action.get ('showValue'));
  },
  'add-notification': (state, action) => {
    const notifId = uuidV4 ();
    const notif = {
      id: notifId,
      command: action.get ('command'),
      status: 'not-read',
      glyph: action.get ('glyph'),
      color: action.get ('color'),
      message: action.get ('message'),
    };
    return state.set (`notifications.${notifId}`, notif);
  },
  'update-not-read-count': state => {
    const notifs = state.get ('notifications').select ((i, v) => v.toJS ());
    const count = notifs.reduce ((acc, n) => {
      if (n.status === 'not-read') {
        return acc + 1;
      }
      return acc;
    }, 0);
    return state.set ('notReadCount', count);
  },
  'read-all': state => {
    const notifications = state.get ('notifications');
    const newNotifications = notifications.transform (
      i => i,
      (i, v) => v.set ('status', 'read')
    );
    return state.set ('notifications', newNotifications);
  },
  'remove-notification': (state, action) => {
    const id = action.get ('notification').id;
    return state.del (`notifications.${id}`);
  },
  'remove-notifications': state => {
    return state.set (`notifications`, {});
  },
  setCurrentWorkItemByContext: (state, action) => {
    return state
      .set (
        `current.workitems.${action.get ('contextId')}`,
        action.get ('workItemId')
      )
      .set (`current.views.${action.get ('contextId')}`, action.get ('view'));
  },
  'update-feeds': (state, action) => {
    return state.set ('feeds', action.get ('feeds'));
  },
};

let increment = 0;
// Register quest's according rc.json
Goblin.registerQuest (goblinName, 'create', function* (
  quest,
  url,
  usePack,
  routes,
  onChangeMandate
) {
  const port = 4000 + increment++;
  const existingUrl = url;
  let _url = existingUrl || `http://localhost:${port}`;

  if (!routes) {
    routes = defaultRoutes;
  }

  if (!existingUrl) {
    quest.cmd ('webpack.server.start', {
      goblin: 'laboratory',
      jobId: quest.goblin.id,
      port: port,
    });
  }

  if (usePack) {
    quest.cmd ('webpack.pack', {
      goblin: 'laboratory',
      jobId: quest.goblin.id,
      outputPath: path.join (__dirname, '../../../../pack'),
    });
  }

  if (onChangeMandate) {
    quest.goblin.setX ('onChangeMandate', onChangeMandate);
  }

  if (!existingUrl) {
    quest.log.info (`Waiting for webpack goblin`);
    yield quest.sub.wait (`webpack.${quest.goblin.id}.done`);
  }

  quest.log.info (`Opening a window`);

  const config = {routes, feeds: []};

  let feeds = config.feeds;
  feeds.push (quest.goblin.id);

  if (process.env.NODE_ENV === 'development') {
    _url += '?react_perf';
  }

  quest.goblin.setX ('url', _url);

  //CREATE A WINDOW
  const win = yield quest.create ('wm.win', {
    url: _url,
    feeds,
  });

  const wid = win.id;
  quest.goblin.defer (win.delete);

  quest.do ({id: quest.goblin.id, wid, url: _url, config});
  yield quest.cmd ('wm.win.feed.sub', {wid, feeds});

  // CREATE DEFAULT CONTEXT MANAGER
  const labId = quest.goblin.id;
  quest.create ('contexts', {
    id: `contexts@${labId}`,
  });

  quest.cmd ('laboratory.add', {
    id: quest.goblin.id,
    widgetId: `contexts@${labId}`,
  });

  // CREATE DEFAULT TABS MANAGER
  quest.create ('tabs', {
    id: `tabs@${labId}`,
  });

  quest.cmd ('laboratory.add', {
    id: quest.goblin.id,
    widgetId: `tabs@${labId}`,
  });
  quest.log.info (`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'create-hinter-for', function* (
  quest,
  workItemId,
  detailWidget,
  type,
  title,
  glyph,
  kind
) {
  const widgetId = workItemId ? `${type}-hinter@${workItemId}` : null;

  if (!type) {
    throw new Error ('Hinter type required');
  }

  if (!kind) {
    kind = 'list';
  }

  if (!title) {
    title = type;
  }

  const hinter = yield quest.create (`hinter@${widgetId}`, {
    id: widgetId,
    labId: quest.goblin.id,
    type,
    title,
    glyph,
    kind,
    detailWidget,
  });

  quest.cmd ('laboratory.add', {
    id: quest.goblin.id,
    widgetId: hinter.id,
  });
  return hinter.id;
});

Goblin.registerQuest (goblinName, 'add-context', function (
  quest,
  contextId,
  name
) {
  const contexts = quest.use ('contexts');
  contexts.add ({
    labId: quest.goblin.id,
    contextId,
    name,
  });
});

Goblin.registerQuest (goblinName, 'add-tab', function* (
  quest,
  name,
  contextId,
  view,
  workItemId,
  navigate
) {
  const state = quest.goblin.getState ();
  const workItem = state.get (`current.workitems.${contextId}`, null);
  if (!workItem) {
    quest.dispatch ('setCurrentWorkItemByContext', {
      contextId,
      view,
      workItemId,
    });
  }
  const tabs = quest.use ('tabs');
  tabs.add ({
    name,
    contextId,
    view,
    workItemId,
    labId: quest.goblin.id,
  });

  //Add workitem
  quest.cmd ('laboratory.add', {
    id: quest.goblin.id,
    widgetId: workItemId,
  });

  if (navigate) {
    quest.cmd ('laboratory.nav-to-workitem', {
      id: quest.goblin.id,
      contextId,
      view,
      workItemId,
    });
  }
});

Goblin.registerQuest (goblinName, 'nav-to-context', function (
  quest,
  contextId
) {
  const win = quest.use ('wm.win');
  const state = quest.goblin.getState ();
  const view = state.get (`current.views.${contextId}`, null);

  if (view) {
    const workItem = state.get (`current.workitems.${contextId}`, null);
    if (workItem) {
      win.nav ({route: `/${contextId}/${view}?wid=${workItem}`});
    } else {
      win.nav ({route: `/${contextId}/${view}`});
    }
  } else {
    win.nav ({route: `/${contextId}`});
  }
});

Goblin.registerQuest (goblinName, 'nav-to-workitem', function* (
  quest,
  contextId,
  view,
  workItemId,
  skipNav
) {
  const win = quest.use ('wm.win');
  quest.dispatch ('setCurrentWorkItemByContext', {contextId, view, workItemId});
  const tabs = quest.use ('tabs');
  tabs.setCurrent ({contextId, workItemId});
  if (skipNav) {
    return;
  }
  yield win.nav ({route: `/${contextId}/${view}?wid=${workItemId}`});
});

Goblin.registerQuest (goblinName, 'get-url', function (quest) {
  return quest.goblin.getX ('url');
});

Goblin.registerQuest (goblinName, 'duplicate', function* (quest) {
  const state = quest.goblin.getState ();
  const url = state.get ('url');
  const routes = state.get ('routes').toJS ();
  const lab = yield quest.create ('laboratory', {url, routes});
  return lab.id;
});

Goblin.registerQuest (goblinName, 'add-notification', function (
  quest,
  glyph,
  color,
  message,
  command
) {
  quest.do ({glyph, color, message, command});
  const dnd = quest.goblin.getState ().get ('dnd');
  if (dnd !== 'true') {
    quest.dispatch ('toggle-notifications', {showValue: 'true'});
  }
  quest.dispatch ('update-not-read-count');
});

Goblin.registerQuest (goblinName, 'remove-notification', function (
  quest,
  notification
) {
  quest.do ({notification});
  quest.dispatch ('update-not-read-count');
});

Goblin.registerQuest (goblinName, 'remove-notifications', function (quest) {
  quest.do ();
  quest.dispatch ('update-not-read-count');
});

Goblin.registerQuest (goblinName, 'click-notification', function (
  quest,
  notification
) {
  quest.cmd (notification.command, {notification});
});

Goblin.registerQuest (goblinName, 'toggle-dnd', function (quest) {
  quest.do ();
});

Goblin.registerQuest (goblinName, 'toggle-only-news', function (quest) {
  quest.do ();
});

Goblin.registerQuest (goblinName, 'toggle-notifications', function (quest) {
  const state = quest.goblin.getState ();
  const showValue = state.get ('showNotifications') === 'false'
    ? 'true'
    : 'false';
  quest.do ({showValue});
  if (showValue === 'false') {
    quest.dispatch ('read-all');
  }
  quest.dispatch ('update-not-read-count');
});

Goblin.registerQuest (goblinName, '_ready', function* (quest, wid) {
  // todo: find route
  // quest.cmd ('wm.win.nav', {wid, route: '/vtc'});
});

Goblin.registerQuest (goblinName, 'open', function (quest, route) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (route);
});

Goblin.registerQuest (goblinName, 'change-mandate', function (quest) {
  const onChangeMandate = quest.goblin.getX ('onChangeMandate');
  if (onChangeMandate) {
    quest.cmd (onChangeMandate.quest, {id: onChangeMandate.id});
  }
});

Goblin.registerQuest (goblinName, 'add', function* (
  quest,
  widgetId,
  name,
  create,
  questParams
) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const branch = widgetId;

  quest.log.info (`Laboratory adding widget ${widgetId} to window ${wid}`);

  const added = yield quest.cmd ('warehouse.feed.add', {feed: wid, branch});
  quest.log.info (`feed added: ${added}`);
  if (added && create) {
    const args = Object.assign ({id: widgetId}, questParams);
    const entity = yield quest.create (name, args);
    quest.goblin.defer (entity.delete);
  }
});

Goblin.registerQuest (goblinName, 'del', function* (
  quest,
  widgetId,
  name,
  mustDelete,
  questParams
) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const branch = widgetId;
  quest.log.info (`Laboratory deleting widget ${widgetId} from window ${wid}`);
  const deleted = yield quest.cmd ('warehouse.feed.del', {feed: wid, branch});
  quest.log.info (`feed deleted: ${deleted}`);
  if (mustDelete) {
    const args = Object.assign ({id: widgetId}, questParams);
    quest.cmd (`${name}.delete`, args);
  }
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
