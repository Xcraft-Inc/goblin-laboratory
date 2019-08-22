//T:2019-02-27
import _ from 'lodash';
import helpers from 'xcraft-core-transport/lib/helpers.js';

let nextGeneration = 0;
const compensatorStates = {};
let compensatorTimeout = null;

function insertCompensators(store, action) {
  /* Provide the compensatored states to the reducer */
  action.compensatorStates = compensatorStates;

  /* (Re)start a timeout in case of no more NEW_BACKEND_STATE are received */
  if (compensatorTimeout) {
    clearTimeout(compensatorTimeout);
    compensatorTimeout = null;
  }

  if (Object.keys(compensatorStates).length) {
    compensatorTimeout = setTimeout(() => {
      store.dispatch({type: 'COMPENSATORS', compensatorStates});
    }, 300);
  }
}

const questMiddleware = send => store => next => action => {
  if (action.type === 'QUEST') {
    /* Provide the compensatored states to the reducer */
    insertCompensators(store, action);

    send('QUEST', action);
  }
  return next(action);
};

//TODO: better handling of model/service field
const handleChange = (send, action, registry) => {
  const model = action.model.replace('backend.', '');
  const fields = model.split('.');
  if (fields.length === 0) {
    return;
  }
  const goblinId = fields.shift();
  let goblin = goblinId;
  if (goblin.indexOf('@') !== -1) {
    goblin = goblin.split('@')[0];
  }
  const _xcraftIPC = action.value !== null && typeof action.value === 'object';
  const changeFieldCommand = `${goblin}.change-${fields.join('.')}`;
  if (registry[changeFieldCommand]) {
    const questAction = {
      type: 'QUEST',
      cmd: changeFieldCommand,
      data: {id: goblinId, newValue: action.value},
      _xcraftIPC,
    };
    send('QUEST', questAction);
  }

  const command = `${goblin}.change`;
  if (registry[command]) {
    const questAction = {
      type: 'QUEST',
      cmd: command,
      data: {id: goblinId, path: fields.join('.'), newValue: action.value},
      _xcraftIPC,
    };
    send('QUEST', questAction);
  }
};

const handleChangeWithThrottle = _.debounce(handleChange, 200);

const formMiddleware = send => store => next => action => {
  switch (action.type) {
    case 'FIELD-CHANGED':
      {
        if (action.path.startsWith('backend')) {
          handleChange(
            send,
            {model: action.path, value: action.value},
            store.getState().commands.get('registry')
          );
        }
      }
      break;
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
    case 'hinter/search': {
      handleChangeWithThrottle(
        send,
        action,
        store.getState().commands.get('registry')
      );
      break;
    }
  }
  return next(action);
};

const transitMiddleware = store => next => action => {
  if (
    action.type === 'NEW_BACKEND_STATE' &&
    action.data &&
    action.data._xcraftMessage
  ) {
    action.data = helpers.fromXcraftJSON(action.data)[0].data;

    const generation = action.data.get('generation');
    if (action.data.get('_xcraftPath')) {
      nextGeneration++;

      if (generation !== nextGeneration) {
        /* Resend the whole state because in this case, we lose some generations. */
        console.log(
          `${generation - nextGeneration - 1} generation(s) lost, resend`
        );
        action.renderer.send('RESEND');
      }
    } else {
      nextGeneration = generation;
    }
    action.nextGeneration = nextGeneration;

    insertCompensators(store, action);
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
    transitMiddleware,
  };
};
