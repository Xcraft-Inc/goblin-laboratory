// MAIN
import React from 'react';
// UTILS
import pure from 'recompose/pure';

import {Provider} from 'react-redux';
import {Router} from 'react-router';

// ROUTES DEF
import routes from 'laboratory/routes/default-routes';

// ROOT component
// RespOf: Providing store and routes to a particular domain
const root = props => {
  const {store, history, debug} = props;
  return (
    <Provider store={store}>
      <div>
        <Router history={history}>
          {routes}
        </Router>
      </div>
    </Provider>
  );
};

export default pure (root);
