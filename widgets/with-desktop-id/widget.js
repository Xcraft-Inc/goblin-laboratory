import React from 'react';
import PropTypes from 'prop-types';
import Widget from 'goblin-laboratory/widgets/widget';
import DesktopIdContext from './context.js';

export default class WithDesktopId extends Widget {
  getChildContext() {
    return {
      desktopId: this.props.desktopId,
    };
  }

  static get childContextTypes() {
    return {
      desktopId: PropTypes.string,
    };
  }

  render() {
    return (
      <DesktopIdContext.Provider value={this.props.desktopId}>
        {this.props.children}
      </DesktopIdContext.Provider>
    );
  }
}
