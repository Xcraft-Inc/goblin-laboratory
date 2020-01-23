//T:2019-02-27
import React from 'react';
import Widget from 'goblin-laboratory/widgets/widget';
import {Theme} from 'electrum-theme';
import PropTypes from 'prop-types';
import importer from 'goblin_importer';
import jsToCSS from './js-to-css.js';

const themeContextImporter = importer('theme-context');

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
        {/* // This <style> is not necessary without shadow dom and causes errors in aphrodite after unmount and remount */}
        {/* <style type="text/css" data-aphrodite /> */}
        {globalStyles && (
          <style
            type="text/css"
            dangerouslySetInnerHTML={{__html: jsToCSS(globalStyles)}}
          />
        )}
        {fonts && (
          <style type="text/css" dangerouslySetInnerHTML={{__html: fonts}} />
        )}
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
