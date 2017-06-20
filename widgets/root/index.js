import React from 'react';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';

import Widget from 'laboratory/widget/index';
import Laboratory from '../laboratory/widget';
const Wired = Widget.Wired (Laboratory);

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
    const {store, history, labId} = this.props;
    const WiredLaboratory = Wired (labId, this.props);
    return (
      <Provider store={store}>
        <WiredLaboratory />
      </Provider>
    );
  }
}

export default Root;
