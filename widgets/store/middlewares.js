import _ from 'lodash';
import helpers from 'xcraft-core-transport/lib/helpers.js';

const questMiddleware = send => store => next => action => {
  if (action.type === 'QUEST') {
    send('QUEST', action);
    return;
  }
  return next(action);
};

//TODO: better handling of model/service field
const _handleChange = (send, action) => {
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
  let questAction = {
    type: 'QUEST',
    cmd: `${goblin}.change-${fields.join('.')}`,
    data: {id: goblinId, newValue: action.value},
  };
  send('QUEST', questAction);

  questAction = {
    type: 'QUEST',
    cmd: `${goblin}.change`,
    data: {id: goblinId, path: fields.join('.'), newValue: action.value},
  };
  send('QUEST', questAction);
};

const handleChange = _.debounce(_handleChange, 100);

const formMiddleware = send => store => next => action => {
  switch (action.type) {
    case 'rrf/batch': {
      for (const a of action.actions) {
        if (a.type === 'rrf/change' && !a.load) {
          handleChange(send, a);
        }
      }
      break;
    }
    case 'rrf/change': {
      if (!action.load) {
        handleChange(send, action);
      }
      break;
    }
  }
  return next(action);
};

module.exports = transport => {
  const send = (type, action) => {
    let data = action;
    if (action.type === 'QUEST') {
      data = helpers.toXcraftJSON(action)[0];
    }

    switch (transport.name) {
      case 'electron': {
        transport.send(type, data);
        break;
      }
      case 'ws': {
        transport.send(JSON.stringify({type, data}));
        break;
      }
    }
  };

  return {
    formMiddleware: formMiddleware(send),
    questMiddleware: questMiddleware(send),
  };
};
