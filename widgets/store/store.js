import {applyMiddleware, compose, createStore} from 'redux';
import {routerMiddleware} from 'react-router-redux';
import thunk from 'redux-thunk';

import rootReducer from 'laboratory/store/root-reducer';
const ipcRenderer = require ('electron').ipcRenderer;

const questMiddleware = store => next => action => {
  if (action.type === 'QUEST') {
    ipcRenderer.send ('QUEST', {...action});
  } else {
    return next (action);
  }
};

export default function configureStore (initialState, history) {
  const routerHistory = routerMiddleware (history);
  const finalCreateStore = compose (
    // Middleware you want to use in development:
    applyMiddleware (thunk, routerHistory, questMiddleware)
  ) (createStore);

  const store = finalCreateStore (
    rootReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ &&
      window.__REDUX_DEVTOOLS_EXTENSION__ (),
    initialState
  );
  /*if (module.hot) {
    module.hot.accept ('laboratory/store/root-reducer', () => {
      const nextRootReducer = env ('rootReducer');
      store.replaceReducer (nextRootReducer);
    });
  }
  console.dir (store.getState ());*/
  return store;
}
