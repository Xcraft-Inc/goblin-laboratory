// MAIN
import React from 'react';
// UTILS
import pure from 'recompose/pure';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
//import {ConnectedRouter} from 'react-router-redux';
import Hello from 'venture-trade-company/hello';
// ROUTES DEF
//import Routes from 'laboratory/routes/default-routes';

// ROOT component
// RespOf: Providing store and routes to a particular domain
class Root extends React.PureComponent {
  getChildContext () {
    return {labId: this.props.labId, dispatch: this.props.store.dispatch};
  }

  static get childContextTypes () {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
    };
  }

  render () {
    const {store, history, debug} = this.props;

    return (
      <Provider store={store}>
        <Hello />
      </Provider>
    );
  }
}

export default Root;
