'use strict';

const Goblin = require ('xcraft-core-goblin');
const goblinName = 'detail';

// Define initial logic values
const logicState = {};

// Define logic handlers according rc.json
const logicHandlers = {
  create: (state, action) => {
    const id = action.get ('id');
    return state.set ('', {
      id: id,
      type: action.get ('type'),
      title: action.get ('title'),
      detailWidget: action.get ('detailWidget'),
      detailWidgetId: null,
    });
  },
  'set-entity': (state, action) => {
    return state.set ('detailWidgetId', action.get ('widgetId'));
  },
  delete: state => {
    return state.set ('', {});
  },
};

// Register quest's according rc.json

Goblin.registerQuest (goblinName, 'create', function (
  quest,
  labId,
  id,
  type,
  title,
  detailWidget
) {
  quest.goblin.setX ('labId', labId);
  quest.do ({id, type, title, detailWidget});
  quest.cmd ('laboratory.add', {
    id: labId,
    widgetId: quest.goblin.id,
  });
  return quest.goblin.id;
});

Goblin.registerQuest (goblinName, 'set-entity', function* (quest, entityId) {
  const labId = quest.goblin.getX ('labId');
  const detailWidget = quest.goblin.getState ().get ('detailWidget');

  if (quest.canUse (`${detailWidget}@${entityId}`)) {
    const detail = quest.use (`${detailWidget}@${entityId}`);
    quest.goblin.setX ('widget', {id: detail.id, name: detailWidget});
    quest.do ({widgetId: detail.id});
    return;
  }

  const newWidget = yield quest.create (`${detailWidget}@${entityId}`, {
    labId,
    entityId,
  });
  quest.goblin.defer (newWidget.delete);
  quest.goblin.setX ('widget', {id: newWidget.id, name: detailWidget});
  quest.do ({widgetId: newWidget.id});
});

Goblin.registerQuest (goblinName, 'delete', function (quest, id) {
  quest.do ({id});
});

// Create a Goblin with initial state and handlers
module.exports = Goblin.configure (goblinName, logicState, logicHandlers);