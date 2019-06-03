import React from 'react';
import PropTypes from 'prop-types';
import Widget from 'laboratory/widget';

export default class FieldsView extends Widget {
  constructor() {
    super(...arguments);
    this.view = {};
    this.register = this.register.bind(this);
  }

  register(fieldPath) {
    this.view[fieldPath] = true;
    console.table(this.view);
  }

  getChildContext() {
    return {
      model: this.props.model,
      register: this.register,
    };
  }

  static get childContextTypes() {
    return {
      model: PropTypes.string,
      register: PropTypes.func,
    };
  }

  render() {
    return <React.Fragment>{this.props.children}</React.Fragment>;
  }
}
