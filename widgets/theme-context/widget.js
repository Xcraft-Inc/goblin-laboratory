import React from 'react';
import Widget from 'laboratory/widget';
import {Theme} from 'electrum-theme';
import {Helmet} from 'react-helmet';
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

    const themeContext = this.props.themeContext || 'theme';
    this._themeContext = themeContextImporter(`${themeContext}`);
  }

  static get wiring() {
    return {
      theme: 'theme',
      themeContext: 'themeContext',
    };
  }

  getChildContext() {
    return {
      theme: this._theme,
    };
  }

  static get childContextTypes() {
    return {
      theme: PropTypes.object,
    };
  }

  render() {
    this._theme = Theme.create(this.props.theme || this._themeContext.theme);
    const globalStyles = this._themeContext.getGlobalStyles(this._theme);
    const fonts = this._themeContext.getFonts(this._theme);

    return (
      <React.Fragment>
        {globalStyles && (
          <Helmet>
            <style>{jsToCSS(globalStyles)}</style>
          </Helmet>
        )}
        {fonts && (
          <Helmet>
            <style>{fonts}</style>
          </Helmet>
        )}
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default ThemeContext;
