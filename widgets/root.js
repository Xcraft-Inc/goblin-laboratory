// MAIN
import React from 'react';
// UTILS
import pure from 'recompose/pure';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
//import {ConnectedRouter} from 'react-router-redux';

import Venture from 'venture-trade-company/venture';
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
    const {store} = this.props;
    return (
      <Provider store={store}>
        <Venture id="venture" />
      </Provider>
    );
  }
}

export default Root;
