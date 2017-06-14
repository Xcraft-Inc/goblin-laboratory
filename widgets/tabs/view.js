import React from 'react';
import Tabs from 'laboratory/tabs/widget';

const TabsView = ({match}) => (
  <Tabs
    id="tabs@default"
    context={match.params.context}
    workitem={match.params.workitem}
  />
);

export default TabsView;
