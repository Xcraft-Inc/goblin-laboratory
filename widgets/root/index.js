//T:2019-02-27

import React from 'react';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
import {ConnectedRouter} from 'connected-react-router/immutable';
import Laboratory from '../laboratory/widget';
import {withRoute} from '../with-route/with-route.js';

const LabWithRoute = withRoute('/')(Laboratory);

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

  renderLabWithRouter() {
    const {history, labId} = this.props;
    return (
      <ConnectedRouter history={history}>
        <LabWithRoute id={labId} />
      </ConnectedRouter>
    );
  }

  renderLab() {
    return <Laboratory id={this.props.labId} />;
  }

  renderContent() {
    if (this.props.useRouter) {
      return this.renderLabWithRouter();
    }
    return this.renderLab();
  }

  render() {
    return <Provider store={this.props.store}>{this.renderContent()}</Provider>;
  }
}

export default Root;
