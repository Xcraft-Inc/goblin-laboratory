import React from 'react';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
import Laboratory from '../laboratory/widget';

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
    return (
      <Provider store={store}>
        <Laboratory id={labId} history={history} />
      </Provider>
    );
  }
}

export default Root;
