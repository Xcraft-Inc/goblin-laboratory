import React from 'react';
import Widget from 'laboratory/widget/index';
import Tabs from 'laboratory/tabs/widget';
const Wired = Widget.Wired (Tabs);
const WiredTabs = Wired ('tabs@default');
import View from 'laboratory/view';

class TabsView extends View {
  shouldComponentUpdate (nP) {
    return nP.match.params !== this.props.match.params;
  }

  render () {
    const {match} = this.props;
    return (
      <WiredTabs
        context={match.params.context}
        workitem={match.params.workitem}
      />
    );
  }
}

export default TabsView;
