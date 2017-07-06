import React from 'react';
import Widget from 'laboratory/widget';
import Tabs from 'laboratory/tabs/widget';
const wireTabs = Widget.Wired (Tabs);

class TabsView extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  render () {
    const {isDisplayed, context} = this.props;
    if (!isDisplayed) {
      return null;
    }
    const WiredTabs = wireTabs (`tabs@${this.context.labId}`);
    return <WiredTabs context={context} />;
  }
}

export default TabsView;
