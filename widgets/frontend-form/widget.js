import React from 'react';
import Widget from 'laboratory/widget';
import WithModel from '../with-model/widget';

class FrontendFormWaitLoadedNC extends Widget {
  render() {
    if (!this.props.loaded) {
      return null;
    }
    return this.props.children;
  }
}

const FrontendFormWaitLoaded = Widget.connect((state, props) => {
  if (state.get(props.path) !== undefined) {
    return {
      loaded: true,
    };
  }
  return {};
})(FrontendFormWaitLoadedNC);

export default class FrontendForm extends Widget {
  constructor() {
    super(...arguments);
    this.dispatch({type: 'INIT', initialState: this.props.initialState});
  }

  render() {
    const path = `widgets.${this.widgetId}`;
    return (
      <WithModel model={path}>
        <FrontendFormWaitLoaded path={path}>
          {this.props.children}
        </FrontendFormWaitLoaded>
      </WithModel>
    );
  }
}
