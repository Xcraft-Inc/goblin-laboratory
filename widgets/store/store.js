import {applyMiddleware, compose, createStore} from 'redux';
import {routerMiddleware} from 'connected-react-router/immutable';
import thunk from 'redux-thunk';
import middlewares from './middlewares';

const rootReducer = require('goblin-laboratory/widgets/store/root-reducer')
  .default;

export default function configureStore(initialState, history, send) {
  const {transitMiddleware, formMiddleware, questMiddleware} = middlewares(
    send
  );
  const routerHistory = routerMiddleware(history);

  const composeEnhancers =
    (process.env.NODE_ENV === 'development' &&
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;

  const finalCreateStore = composeEnhancers(
    // Middleware you want to use in development:
    applyMiddleware(
      thunk,
      routerHistory,
      transitMiddleware,
      questMiddleware,
      formMiddleware
    )
  )(createStore);

  const store = finalCreateStore(rootReducer, initialState);
  if (module.hot) {
    module.hot.accept('goblin-laboratory/widgets/store/root-reducer', () => {
      const nextRootReducer = require('goblin-laboratory/widgets/store/root-reducer')
        .default;
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
}
