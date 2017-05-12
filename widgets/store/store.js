import {applyMiddleware, compose, createStore} from 'redux';
import {persistState} from 'redux-devtools';
import {routerMiddleware} from 'react-router-redux';
import thunk from 'redux-thunk';
import DevTools from 'laboratory/devtools';

const rootReducer = env ('rootReducer');
const history = env ('configureHistory').history;
function getDebugSessionKey () {
  // You can write custom logic here!
  // By default we try to read the key from ?debug_session=<key> in the address bar
  const matches = window.location.href.match (/[?&]debug_session=([^&]+)\b/);
  return matches && matches.length > 0 ? matches[1] : null;
}
const routerHistory = routerMiddleware (history);
const finalCreateStore = compose (
  // Middleware you want to use in development:
  applyMiddleware (thunk, routerHistory),
  // Required! Enable Redux DevTools with the monitors you chose
  DevTools.instrument (),
  // Lets you write ?debug_session=<key> in address bar to persist debug sessions
  persistState (getDebugSessionKey ())
) (createStore);
export default function configureStore (initialState) {
  const store = finalCreateStore (rootReducer, initialState);
  if (module.hot) {
    module.hot.accept ('../reducers/rootReducer', () => {
      const nextRootReducer = env ('rootReducer');
      store.replaceReducer (nextRootReducer);
    });
  }
  console.dir (store.getState ());
  return store;
}
