'use strict';

const path = require ('path');
const Goblin = require ('xcraft-core-goblin');
const goblinName = path.basename (module.parent.filename, '.js');

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
      feeds: conf.feeds,
    });
  },
  'set-root': (state, action) => {
    return state.set ('root', action.get ('widgetId'));
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
  useWS,
  target,
  screenId
) {
  const port = 4000 + increment++;
  const existingUrl = url;
  let _url = existingUrl || `http://localhost:${port}`;

  if (!screenId) {
    screenId = quest.goblin.id;
  }

  if (!target) {
    if (process.versions.electron) {
      target = 'electron-renderer';
    } else {
      target = 'node';
    }
  }
  if (!existingUrl) {
    quest.cmd ('webpack.server.start', {
      goblin: 'laboratory',
      jobId: quest.goblin.id,
      port: port,
      options: {
        indexFile: useWS ? 'index-ws.js' : 'index.js',
        target,
      },
    });
  }

  if (usePack && existingUrl) {
    quest.cmd ('webpack.pack', {
      goblin: 'laboratory',
      jobId: quest.goblin.id,
      outputPath: path.join (__dirname, '../../../../dist'),
      options: {
        sourceMap: true,
        indexFile: useWS ? 'index-ws.js' : 'index.js',
        target,
      },
    });
  }

  if (usePack || !existingUrl) {
    quest.log.info (`Waiting for webpack goblin`);
    yield quest.sub.wait (`webpack.${quest.goblin.id}.done`);
  }

  quest.log.info (`Opening a window`);

  const config = {feeds: []};

  let feeds = config.feeds;
  feeds.push (quest.goblin.id);

  /*
  //REACT16 don't support react_perf
  if (process.env.NODE_ENV !== 'production') {
    _url += '?react_perf';
  }*/

  quest.goblin.setX ('url', _url);

  //CREATE A WINDOW
  const win = yield quest.create ('wm', {
    url: _url,
    labId: quest.goblin.id,
    feeds,
    options: {
      openDevTools: process.env.NODE_ENV !== 'production',
      useWS,
    },
  });

  const wid = win.id;
  quest.goblin.defer (win.delete);

  quest.do ({id: quest.goblin.id, wid, url: _url, config});
  yield win.feedSub ({wid, feeds});

  const unsubCreated = quest.sub ('goblin.created', (err, msg) => {
    quest.cmd ('laboratory.add', {
      id: quest.goblin.id,
      widgetId: msg.data.id,
    });
  });
  quest.goblin.defer (unsubCreated);

  const unsubDeleted = quest.sub ('goblin.deleted', (err, msg) => {
    quest.cmd ('laboratory.del', {
      id: quest.goblin.id,
      widgetId: msg.data.id,
    });
  });
  quest.goblin.defer (unsubDeleted);

  quest.log.info (`Laboratory ${quest.goblin.id} created!`);
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'get-url', function (quest) {
  return quest.goblin.getX ('url');
});

Goblin.registerQuest (goblinName, 'duplicate', function* (
  quest,
  forId,
  usePack
) {
  const state = quest.goblin.getState ();
  const url = state.get ('url');
  const newLabId = `laboratory@${quest.uuidV4 ()}`;
  const lab = yield quest.createFor (forId, forId, newLabId, {
    id: newLabId,
    url,
    usePack: usePack || false,
    screenId: quest.goblin.id,
  });
  return lab.id;
});

Goblin.registerQuest (goblinName, 'when-ui-crash', function (
  quest,
  error,
  info
) {
  quest.log.err ('UI generate errors !');
  console.log (info);
  quest.log.err (info);
  // RESET APP?
  //const state = quest.goblin.getState ();
  //const existingRoot = state.get ('root', null);
  //quest.me.setRoot ({widgetId: existingRoot});
});

Goblin.registerQuest (goblinName, 'set-root', function (quest, widgetId) {
  const cleanRoot = existingRoot => {
    let goblin = Goblin.getGoblinName (existingRoot);
    quest.cmd (`${goblin}.delete`, {id: existingRoot});
  };
  const state = quest.goblin.getState ();
  const existingRoot = state.get ('root', null);
  if (existingRoot) {
    cleanRoot (existingRoot);
  }
  quest.do ();
  quest.goblin.defer (() => cleanRoot (widgetId));
});

Goblin.registerQuest (goblinName, 'nav', function (quest, route) {
  const win = quest.getAPI (`wm`);
  win.nav ({route});
});

Goblin.registerQuest (goblinName, 'dispatch', function (quest, action) {
  const win = quest.getAPI (`wm`);
  win.dispatch ({action});
});

Goblin.registerQuest (goblinName, '_ready', function* (quest, wid) {
  // todo: find route
  // quest.cmd ('wm.win.nav', {wid, route: '/vtc'});
});

Goblin.registerQuest (goblinName, 'open', function (quest, route) {
  quest.log.info ('Laboratory opening:');
  quest.log.info (route);
});

Goblin.registerQuest (goblinName, 'add', function (quest, widgetId) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const branch = widgetId;

  quest.log.info (`Laboratory adding widget ${widgetId} to window ${wid}`);

  quest.cmd ('warehouse.feed.add', {feed: wid, branch});
});

Goblin.registerQuest (goblinName, 'del', function (quest, widgetId) {
  const state = quest.goblin.getState ();
  const wid = state.get ('wid');
  const branch = widgetId;
  quest.log.info (`Laboratory deleting widget ${widgetId} from window ${wid}`);
  quest.cmd ('warehouse.feed.del', {feed: wid, branch});
});

Goblin.registerQuest (goblinName, 'delete', function (quest) {
  quest.log.info (`Deleting laboratory`);
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
