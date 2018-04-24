import _ from 'lodash';
import helpers from 'xcraft-core-transport/lib/helpers.js';

const questMiddleware = send => store => next => action => {
  if (action.type === 'QUEST') {
    send('QUEST', action);
  }
  return next(action);
};

//TODO: better handling of model/service field
const _handleChange = (send, action, registry) => {
  const model = action.model.replace('backend.', '');
  const fields = model.split('.');
  if (fields.lenght === 0) {
    return;
  }
  const goblinId = fields.shift();
  let goblin = goblinId;
  if (goblin.indexOf('@') !== -1) {
    goblin = goblin.split('@')[0];
  }
  const changeFieldCommand = `${goblin}.change-${fields.join('.')}`;
  if (registry[changeFieldCommand]) {
    const questAction = {
      type: 'QUEST',
      cmd: changeFieldCommand,
      data: {id: goblinId, newValue: action.value},
    };
    send('QUEST', questAction);
  }

  const command = `${goblin}.change`;
  if (registry[command]) {
    const questAction = {
      type: 'QUEST',
      cmd: command,
      data: {id: goblinId, path: fields.join('.'), newValue: action.value},
    };
    send('QUEST', questAction);
  }
};

const handleChange = _.debounce(_handleChange, 100);

const formMiddleware = send => store => next => action => {
  switch (action.type) {
    case 'rrf/batch': {
      for (const a of action.actions) {
        if (a.type === 'rrf/change' && !a.load) {
          handleChange(send, a, store.getState().commands.get('registry'));
        }
      }
      break;
    }
    case 'rrf/change': {
      if (!action.load) {
        handleChange(send, action, store.getState().commands.get('registry'));
      }
      break;
    }
  }
  return next(action);
};

module.exports = send => {
  const _send = (type, action) => {
    let data = action;
    if (action.type === 'QUEST') {
      data = helpers.toXcraftJSON(action)[0];
    }

    send(type, data);
  };

  return {
    formMiddleware: formMiddleware(_send),
    questMiddleware: questMiddleware(_send),
  };
};
