// MAIN
import React from 'react';
// UTILS
import pure from 'recompose/pure';

// ROUTE AND REDUX
const DevTools = process.env.NODE_ENV === 'development'
  ? comp ('dev-tools')
  : null;

import {Provider} from 'react-redux';
import {Router} from 'react-router';

// ROUTES DEF
//const routes = comp ('default-routes');

// ROOT component
// RespOf: Providing store and routes to a particular domain
const root = props => {
  const {store, history, debug} = props;
  return (
    <Provider store={store}>
      <div>
        <Router history={history}>
          {
            // routes
          }
        </Router>
        {DevTools ? <DevTools /> : null}
      </div>
    </Provider>
  );
};

export default pure (root);
