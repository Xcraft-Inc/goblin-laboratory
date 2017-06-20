import React from 'react';
import Widget from 'laboratory/widget/index';
import Tabs from 'laboratory/tabs/widget';
const Wired = Widget.Wired (Tabs);
const WiredTabs = Wired ('tabs@default');

const TabsView = ({match}) => (
  <WiredTabs context={match.params.context} workitem={match.params.workitem} />
);

export default TabsView;
