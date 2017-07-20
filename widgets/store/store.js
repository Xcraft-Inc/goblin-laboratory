import {applyMiddleware, compose, createStore} from 'redux';
import {routerMiddleware} from 'react-router-redux';
import thunk from 'redux-thunk';

const rootReducer = require ('laboratory/store/root-reducer').default;
const ipcRenderer = require ('electron').ipcRenderer;

const questMiddleware = store => next => action => {
  if (action.type === 'QUEST') {
    ipcRenderer.send ('QUEST', {...action});
  } else {
    return next (action);
  }
};

//TODO: better handling of model/service field
const handleChange = action => {
  const model = action.model.replace ('models.', '');
  const field = model.split ('.')[1];
  const goblinId = model.split ('.')[0];
  let goblin = goblinId;
  if (goblin.indexOf ('@') !== -1) {
    goblin = goblin.split ('@')[0];
  }
  const quest = {
    type: 'QUEST',
    cmd: `${goblin}.change-${field}`,
    args: {id: goblinId, newValue: action.value},
  };
  ipcRenderer.send ('QUEST', {...quest});
};

const formMiddleware = store => next => action => {
  switch (action.type) {
    case 'rrf/batch':
      for (const a of action.actions) {
        if (a.type === 'rrf/change') {
          if (!a.load) {
            handleChange (action);
          }
        }
      }
      return next (action);
    case 'rrf/change':
      if (!action.load) {
        handleChange (action);
      }
      return next (action);
    default:
      return next (action);
  }
};

export default function configureStore (initialState, history) {
  const routerHistory = routerMiddleware (history);

  const composeEnhancers =
    (process.env.NODE_ENV !== 'production' &&
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;

  const finalCreateStore = composeEnhancers (
    // Middleware you want to use in development:
    applyMiddleware (thunk, routerHistory, questMiddleware, formMiddleware)
  ) (createStore);

  const store = finalCreateStore (rootReducer, initialState);
  if (module.hot) {
    module.hot.accept ('laboratory/store/root-reducer', () => {
      const nextRootReducer = require ('laboratory/store/root-reducer').default;
      store.replaceReducer (nextRootReducer);
    });
  }
  return store;
}
