// MAIN
import React from 'react';
// UTILS
import pure from 'recompose/pure';

import {Provider} from 'react-redux';
import {ConnectedRouter} from 'react-router-redux';
import Hello from 'venture-trade-company/hello';
// ROUTES DEF
import Routes from 'laboratory/routes/default-routes';

// ROOT component
// RespOf: Providing store and routes to a particular domain
const root = props => {
  const {store, history, debug} = props;
  return (
    <Provider store={store}>
      <Hello />
    </Provider>
  );
};

export default pure (root);
