import React from 'react';
import PropTypes from 'prop-types';
import Widget from 'laboratory/widget';

export default class FieldsView extends Widget {
  constructor() {
    super(...arguments);
  }

  getChildContext() {
    return {
      model: this.props.model,
    };
  }

  static get childContextTypes() {
    return {
      model: PropTypes.string,
    };
  }

  render() {
    return <React.Fragment>{this.props.children}</React.Fragment>;
  }
}
