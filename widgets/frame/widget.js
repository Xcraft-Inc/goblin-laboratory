//T:2019-02-27
import React from 'react';
import PropTypes from 'prop-types';

import Laboratory from '../laboratory/widget';
import {Provider} from 'react-redux';

class Frame extends React.PureComponent {
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
    const {labId, themeContext} = this.props;

    return (
      <div className={`root-${labId.replace(/@/g, '-')}`}>
        <Provider store={this.props.store}>
          <Laboratory id={labId} frameThemeContext={themeContext}>
            {this.props.children}
          </Laboratory>
        </Provider>
      </div>
    );
  }
}

export default Frame;
