import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import Maintenance from 'goblin-laboratory/widgets/maintenance/widget';
import DisconnectOverlay from '../disconnect-overlay/widget';
import ThemeContext from 'goblin-laboratory/widgets/theme-context/widget';

import importer from 'goblin_importer';
const widgetImporter = importer('widget');

class LaboratoryNC extends Widget {
  constructor() {
    super(...arguments);
  }

  renderContent() {
    const {status, root, rootId, isDisconnected, message} = this.props;
    if (status && status !== 'off') {
      return <Maintenance />;
    } else {
      const widgetName = root.split('@')[0];
      const RootWidget = widgetImporter(widgetName);
      if (isDisconnected) {
        return (
          <DisconnectOverlay message={message}>
            <RootWidget id={rootId} />
          </DisconnectOverlay>
        );
      } else {
        return <RootWidget id={rootId} />;
      }
    }
  }

  render() {
    const {id, root, theme, themeContext, titlebar, titlebarId} = this.props;
    if (!root) {
      // Laboratory not loaded
      return null;
    }
    if (titlebar) {
      const TitlebarWidget = widgetImporter(titlebar);
      return (
        <ThemeContext
          labId={id}
          currentTheme={theme}
          themeContext={themeContext}
        >
          <TitlebarWidget id={titlebarId}>
            {this.renderContent()}
          </TitlebarWidget>
        </ThemeContext>
      );
    } else {
      return (
        <ThemeContext
          labId={id}
          currentTheme={theme}
          themeContext={themeContext}
        >
          {this.renderContent()}
        </ThemeContext>
      );
    }
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
    titlebar: labState.get('titlebar'),
    titlebarId: labState.get('titlebarId'),
    theme: labState.get('theme'),
    themeContext: labState.get('themeContext'),
    status: state.get('backend.workshop.maintenance.status'),
    isDisconnected: state.get('network.disconnected'),
    message: state.get('network.message'),
  };
})(LaboratoryNC);

export default Laboratory;
