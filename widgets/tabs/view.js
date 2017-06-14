import React from 'react';
import Tabs from 'laboratory/tabs/widget';

const TabsView = ({match}) => <Tabs context={match.params.context} />;

export default TabsView;
