import React from 'react';
import PropTypes from 'prop-types';
import Widget from 'goblin-laboratory/widgets/widget';
import ReadonlyContext from './context.js';

export default class WithReadonly extends Widget {
  getChildContext() {
    return {
      readonly: this.props.readonly,
    };
  }

  static get childContextTypes() {
    return {
      readonly: PropTypes.bool,
    };
  }

  render() {
    return (
      <ReadonlyContext.Provider value={this.props.readonly}>
        {this.props.children}
      </ReadonlyContext.Provider>
    );
  }
}
