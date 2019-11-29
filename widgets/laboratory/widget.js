import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import Maintenance from 'goblin-laboratory/widgets/maintenance/widget';
import ThemeContext from 'goblin-laboratory/widgets/theme-context/widget';

import importer from 'goblin/importer';
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
      themeContext: 'themeContext',
    };
  }

  renderRoot() {
    const {id, root, rootId, maintenanceMode} = this.props;

    const Root = props => {
      if (props.status && props.status !== 'off') {
        return <Maintenance mode={maintenanceMode} />;
      } else {
        const widgetName = root.split('@')[0];
        const RootWidget = widgetImporter(widgetName);
        const WiredRoot = Widget.Wired(RootWidget)(rootId);
        return <WiredRoot />;
      }
    };

    const WithMaintenance = this.mapWidget(
      Root,
      status => ({status}),
      'backend.workshop.maintenance.status'
    );

    return (
      <ThemeContext labId={id}>
        <WithMaintenance />
      </ThemeContext>
    );
  }

  render() {
    const {id, rootId} = this.props;

    if (!id) {
      return null;
    }

    if (rootId) {
      return this.renderRoot();
    }

    return (
      <ThemeContext
        labId={id}
        themeContext={this.props.themeContext}
        frameThemeContext={this.props.frameThemeContext}
      >
        {this.props.children}
      </ThemeContext>
    );
  }
}

export default Laboratory;
