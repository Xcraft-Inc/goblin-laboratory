//T:2019-02-27

import React from 'react';
import PropTypes from 'prop-types';

import {Provider} from 'react-redux';
import {ConnectedRouter} from 'connected-react-router/immutable';
import Widget from 'goblin-laboratory/widgets/widget';
import Laboratory from '../laboratory/widget';
const WiredLab = Widget.Wired(Laboratory)();

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
    const WiredLabWithRoute = Widget.withRoute('/')(WiredLab);
    return (
      <ConnectedRouter history={history}>
        <WiredLabWithRoute id={labId} />
      </ConnectedRouter>
    );
  }

  renderLab() {
    return <WiredLab id={this.props.labId} />;
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
