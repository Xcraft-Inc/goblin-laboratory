//T:2019-02-27

import React from 'react';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
import Laboratory from '../laboratory/widget';

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

  renderLab() {
    return <Laboratory id={this.props.labId} />;
  }

  renderContent() {
    return this.renderLab();
  }

  render() {
    return <Provider store={this.props.store}>{this.renderContent()}</Provider>;
  }
}

export default Root;
