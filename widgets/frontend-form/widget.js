import React from 'react';
import Widget from 'laboratory/widget';
import WithModel from '../with-model/widget';

export default class FrontendForm extends Widget {
  constructor() {
    super(...arguments);
    this.dispatch({type: 'INIT', initialState: this.props.initialState});
  }

  render() {
    // TODO: should not render when the state is not initialised
    return (
      <WithModel model={`widgets.${this.widgetId}`}>
        {this.props.children}
      </WithModel>
    );
  }
}
