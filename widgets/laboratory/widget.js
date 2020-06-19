import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import Maintenance from 'goblin-laboratory/widgets/maintenance/widget';
import ThemeContext from 'goblin-laboratory/widgets/theme-context/widget';

import importer from 'goblin_importer';
const widgetImporter = importer('widget');

class RootNC extends Widget {
  constructor() {
    super(...arguments);
  }

  render() {
    {
      const {
        status,
        maintenanceMode,
        root,
        rootId,
        themeName,
        themeGen,
      } = this.props;
      if (status && status !== 'off') {
        return <Maintenance mode={maintenanceMode} />;
      } else {
        const widgetName = root.split('@')[0];
        const RootWidget = widgetImporter(widgetName);
        return (
          <RootWidget id={rootId} themeName={themeName} themeGen={themeGen} />
        );
      }
    }
  }
}

const Root = Widget.connect((state, props) => {
  const status = state.get('backend.workshop.maintenance.status');
  const root = state.get(`backend.${props.labId}.root`);
  const rootId = state.get(`backend.${props.labId}.rootId`);
  return {root, rootId, status};
})(RootNC);

class Laboratory extends Widget {
  constructor() {
    super(...arguments);
  }

  static get wiring() {
    return {
      id: 'id',
      rootId: 'rootId',
      theme: 'theme',
      themeGen: 'themeGen',
      themeContext: 'themeContext',
    };
  }

  renderRoot() {
    const {id, maintenanceMode, themeGen, theme} = this.props;

    return (
      <ThemeContext labId={id} themeGen={themeGen}>
        <Root
          labId={id}
          themeName={theme}
          themeGen={themeGen}
          maintenanceMode={maintenanceMode}
        />
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
        themeGen={themeGen}
        themeContext={this.props.themeContext}
        currentTheme={this.props.currentTheme}
        frameThemeContext={this.props.frameThemeContext}
      >
        {this.props.children}
      </ThemeContext>
    );
  }
}

export default Laboratory;
