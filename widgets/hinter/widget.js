import React from 'react';
import Widget from 'laboratory/widget';
import importer from 'laboratory/importer/';
const widgetImporter = importer ('widget');

class Hinter extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  static get wiring () {
    return {
      id: 'id',
      type: 'type',
    };
  }

  render () {
    const {id, type} = this.props;
    const ResultView = widgetImporter (`${type}-hinter`);
    const wireResultView = Widget.Wired (ResultView);
    const WiredResultView = wireResultView (id);
    return <WiredResultView />;
  }
}

export default Hinter;
