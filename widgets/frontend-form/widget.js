import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import WithModel from '../with-model/widget';

export default class FrontendForm extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    const path = `widgets.${this.props.widgetId}`;

    return <WithModel model={path}>{this.props.children}</WithModel>;
  }
}
