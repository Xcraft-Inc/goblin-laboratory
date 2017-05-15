import {applyMiddleware, compose, createStore} from 'redux';
import {persistState} from 'redux-devtools';
import {routerMiddleware} from 'react-router-redux';
import thunk from 'redux-thunk';

import rootReducer from 'laboratory/store/root-reducer';

function getDebugSessionKey () {
  // You can write custom logic here!
  // By default we try to read the key from ?debug_session=<key> in the address bar
  const matches = window.location.href.match (/[?&]debug_session=([^&]+)\b/);
  return matches && matches.length > 0 ? matches[1] : null;
}

export default function configureStore (initialState, history) {
  const routerHistory = routerMiddleware (history);
  const finalCreateStore = compose (
    // Middleware you want to use in development:
    applyMiddleware (thunk, routerHistory),
    // Lets you write ?debug_session=<key> in address bar to persist debug sessions
    persistState (getDebugSessionKey ())
  ) (createStore);

  const store = finalCreateStore (rootReducer, initialState);
  /*if (module.hot) {
    module.hot.accept ('laboratory/store/root-reducer', () => {
      const nextRootReducer = env ('rootReducer');
      store.replaceReducer (nextRootReducer);
    });
  }
  console.dir (store.getState ());*/
  return store;
}
