const questMiddleware = send => store => next => action => {
  if (action.type === 'QUEST') {
    send ('QUEST', action);
  } else {
    return next (action);
  }
};

//TODO: better handling of model/service field
const handleChange = (send, action) => {
  const model = action.model.replace ('backend.', '');
  const fields = model.split ('.');
  const goblinId = fields.shift ();
  let goblin = goblinId;
  if (goblin.indexOf ('@') !== -1) {
    goblin = goblin.split ('@')[0];
  }
  const questAction = {
    type: 'QUEST',
    cmd: `${goblin}.change-${fields.join ('.')}`,
    args: {id: goblinId, newValue: action.value},
  };
  send ('QUEST', questAction);
};

const formMiddleware = send => store => next => action => {
  switch (action.type) {
    case 'rrf/batch':
      for (const a of action.actions) {
        if (a.type === 'rrf/change') {
          if (!a.load) {
            handleChange (send, a);
          }
        }
      }
      return next (action);
    case 'rrf/change':
      if (!action.load) {
        handleChange (send, action);
      }
      return next (action);
    default:
      return next (action);
  }
};

module.exports = transport => {
  const send = (type, action) => {
    if (transport.name === 'electron') {
      transport.send (type, {...action});
      return;
    }
    if (transport.name === 'ws') {
      transport.send (JSON.stringify ({type, action}));
    }
  };

  return {
    formMiddleware: formMiddleware (send),
    questMiddleware: questMiddleware (send),
  };
};
