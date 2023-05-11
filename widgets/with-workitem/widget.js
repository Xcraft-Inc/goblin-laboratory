import React from 'react';
import PropTypes from 'prop-types';
import Widget from 'goblin-laboratory/widgets/widget';
import WithReadonly from '../with-readonly/widget.js';

export default class WithWorkitem extends Widget {
  constructor() {
    super(...arguments);
  }

  getChildContext() {
    return {
      id: this.props.id,
      entityId: this.props.entityId,
      dragServiceId: this.props.dragServiceId,
    };
  }

  static get childContextTypes() {
    return {
      id: PropTypes.string,
      entityId: PropTypes.string,
      dragServiceId: PropTypes.string,
    };
  }

  render() {
    return (
      <WithReadonly readonly={this.props.readonly}>
        {this.props.children}
      </WithReadonly>
    );
  }
}
