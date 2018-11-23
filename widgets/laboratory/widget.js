import React from 'react';
import Widget from 'laboratory/widget';
import Maintenance from 'laboratory/maintenance/widget';
import ThemeContext from 'laboratory/theme-context/widget';

import importer from '../importer/';
const widgetImporter = importer('widget');

class Laboratory extends Widget {
  constructor() {
    super(...arguments);
  }

  static get wiring() {
    return {
      id: 'id',
      root: 'root',
      rootId: 'rootId',
      theme: 'theme',
    };
  }

  render() {
    const {id, root, rootId, maintenanceMode} = this.props;

    if (!id) {
      return null;
    }

    if (!rootId) {
      return null;
    }

    const widgetName = root.split('@')[0];
    const RootWidget = widgetImporter(widgetName);
    const WiredRoot = Widget.Wired(RootWidget)(rootId);

    const Root = props => {
      if (props.status && props.status !== 'off') {
        return <Maintenance mode={maintenanceMode} />;
      } else {
        return <WiredRoot />;
      }
    };

    const WithMaintenance = this.mapWidget(
      Root,
      status => {
        return {status};
      },
      'backend.workshop.maintenance.status'
    );

    return (
      <ThemeContext labId={id}>
        <WithMaintenance />
      </ThemeContext>
    );
  }
}

export default Laboratory;
