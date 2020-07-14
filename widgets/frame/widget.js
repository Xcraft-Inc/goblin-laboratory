//T:2019-02-27
import React from 'react';
import PropTypes from 'prop-types';

import ThemeContext from '../theme-context/widget';
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
    const {labId, store, currentTheme, themeContext, desktopId} = this.props;

    return (
      <div
        className={`root-${labId.replace(/@/g, '-')}`}
        style={this.props.style}
      >
        <Provider store={store}>
          <ThemeContext
            labId={labId}
            themeContext={themeContext}
            currentTheme={currentTheme}
          >
            {this.props.children}
          </ThemeContext>
        </Provider>
      </div>
    );
  }
}

export default Frame;
