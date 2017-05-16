// MAIN
import React from 'react';
// UTILS
import pure from 'recompose/pure';

import {Provider} from 'react-redux';
import {ConnectedRouter} from 'react-router-redux';

// ROUTES DEF
import Routes from 'laboratory/routes/default-routes';

// ROOT component
// RespOf: Providing store and routes to a particular domain
const root = props => {
  const {store, history, debug} = props;
  return (
    <Provider store={store}>
      <div>
        <ConnectedRouter history={history}>
          <Routes />
        </ConnectedRouter>
      </div>
    </Provider>
  );
};

export default pure (root);
