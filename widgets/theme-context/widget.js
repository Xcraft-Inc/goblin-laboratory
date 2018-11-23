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
    this._theme = null;
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
    const themeContext = themeContextImporter(
      `${this.props.themeContext || 'theme'}`
    );

    this._theme = Theme.create(this.props.theme || themeContext.theme);
    const globalStyles = themeContext.getGlobalStyles(this._theme);
    const fonts = themeContext.getFonts(this._theme);

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

export default Widget.connect((state, props) => {
  return {
    theme: state.get(`backend.${props.labId}.theme`),
    themeContext: state.get(`backend.${props.labId}.themeContext`),
  };
})(ThemeContext);
