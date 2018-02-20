import {applyMiddleware, compose, createStore} from 'redux';
import {routerMiddleware} from 'react-router-redux';
import thunk from 'redux-thunk';
import middlewares from './middlewares';

const rootReducer = require('laboratory/store/root-reducer').default;

export default function configureStore(initialState, history, transport) {
  const {formMiddleware, questMiddleware} = middlewares(transport);
  const routerHistory = routerMiddleware(history);

  const composeEnhancers =
    (process.env.NODE_ENV !== 'production' &&
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;

  const finalCreateStore = composeEnhancers(
    // Middleware you want to use in development:
    applyMiddleware(thunk, routerHistory, questMiddleware, formMiddleware)
  )(createStore);

  const store = finalCreateStore(rootReducer, initialState);
  if (module.hot) {
    module.hot.accept('laboratory/store/root-reducer', () => {
      const nextRootReducer = require('laboratory/store/root-reducer').default;
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
}
