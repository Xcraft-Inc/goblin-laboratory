import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import Maintenance from 'goblin-laboratory/widgets/maintenance/widget';
import ThemeContext from 'goblin-laboratory/widgets/theme-context/widget';

import importer from 'goblin_importer';
const widgetImporter = importer('widget');

class LaboratoryNC extends Widget {
  constructor() {
    super(...arguments);
  }

  renderContent() {
    {
      const {status, root, rootId} = this.props;
      if (status && status !== 'off') {
        return <Maintenance />;
      } else {
        const widgetName = root.split('@')[0];
        const RootWidget = widgetImporter(widgetName);
        return <RootWidget id={rootId} />;
      }
    }
  }

  render() {
    const {id, root, theme, themeContext} = this.props;
    if (!root) {
      // Laboratory not loaded
      return null;
    }
    return (
      <ThemeContext labId={id} currentTheme={theme} themeContext={themeContext}>
        {this.renderContent()}
      </ThemeContext>
    );
  }
}

const Laboratory = Widget.connect((state, props) => {
  const labState = state.get('backend').get(props.id);
  if (!labState) {
    return {};
  }
  return {
    root: labState.get('root'),
    rootId: labState.get('rootId'),
    theme: labState.get('theme'),
    themeContext: labState.get('themeContext'),
    status: state.get('backend.workshop.maintenance.status'),
  };
})(LaboratoryNC);

export default Laboratory;
