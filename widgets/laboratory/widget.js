import React from 'react';
import Widget from 'laboratory/widget';
import importer from '../importer/';
const widgetImporter = importer ('widget');

class Laboratory extends Widget {
  constructor () {
    super (...arguments);
  }

  static get wiring () {
    return {
      id: 'id',
      root: 'root',
    };
  }

  render () {
    const {id, root} = this.props;

    if (!id) {
      return null;
    }

    if (!root) {
      return (
        <div>Missing root widget, please use lab.setRoot ({`{widgetId}`})</div>
      );
    }

    const widgetName = root.split ('@')[0];
    const RootWidget = widgetImporter (widgetName);
    const WiredRoot = Widget.Wired (RootWidget) (root);
    return <WiredRoot />;
  }
}

export default Laboratory;
