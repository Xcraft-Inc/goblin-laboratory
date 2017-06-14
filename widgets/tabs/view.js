import React from 'react';
import Tabs from 'laboratory/tabs/widget';

const TabsView = ({match}) => (
  <Tabs id="tabs@default" context={match.params.context} />
);

export default TabsView;
