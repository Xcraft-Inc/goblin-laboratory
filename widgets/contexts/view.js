import React from 'react';
import Widget from 'laboratory/widget/index';
import Contexts from 'laboratory/contexts/widget';
const Wired = Widget.Wired (Contexts);
const WiredContext = Wired ('contexts@default');
const ContextsView = props => <WiredContext />;

export default ContextsView;
