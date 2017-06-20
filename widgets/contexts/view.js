import React from 'react';
import Widget from 'laboratory/widget/index';
import Contexts from 'laboratory/contexts/widget';
const Wired = Widget.Wired (Contexts);
const WiredContext = Wired ('contexts@default');
import View from 'laboratory/view';

class ContextsView extends View {
  render () {
    return <WiredContext />;
  }
}

export default ContextsView;
