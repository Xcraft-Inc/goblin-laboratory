//T:2019-02-27

import React from 'react';
import PropTypes from 'prop-types';
import Widget from 'goblin-laboratory/widgets/widget';

class View extends Widget {
  constructor() {
    super(...arguments);
  }

  getChildContext() {
    return {
      desktopId: this.props.desktopId,
      contextId: this.props.context,
    };
  }

  static get childContextTypes() {
    return {
      desktopId: PropTypes.string,
      contextId: PropTypes.string,
    };
  }

  render() {
    return <div>Missing view render implementation</div>;
  }
}

export default View;
