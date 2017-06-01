// MAIN
import React from 'react';
// UTILS
import pure from 'recompose/pure';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
import {ConnectedRouter} from 'react-router-redux';
import {Route, Switch} from 'react-router';
import comp from './comp';
// ROUTES DEF
//import Routes from 'laboratory/routes/default-routes';

// ROOT component
// RespOf: Providing store and routes to a particular domain
class Root extends React.PureComponent {
  getChildContext () {
    return {
      labId: this.props.labId,
      dispatch: this.props.store.dispatch,
      store: this.props.store,
      theme: this.props.theme,
    };
  }

  static get childContextTypes () {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
      theme: PropTypes.object,
    };
  }

  render () {
    const {store, history} = this.props;
    const Component = comp ('company');
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Switch>
            <Route path="/" component={Component} />
          </Switch>
        </ConnectedRouter>
      </Provider>
    );
  }
}

export default Root;
