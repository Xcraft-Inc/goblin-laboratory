import React from 'react';
import Widget from 'laboratory/widget';
import Contexts from 'laboratory/contexts/widget';
const wireContexts = Widget.Wired (Contexts);

class ContextsView extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  render () {
    const {isDisplayed} = this.props;
    if (!isDisplayed) {
      return null;
    }
    const WiredContexts = wireContexts (`contexts@${this.context.labId}`);
    return <WiredContexts />;
  }
}

export default ContextsView;
