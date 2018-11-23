import React from 'react';
import {Theme} from 'electrum-theme';
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
      globalStyles: 'globalStyles',
    };
  }

  render() {
    const {id, root, rootId, maintenanceMode, globalStyles} = this.props;

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
      <ThemeContext
        theme={Theme.create(this.props.theme)}
        globalStyles={globalStyles}
      >
        <WithMaintenance />
      </ThemeContext>
    );
  }
}

export default Laboratory;
