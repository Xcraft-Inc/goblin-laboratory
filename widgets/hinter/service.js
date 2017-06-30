'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'hinter';

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const id = action.get ('id');
    return state.set ('', {
      id: id,
      type: action.get ('type'),
      kind: action.get ('kind'),
      title: action.get ('title'),
      glyph: action.get ('glyph'),
      rows: [],
      selectedIndex: null,
      values: [],
    });
  },
  'set-selections': (state, action) => {
    return state
      .set ('rows', action.get ('rows'))
      .set ('values', action.get ('values'))
      .set ('selectedIndex', '0');
  },
  'select-row': (state, action) => {
    return state.set ('selectedIndex', action.get ('index'));
  },
  delete: state => {
    return state.set ('', {});
  },
};

// Register quest's according rc.json

Goblin.registerQuest (goblinName, 'create', function* (
  quest,
  id,
  labId,
  type,
  title,
  glyph,
  kind,
  detailWidget
) {
  quest.do ({id, type, title, glyph, kind});
  const detail = yield quest.create ('detail', {
    id: `${id.replace ('-hinter', '-detail')}`,
    labId,
    type,
    title,
    detailWidget,
  });
  quest.goblin.setX ('detail', detail);
  quest.goblin.defer (detail.delete);
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'set-current-detail-entity', function* (
  quest,
  entityId
) {
  const detail = quest.goblin.getX ('detail');
  yield detail.setEntity ({entityId});
});

Goblin.registerQuest (goblinName, 'select-row', function (quest, index, text) {
  quest.log.info (`Select row: ${index}: ${text}`);
  quest.do ({index: `${index}`});
  /*hinter@workitem@id*/
  const ids = quest.goblin.getState ().get ('id').split ('@');
  const workitem = ids[1];
  const workitemId = `${ids[1]}@${ids[2]}`;
  const value = quest.goblin.getState ().get (`values.${index}`, null);
  const type = quest.goblin.getState ().get (`type`, null);
  if (value && type) {
    quest.cmd (`${workitem}.hinter-select-${type}`, {
      id: workitemId,
      selection: {index, text, value},
    });
  }
});

Goblin.registerQuest (goblinName, 'set-selections', function (
  quest,
  rows,
  values
) {
  quest.do ({rows, values});
});

Goblin.registerQuest (goblinName, 'delete', function (quest, id) {
  quest.do ({id});
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);
