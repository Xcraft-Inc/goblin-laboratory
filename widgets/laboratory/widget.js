import React from 'react';
import PropTypes from 'prop-types';
import {Theme} from 'electrum-theme';
import Widget from 'laboratory/widget';
import importer from '../importer/';
const widgetImporter = importer ('widget');

class ThemeContext extends React.PureComponent {
  getChildContext () {
    return {
      theme: this.props.theme,
    };
  }

  static get childContextTypes () {
    return {
      theme: PropTypes.object,
    };
  }

  render () {
    return this.props.children;
  }
}

class Laboratory extends Widget {
  constructor () {
    super (...arguments);
  }

  static get wiring () {
    return {
      id: 'id',
      root: 'root',
      theme: 'theme',
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
    return (
      <ThemeContext theme={Theme.create (this.props.theme)}>
        <WiredRoot />
      </ThemeContext>
    );
  }
}

export default Laboratory;
