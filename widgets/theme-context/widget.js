//T:2019-02-27
import React from 'react';
import Widget from 'laboratory/widget';
import {Theme} from 'electrum-theme';
import toCss from 'obj-to-css';
import cssKey from 'css-key';
import PropTypes from 'prop-types';
import importer from 'laboratory/importer/';

const themeContextImporter = importer('theme-context');

function jsToCSS(jsStyles) {
  return toCss(
    Object.assign(
      {},
      ...Object.keys(jsStyles).map(className => {
        return {
          [cssKey(className)]: Object.assign(
            {},
            ...Object.keys(jsStyles[className]).map(key => {
              return {[cssKey(key)]: jsStyles[className][key]};
            })
          ),
        };
      })
    )
  );
}

class ThemeContext extends Widget {
  constructor() {
    super(...arguments);
    this._theme = null;
    this._themeContextName = null;
  }

  getChildContext() {
    return {
      theme: this._theme,
      themeContextName: this._themeContextName,
    };
  }

  static get childContextTypes() {
    return {
      theme: PropTypes.object,
      themeContextName: PropTypes.string,
    };
  }

  render() {
    this._themeContextName =
      this.props.frameThemeContext || this.props.themeContext || 'theme';
    const themeContext = themeContextImporter(this._themeContextName);

    this._theme = Theme.create(this.props.theme || themeContext.theme);
    const globalStyles = themeContext.getGlobalStyles(this._theme);
    if (this.props.frameThemeContext && globalStyles['.root']) {
      globalStyles[`.root-${this.props.labId.replace(/@/g, '-')}`] =
        globalStyles['.root'];
      delete globalStyles['.root'];
    }
    const fonts = themeContext.getFonts(this._theme);

    return (
      <React.Fragment>
        <style type="text/css" data-aphrodite />
        {globalStyles && <style type="text/css">{jsToCSS(globalStyles)}</style>}
        {fonts && <style type="text/css">{fonts}</style>}
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default Widget.connect((state, props) => {
  return {
    theme: state.get(`backend.${props.labId}.theme`),
    themeContext: state.get(`backend.${props.labId}.themeContext`),
  };
})(ThemeContext);
