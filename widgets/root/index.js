//T:2019-02-27

import React from 'react';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
import {ConnectedRouter} from 'connected-react-router/immutable';
import Widget from 'laboratory/widget/index';
import Laboratory from '../laboratory/widget';
const Wired = Widget.Wired(Laboratory);

class Root extends React.PureComponent {
  getChildContext() {
    return {
      labId: this.props.labId,
      dispatch: this.props.store.dispatch,
      store: this.props.store,
    };
  }

  static get childContextTypes() {
    return {
      labId: PropTypes.string,
      dispatch: PropTypes.func,
      store: PropTypes.object,
    };
  }

  render() {
    const {store, history, labId} = this.props;
    const WiredLaboratory = Widget.withRoute('/')(Wired(labId));
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <WiredLaboratory />
        </ConnectedRouter>
      </Provider>
    );
  }
}

export default Root;
